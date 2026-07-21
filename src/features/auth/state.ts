import type { ApiError } from "@/lib/api/errors";

/**
 * Form state returned to the client. Either OK (the action redirected —
 * the page is gone) or a structured error the form can render.
 */
export type AuthFormState = {
  ok: boolean;
  error?: { type: ApiError["type"]; messageKey: string; fields?: string[] };
};

export const INITIAL_AUTH_STATE: AuthFormState = { ok: false };
