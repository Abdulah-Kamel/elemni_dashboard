"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { apiFetch } from "@/lib/api/client"
import { ApiErrorImpl, type ApiError } from "@/lib/api/errors"
import { endpoints } from "@/lib/api/endpoints"
import { saveSession, destroySession, getSession } from "@/lib/auth/session"
import { validateNextParam } from "@/features/shell/components/sign-in-redirect"
import { logger } from "@/lib/logger"
import {
  loginResponseSchema,
  userRegisterSchema,
  userOutSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from "@/features/shell/schema"
import {
  signInFormSchema,
  signUpFormSchema,
  forgotPasswordFormSchema,
  resetPasswordFormSchema,
} from "@/features/auth/schema"
import type { AuthFormState } from "@/features/auth/state"

function toFormError(err: unknown): AuthFormState["error"] {
  if (err instanceof ApiErrorImpl) {
    return {
      type: err.type,
      messageKey: errorKeyFor(err.type),
      fields: err.fields,
    }
  }
  return { type: "Upstream", messageKey: "error_upstream" }
}

function errorKeyFor(type: ApiError["type"]): string {
  switch (type) {
    case "Unauthorized":
      return "error_invalid_credentials"
    case "Validation":
      return "error_validation"
    case "RateLimited":
      return "error_rate_limited"
    case "Forbidden":
      return "error_forbidden"
    case "NotFound":
      return "error_not_found"
    case "Conflict":
      return "error_conflict"
    default:
      return "error_upstream"
  }
}

function readFormString(formData: FormData, name: string): string {
  const v = formData.get(name)
  return typeof v === "string" ? v : ""
}

function readSafeNext(formData: FormData, locale: string): string {
  const next = readFormString(formData, "next")
  return validateNextParam(next || undefined, locale)
}

/**
 * Wraps a redirect so it doesn't get caught by our error-mapping `catch`
 * blocks below. Next.js's `redirect()` throws an internal error; we rethrow
 * it through a dedicated try/catch so the outer `catch` only sees real
 * failures (network errors, API errors, zod failures).
 */
function redirectOrRethrow(fn: () => never): never {
  try {
    fn()
    // unreachable — redirect always throws
    throw new Error("redirect() did not throw")
  } catch (err) {
    if (isRedirectError(err)) throw err
    throw err
  }
}

// --- sign in ----------------------------------------------------------------

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const locale = readFormString(formData, "locale") || "ar"
  const parsed = signInFormSchema.safeParse({
    email: readFormString(formData, "email"),
    password: readFormString(formData, "password"),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        type: "Validation",
        messageKey: "error_validation",
        fields: parsed.error.issues.map((i) => i.path.join(".")),
      },
    }
  }

  logger.action("signInAction", { email: parsed.data.email })
  const start = performance.now()

  try {
    const res = await apiFetch(endpoints.auth.login, loginResponseSchema, {
      method: "POST",
      body: JSON.stringify(parsed.data),
      noAuth: true,
      headers: { "Accept-Language": locale },
    })

    await saveSession({
      access_token: res.access_token,
      refresh_token: res.refresh_token,
    })
  } catch (err) {
    if (isRedirectError(err)) throw err
    const elapsed = Math.round(performance.now() - start)
    logger.actionError("signInAction", err, elapsed)
    return { ok: false, error: toFormError(err) }
  }

  const elapsed = Math.round(performance.now() - start)
  logger.actionDone("signInAction", undefined, elapsed)

  // Outside the try — the redirect must propagate, not become an error state.
  redirectOrRethrow(() => redirect(readSafeNext(formData, locale)))
}

