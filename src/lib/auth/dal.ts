import "server-only"
import { cache } from "react"
import { userOutSchema, type UserOut } from "@/features/shell/schema"
import { apiFetch } from "@/lib/api/client"
import { getSession } from "@/lib/auth/session"
import { refreshTokens } from "@/lib/api/refresh"

export type VerifySessionOptions = {
  /**
   * Cookie writes are only legal in Server Actions and Route Handlers. Keep
   * this disabled for Server Component rendering; authenticated layouts send
   * expired sessions through `/refresh-session` instead.
   */
  allowRefresh?: boolean
}

export const verifySession = cache(
  async (options: VerifySessionOptions = {}): Promise<UserOut | null> => {
    const allowRefresh = options.allowRefresh ?? false
    const session = await getSession()
    if (!session?.access_token) {
      if (!allowRefresh) return null

      const refreshed = await refreshTokens()
      if (!refreshed) return null

      try {
        return await apiFetch("/api/v1/auth/me", userOutSchema)
      } catch {
        return null
      }
    }

    try {
      const user = await apiFetch("/api/v1/auth/me", userOutSchema)
      return user
    } catch (err) {
      if (
        allowRefresh &&
        err instanceof Error &&
        err.name === "ApiError:Unauthorized"
      ) {
        const refreshed = await refreshTokens()
        if (!refreshed) {
          return null
        }
        try {
          const user = await apiFetch("/api/v1/auth/me", userOutSchema)
          return user
        } catch {
          return null
        }
      }
      return null
    }
  }
)

export type { UserOut }
