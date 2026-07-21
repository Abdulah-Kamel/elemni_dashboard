import "server-only";
import { env } from "@/env";
import { toApiError, ApiErrorImpl } from "./errors";
import type { z } from "zod";
import type { SessionPayload } from "@/features/shell/schema";
import { sessionSchema } from "@/features/shell/schema";
import { logger } from "@/lib/logger";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const BACKOFF_BASE_MS = 200;

async function getAccessToken(): Promise<string | null> {
  try {
    const { getSession } = await import("@/lib/auth/session");
    const session = await getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function getAcceptLanguage(): Promise<string> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("NEXT_LOCALE");
    return localeCookie?.value ?? "ar";
  } catch {
    return "ar";
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type FetchInit = {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  tags?: string[];
  revalidate?: number;
  timeoutMs?: number;
  noAuth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: FetchInit,
): Promise<T> {
  const method = init?.method ?? "GET";
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const isGet = method === "GET";
  const requestId = generateRequestId();

  const headers: Record<string, string> = {
    "Accept-Language": await getAcceptLanguage(),
    "X-Request-ID": requestId,
    ...(init?.headers ?? {}),
  };

  if (!init?.noAuth) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  if (init?.body) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const url = `${env.API_URL}${path}`;
  const fetchOptions: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {
    method,
    headers,
    ...(init?.body ? { body: init.body } : {}),
    signal: AbortSignal.timeout(timeoutMs),
    next: init?.tags || init?.revalidate ? { tags: init.tags, revalidate: init.revalidate } : undefined,
  };

  const start = performance.now();
  logger.api(method, path, requestId, { bodySize: init?.body?.length });

  const attempt = async (): Promise<Response> => {
    try {
      return await fetch(url, fetchOptions);
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new ApiErrorImpl({
          type: "Upstream",
          status: 0,
          message: "Request timeout",
          cause: "timeout",
        });
      }
      throw new ApiErrorImpl({
        type: "Upstream",
        status: 0,
        message: "Network error",
        cause: "network",
      });
    }
  };

  let res = await attempt();

  if (isGet && res.status === 429) {
    for (let i = 0; i < MAX_RETRIES && res.status === 429; i++) {
      await new Promise((r) => setTimeout(r, BACKOFF_BASE_MS * (i + 1)));
      res = await attempt();
    }
  }

  const elapsed = Math.round(performance.now() - start);

  if (!res.ok) {
    const apiErr = await toApiError(res);
    logger.apiError(method, path, requestId, res.status, elapsed, apiErr);
    throw apiErr;
  }

  if (res.status === 204) {
    logger.apiOk(method, path, requestId, res.status, elapsed);
    return undefined as T;
  }

  // Some endpoints (e.g. POST /auth/forgot-password) return 2xx with an
  // empty body. Reading `res.json()` on that throws a SyntaxError that
  // would be reported as "Upstream" — read the text first and only
  // parse when there is something to parse.
  const text = await res.text();
  if (!text) {
    logger.apiOk(method, path, requestId, res.status, elapsed);
    return undefined as T;
  }
  const json: unknown = JSON.parse(text);
  const result = schema.parse(json);
  logger.apiOk(method, path, requestId, res.status, elapsed, result);
  return result;
}

export { ApiErrorImpl as ApiError };
export type { SessionPayload };