import "server-only";
import { cache } from "react";
import { userOutSchema, type UserOut } from "@/features/shell/schema";
import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import { refreshTokens } from "@/lib/api/refresh";

export const verifySession = cache(async (): Promise<UserOut | null> => {
  const session = await getSession();
  if (!session?.access_token) return null;

  try {
    const user = await apiFetch("/api/v1/auth/me", userOutSchema);
    return user;
  } catch (err) {
    if (err instanceof Error && err.name === "ApiError:Unauthorized") {
      const refreshed = await refreshTokens();
      if (!refreshed) {
        return null;
      }
      try {
        const user = await apiFetch("/api/v1/auth/me", userOutSchema);
        return user;
      } catch {
        return null;
      }
    }
    return null;
  }
});

export type { UserOut };
