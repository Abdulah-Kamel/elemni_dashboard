import "server-only"

import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"

/**
 * Redirect an unauthenticated request through the refresh route when a
 * refresh token remains. The route handler can write the rotated cookie;
 * Server Components cannot. If there is no refresh token, sign-out clears
 * any malformed cookie before sending the user to sign-in.
 */
export async function redirectToAuth(
  locale: string,
  nextPath: string
): Promise<never> {
  const session = await getSession()
  const localizedNextPath = nextPath.startsWith(`/${locale}/`)
    ? nextPath
    : nextPath === `/${locale}`
      ? nextPath
      : `/${locale}${nextPath.startsWith("/") ? nextPath : `/${nextPath}`}`
  const encodedNext = encodeURIComponent(localizedNextPath)
  const target = session?.refresh_token
    ? `/${locale}/refresh-session?next=${encodedNext}`
    : `/${locale}/sign-out?next=${encodedNext}`

  redirect(target)
}
