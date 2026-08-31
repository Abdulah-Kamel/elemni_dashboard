import "server-only"
import { env } from "@/env"
import { toApiError, ApiErrorImpl } from "./errors"
import type { z } from "zod"
import type { SessionPayload } from "@/features/shell/schema"
import { logger } from "@/lib/logger"

const DEFAULT_TIMEOUT_MS = 10_000
const MAX_RETRIES = 2
const BACKOFF_BASE_MS = 200

async function getAccessToken(): Promise<string | null> {
  try {
    const { getSession } = await import("@/lib/auth/session")
    const session = await getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

async function getAcceptLanguage(): Promise<string> {
  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get("NEXT_LOCALE")
    return localeCookie?.value ?? "ar"
  } catch {
    return "ar"
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

type FetchInit = {
  method?: string
  body?: string
  headers?: Record<string, string>
  tags?: string[]
  revalidate?: number
  timeoutMs?: number
  noAuth?: boolean
  /**
   * Mutating server actions can refresh an expired access token and persist
   * the rotated session cookie. GETs run during Server Component rendering,
   * where cookies cannot be written, so they intentionally do not refresh.
   */
  refreshOnUnauthorized?: boolean
}

export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: FetchInit
): Promise<T> {
  const method = init?.method ?? "GET"
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const isGet = method === "GET"
  const refreshOnUnauthorized =
    init?.refreshOnUnauthorized ?? (!isGet && !init?.noAuth)
  const requestId = generateRequestId()

  const headers: Record<string, string> = {
    "Accept-Language": await getAcceptLanguage(),
    "X-Request-ID": requestId,
    ...(init?.headers ?? {}),
  }

  if (!init?.noAuth) {
    const accessToken = await getAccessToken()
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`
    }
  }

  if (init?.body) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json"
  }

  const url = `${env.API_URL}${path}`
  const start = performance.now()
  logger.api(method, path, requestId, { bodySize: init?.body?.length })

  const attempt = async (
    requestHeaders: Record<string, string>
  ): Promise<Response> => {
    try {
      const fetchOptions: RequestInit & {
        next?: { tags?: string[]; revalidate?: number }
      } = {
        method,
        headers: requestHeaders,
        ...(init?.body ? { body: init.body } : {}),
        // A retry gets a fresh timeout budget instead of reusing a signal
        // that may have already been aborted by the first request.
        signal: AbortSignal.timeout(timeoutMs),
        next:
          init?.tags || init?.revalidate
            ? { tags: init.tags, revalidate: init.revalidate }
            : undefined,
      }
      return await fetch(url, fetchOptions)
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new ApiErrorImpl({
          type: "Upstream",
          status: 0,
          message: "Request timeout",
          cause: "timeout",
        })
      }
      throw new ApiErrorImpl({
        type: "Upstream",
        status: 0,
        message: "Network error",
        cause: "network",
      })
    }
  }

  const fetchWithRateLimit = async (
    requestHeaders: Record<string, string>
  ): Promise<Response> => {
    let response = await attempt(requestHeaders)

    if (isGet && response.status === 429) {
      for (let i = 0; i < MAX_RETRIES && response.status === 429; i++) {
        await new Promise((r) => setTimeout(r, BACKOFF_BASE_MS * (i + 1)))
        response = await attempt(requestHeaders)
      }
    }

    return response
  }

  let res = await fetchWithRateLimit(headers)

  // Access tokens are short-lived. Server Actions can safely rotate and
  // persist the session cookie, so retry a failed mutation once with the new
  // access token. Server Component GETs opt out and are recovered by the
  // refresh-session route used by the authenticated layouts.
  if (refreshOnUnauthorized && res.status === 401) {
    const { refreshTokens, destroySession } = await import("@/lib/api/refresh")
    const refreshed = await refreshTokens()

    if (refreshed) {
      headers.Authorization = `Bearer ${refreshed.access_token}`
      res = await fetchWithRateLimit(headers)
    }

    if (!refreshed || res.status === 401) {
      // Clear stale credentials before the action redirects to sign-in. A
      // failed refresh means the refresh token is no longer usable.
      try {
        await destroySession()
      } catch {
        // Cookie mutation can fail outside a Server Action/Route Handler;
        // the caller still receives the original Unauthorized response.
      }
    }
  }

  const elapsed = Math.round(performance.now() - start)

  if (!res.ok) {
    const apiErr = await toApiError(res)
    logger.apiError(method, path, requestId, res.status, elapsed, apiErr)
    throw apiErr
  }

  if (res.status === 204) {
    logger.apiOk(method, path, requestId, res.status, elapsed)
    return undefined as T
  }

  // Some endpoints (e.g. POST /auth/forgot-password) return 2xx with an
  // empty body. Reading `res.json()` on that throws a SyntaxError that
  // would be reported as "Upstream" — read the text first and only
  // parse when there is something to parse.
  const text = await res.text()
  if (!text) {
    logger.apiOk(method, path, requestId, res.status, elapsed)
    return undefined as T
  }
  const json: unknown = JSON.parse(text)
  const result = schema.parse(json)
  logger.apiOk(method, path, requestId, res.status, elapsed, result)
  return result
}

export { ApiErrorImpl as ApiError }
export type { SessionPayload }
