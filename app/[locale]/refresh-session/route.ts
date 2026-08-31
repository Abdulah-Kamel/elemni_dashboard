import { NextResponse } from "next/server"
import { validateNextParam } from "@/features/shell/components/sign-in-redirect"
import { destroySession, getSession } from "@/lib/auth/session"
import { refreshTokens } from "@/lib/api/refresh"

/**
 * Refreshes an expired access token in a Route Handler, where Next.js allows
 * the rotated iron-session cookie to be written, then returns the user to the
 * page that originally required authentication.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const url = new URL(request.url)
  const validatedNext = validateNextParam(
    url.searchParams.get("next") ?? undefined,
    locale
  )
  const next = validatedNext.startsWith(`/${locale}/`)
    ? validatedNext
    : validatedNext === `/${locale}`
      ? validatedNext
      : `/${locale}${validatedNext.startsWith("/") ? validatedNext : `/${validatedNext}`}`
  const signInUrl = new URL(`/${locale}/sign-in`, request.url)
  signInUrl.searchParams.set("next", next)
  signInUrl.searchParams.set("reason", "expired")

  const session = await getSession()
  if (!session?.refresh_token) {
    await destroySession()
    return NextResponse.redirect(signInUrl, 303)
  }

  const refreshed = await refreshTokens()
  if (!refreshed) {
    await destroySession()
    return NextResponse.redirect(signInUrl, 303)
  }

  return NextResponse.redirect(new URL(next, request.url), 303)
}
