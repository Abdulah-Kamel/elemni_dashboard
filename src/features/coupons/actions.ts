"use server"

// The real CouponsClient: one Server Action per method (see ./client.ts).
// Each action: session gate (UX only — the API authorizes) → shape check →
// API call parsed with zod → typed result. Coupon data carries money, so
// nothing here is cached; the list refetches after every mutation.

import { cookies } from "next/headers"
import { z } from "zod"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import { getSession } from "@/lib/auth/session"
import { redirectToAuth } from "@/lib/auth/redirect"
import { logger } from "@/lib/logger"
import {
  couponCodeSchema,
  couponInputSchema,
  couponListQuerySchema,
  couponPageSchema,
  couponSchema,
  couponStatsSchema,
  redemptionPageSchema,
  redemptionQuerySchema,
  type Coupon,
  type CouponErrorCode,
  type CouponInput,
  type CouponListQuery,
  type CouponPage,
  type CouponResult,
  type CouponStats,
  type RedemptionPage,
  type RedemptionQuery,
} from "./schema"

const NEXT_PATH = "/admin/coupons"

class InvalidInput extends Error {}

function parseInput<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value)
  if (!result.success) throw new InvalidInput(result.error.message)
  return result.data
}

async function currentLocale(): Promise<"ar" | "en"> {
  try {
    return (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "ar"
  } catch {
    return "ar"
  }
}

type ApiLikeError = { type: string; status?: number; message: string }

function isApiError(error: unknown): error is ApiLikeError {
  return !!error && typeof error === "object" && "type" in error && "message" in error && typeof (error as ApiLikeError).type === "string"
}

/** An API-sent message is worth showing; the client's "HTTP 409" placeholder is not. */
function apiMessage(error: ApiLikeError): string | undefined {
  return error.message && !error.message.startsWith("HTTP ") ? error.message : undefined
}

type Operation = "read" | "mutate" | "create" | "delete"

/** Maps an API error to a typed code. Components branch on the code, never on a status. */
function toErrorCode(error: ApiLikeError, operation: Operation, collection: boolean): CouponErrorCode {
  // 501/405: the backend has not shipped these endpoints. 404 on a collection
  // route means the same thing; on a single coupon it means the coupon is gone.
  if (error.status === 501 || error.status === 405) return "not_available"
  switch (error.type) {
    case "NotFound":
      return collection ? "not_available" : "not_found"
    case "Conflict":
      return operation === "create" ? "duplicate_code" : operation === "delete" ? "in_use" : "conflict"
    case "Validation":
      return "validation"
    case "Forbidden":
      return "forbidden"
    case "RateLimited":
      return "rate_limited"
    default:
      return "upstream"
  }
}

async function run<T>(
  name: string,
  { operation, collection = false }: { operation: Operation; collection?: boolean },
  work: () => Promise<T>,
): Promise<CouponResult<T>> {
  const locale = await currentLocale()
  const session = await getSession()
  if (!session?.refresh_token) return redirectToAuth(locale, NEXT_PATH)

  const start = performance.now()
  logger.action(name, {})
  try {
    const data = await work()
    logger.actionDone(name, {}, Math.round(performance.now() - start))
    return { ok: true, data }
  } catch (error: unknown) {
    logger.actionError(name, error, Math.round(performance.now() - start))
    if (error instanceof InvalidInput) return { ok: false, error: "invalid_input" }
    if (!isApiError(error)) return { ok: false, error: "upstream" }
    if (error.type === "Unauthorized") return redirectToAuth(locale, NEXT_PATH)
    const code = toErrorCode(error, operation, collection)
    const message = code === "validation" || code === "conflict" || code === "in_use" ? apiMessage(error) : undefined
    return message ? { ok: false, error: code, message } : { ok: false, error: code }
  }
}

function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value))
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

// ---------------------------------------------------------------------------
// Reads

export async function listCoupons(query: CouponListQuery): Promise<CouponResult<CouponPage>> {
  return run("coupons.list", { operation: "read", collection: true }, async () => {
    const parsed = parseInput(couponListQuerySchema, query)
    return apiFetch(withQuery(endpoints.admin.coupons.list, parsed), couponPageSchema)
  })
}

export async function getCouponStats(): Promise<CouponResult<CouponStats>> {
  return run("coupons.stats", { operation: "read", collection: true }, () =>
    apiFetch(endpoints.admin.coupons.stats, couponStatsSchema),
  )
}

export async function listRedemptions(code: string, query: RedemptionQuery): Promise<CouponResult<RedemptionPage>> {
  return run("coupons.redemptions", { operation: "read" }, async () => {
    const parsedCode = parseInput(couponCodeSchema, code)
    const parsed = parseInput(redemptionQuerySchema, query)
    return apiFetch(withQuery(endpoints.admin.coupons.redemptions(parsedCode), parsed), redemptionPageSchema)
  })
}

// ---------------------------------------------------------------------------
// Mutations — never retried automatically (apiFetch only retries GETs).

export async function createCoupon(input: CouponInput): Promise<CouponResult<Coupon>> {
  return run("coupons.create", { operation: "create" }, async () => {
    const body = parseInput(couponInputSchema, input)
    return apiFetch(endpoints.admin.coupons.list, couponSchema, { method: "POST", body: JSON.stringify(body) })
  })
}

export async function updateCoupon(code: string, input: CouponInput): Promise<CouponResult<Coupon>> {
  return run("coupons.update", { operation: "mutate" }, async () => {
    const parsedCode = parseInput(couponCodeSchema, code)
    // The code identifies the coupon and is not editable.
    const body: Partial<CouponInput> = parseInput(couponInputSchema, { ...input, code: parsedCode })
    delete body.code
    return apiFetch(endpoints.admin.coupons.detail(parsedCode), couponSchema, { method: "PATCH", body: JSON.stringify(body) })
  })
}

export async function deleteCoupon(code: string): Promise<CouponResult<null>> {
  return run("coupons.delete", { operation: "delete" }, async () => {
    const parsedCode = parseInput(couponCodeSchema, code)
    await apiFetch(endpoints.admin.coupons.detail(parsedCode), z.unknown(), { method: "DELETE" })
    return null
  })
}

export async function toggleCoupon(code: string): Promise<CouponResult<Coupon>> {
  return run("coupons.toggle", { operation: "mutate" }, async () => {
    const parsedCode = parseInput(couponCodeSchema, code)
    return apiFetch(endpoints.admin.coupons.toggle(parsedCode), couponSchema, { method: "POST" })
  })
}
