import "server-only";
import { env } from "@/env";
import { tokenResponseSchema, type TokenResponse } from "@/features/shell/schema";
import { getSession, saveSession, destroySession } from "@/lib/auth/session";

let inFlightRefresh: Promise<TokenResponse | null> | null = null;

async function doRefresh(): Promise<TokenResponse | null> {
  const session = await getSession();
  if (!session?.refresh_token) return null;

  try {
    const res = await fetch(`${env.API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const tokens = tokenResponseSchema.parse(json);
    await saveSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    return tokens;
  } catch {
    return null;
  }
}

export async function refreshTokens(): Promise<TokenResponse | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = doRefresh().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

export { destroySession };