import "server-only"
import { env } from "@/env"
import {
  tokenResponseSchema,
  type TokenResponse,
} from "@/features/shell/schema"
import { getSession, saveSession, destroySession } from "@/lib/auth/session"

// Refresh-token rotation is per session. A single process-wide promise would
// allow concurrent users to share one user's refreshed credentials, so key
// the dedupe map by the exact refresh token being rotated.
const inFlightRefresh = new Map<string, Promise<TokenResponse | null>>()

async function doRefresh(refreshToken: string): Promise<TokenResponse | null> {
  try {
    const res = await fetch(`${env.API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) return null

    const json = await res.json()
    const tokens = tokenResponseSchema.parse(json)
    await saveSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })
    return tokens
  } catch {
    return null
  }
}

export async function refreshTokens(): Promise<TokenResponse | null> {
  const session = await getSession()
  const refreshToken = session?.refresh_token
  if (!refreshToken) return null

  const existing = inFlightRefresh.get(refreshToken)
  if (existing) return existing

  const refreshPromise = doRefresh(refreshToken).finally(() => {
    inFlightRefresh.delete(refreshToken)
  })
  inFlightRefresh.set(refreshToken, refreshPromise)

  return refreshPromise
}

export { destroySession }
