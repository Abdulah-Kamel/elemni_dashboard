import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

/**
 * GET /{locale}/sign-out
 *
 * The teacher (or any) layout runs in a Server Component, where cookies
 * are read-only — a `cookieStore.delete()` call there throws
 * "Cookies can only be modified in a Server Action or Route Handler".
 *
 * So when a layout needs to clear the session (e.g. wrong-role bounce),
 * it redirects here. This route handler is allowed to mutate cookies
 * and finishes by sending the browser to the sign-in page.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const url = new URL(request.url);
  const reason = url.searchParams.get("reason");
  const next = url.searchParams.get("next");

  await destroySession();

  const signInUrl = new URL(`/${locale}/sign-in`, request.url);
  if (reason) signInUrl.searchParams.set("reason", reason);
  else if (next) signInUrl.searchParams.set("next", next);

  return NextResponse.redirect(signInUrl, { status: 303 });
}