// --- sign up ----------------------------------------------------------------

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const locale = readFormString(formData, "locale") || "ar"
  const parsed = signUpFormSchema.safeParse({
    name: readFormString(formData, "name"),
    email: readFormString(formData, "email"),
    phone_number: readFormString(formData, "phone_number"),
    password: readFormString(formData, "password"),
    confirm_password: readFormString(formData, "confirm_password"),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        type: "Validation",
        messageKey: "error_validation",
        fields: parsed.error.issues.map((i) => i.path.join(".")),
      },
    }
  }

  const body = userRegisterSchema.parse({
    email: parsed.data.email,
    password: parsed.data.password,
    name: parsed.data.name,
    phone_number: parsed.data.phone_number,
  })

  logger.action("signUpAction", { email: body.email })
  const start = performance.now()

  try {
    await apiFetch(endpoints.auth.register, userOutSchema, {
      method: "POST",
      body: JSON.stringify(body),
      noAuth: true,
      headers: { "Accept-Language": locale },
    })
  } catch (err) {
    if (isRedirectError(err)) throw err
    const elapsed = Math.round(performance.now() - start)
    logger.actionError("signUpAction", err, elapsed)
    return { ok: false, error: toFormError(err) }
  }

  // The API contract doesn't return tokens on register — auto-login by
  // calling the login endpoint with the credentials the user just typed.
  try {
    const login = await apiFetch(endpoints.auth.login, loginResponseSchema, {
      method: "POST",
      body: JSON.stringify({ email: body.email, password: body.password }),
      noAuth: true,
      headers: { "Accept-Language": locale },
    })
    await saveSession({
      access_token: login.access_token,
      refresh_token: login.refresh_token,
    })
  } catch (err) {
    if (isRedirectError(err)) throw err
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("signUpAction", { registered: true, autoLogin: false }, elapsed)
    // Registration succeeded but auto-login failed — fall back to the
    // sign-in page with a `?registered=1` notice.
    redirectOrRethrow(() => redirect(`/${locale}/sign-in?registered=1`))
  }

  const elapsed = Math.round(performance.now() - start)
  logger.actionDone("signUpAction", undefined, elapsed)
  redirectOrRethrow(() => redirect(readSafeNext(formData, locale)))
}

// --- forgot password --------------------------------------------------------

export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const locale = readFormString(formData, "locale") || "ar"
  const parsed = forgotPasswordFormSchema.safeParse({
    email: readFormString(formData, "email"),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        type: "Validation",
        messageKey: "error_validation",
        fields: parsed.error.issues.map((i) => i.path.join(".")),
      },
    }
  }

  const body = forgotPasswordRequestSchema.parse(parsed.data)
  logger.action("forgotPasswordAction", { email: body.email })
  const start = performance.now()
  try {
    await apiFetch(endpoints.auth.forgotPassword, z.unknown(), {
      method: "POST",
      body: JSON.stringify(body),
      noAuth: true,
      headers: { "Accept-Language": locale },
    })
  } catch (err) {
    if (isRedirectError(err)) throw err
    const elapsed = Math.round(performance.now() - start)
    logger.actionError("forgotPasswordAction", err, elapsed)
    return { ok: false, error: toFormError(err) }
  }

  const elapsed = Math.round(performance.now() - start)
  logger.actionDone("forgotPasswordAction", undefined, elapsed)
  return { ok: true }
}

// --- reset password ---------------------------------------------------------

export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const locale = readFormString(formData, "locale") || "ar"
  const parsed = resetPasswordFormSchema.safeParse({
    token: readFormString(formData, "token"),
    new_password: readFormString(formData, "new_password"),
    confirm_password: readFormString(formData, "confirm_password"),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        type: "Validation",
        messageKey: "error_validation",
        fields: parsed.error.issues.map((i) => i.path.join(".")),
      },
    }
  }

  const body = resetPasswordRequestSchema.parse({
    token: parsed.data.token,
    new_password: parsed.data.new_password,
  })
  logger.action("resetPasswordAction")
  const start = performance.now()
  try {
    await apiFetch(endpoints.auth.resetPassword, z.unknown(), {
      method: "POST",
      body: JSON.stringify(body),
      noAuth: true,
      headers: { "Accept-Language": locale },
    })
  } catch (err) {
    if (isRedirectError(err)) throw err
    const elapsed = Math.round(performance.now() - start)
    logger.actionError("resetPasswordAction", err, elapsed)
    return { ok: false, error: toFormError(err) }
  }

  const elapsed = Math.round(performance.now() - start)
  logger.actionDone("resetPasswordAction", undefined, elapsed)
  redirectOrRethrow(() => redirect(`/${locale}/sign-in?reset=1`))
}

// --- sign out (also lives here for symmetry) --------------------------------

/**
 * Server action invoked from a form post or from the account menu.
 * Clears the session and redirects to the sign-in page.
 */
export async function signOutAction(formData: FormData): Promise<void> {
  const locale = readFormString(formData, "locale") || "ar"
  logger.action("signOutAction")
  const start = performance.now()
  const session = await getSession()
  if (session?.refresh_token) {
    try {
      await apiFetch(endpoints.auth.logout, z.unknown(), {
        method: "POST",
        body: JSON.stringify({ refresh_token: session.refresh_token }),
        noAuth: true,
      })
    } catch {
      // best-effort: a failed server-side logout must not block the user
      // from clearing their local session.
    }
  }
  await destroySession()
  const elapsed = Math.round(performance.now() - start)
  logger.actionDone("signOutAction", undefined, elapsed)
  redirect(`/${locale}/sign-in`)
}
