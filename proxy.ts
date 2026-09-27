import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export default function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const requestWithPath = new NextRequest(request, { headers: requestHeaders });
  const response = intlMiddleware(requestWithPath);
  if (response instanceof NextResponse) return response;
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
