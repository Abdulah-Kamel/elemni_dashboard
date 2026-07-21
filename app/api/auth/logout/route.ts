import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth/session";
import { env } from "@/env";
import { ApiErrorImpl } from "@/lib/api/errors";
import { refreshTokens } from "@/lib/api/refresh";

export async function POST() {
  const session = await getSession();
  if (!session?.refresh_token) {
    return NextResponse.json(
      { ok: false, error: { type: "Unauthorized", message: "No active session" } },
      { status: 200 },
    );
  }

  const result = await doLogout(session.access_token, session.refresh_token);

  if (result === "expired") {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      return NextResponse.json(
        { ok: false, error: { type: "Unauthorized", message: "Session expired" } },
        { status: 200 },
      );
    }
    const retryResult = await doLogout(refreshed.access_token, refreshed.refresh_token);
    if (retryResult !== "ok") {
      return NextResponse.json(
        { ok: false, error: { type: "Upstream", message: "Logout failed after refresh" } },
        { status: 200 },
      );
    }
  } else if (result !== "ok") {
    const errorType = result === "upstream" ? "Upstream" : "Upstream";
    return NextResponse.json(
      { ok: false, error: { type: errorType, message: "Logout failed" } },
      { status: 200 },
    );
  }

  await destroySession();
  return NextResponse.json({ ok: true }, { status: 200 });
}

async function doLogout(
  accessToken: string | undefined,
  refreshToken: string,
): Promise<"ok" | "expired" | "upstream"> {
  try {
    const res = await fetch(`${env.API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 204) return "ok";
    if (res.status === 401) return "expired";
    return "upstream";
  } catch {
    return "upstream";
  }
}