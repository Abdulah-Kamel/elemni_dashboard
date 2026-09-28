// Coupons: API response shapes (parsed at the boundary) and the create/edit
// input shape. The backend owns every coupon rule — status, limits, eligibility
// and the discount a student actually gets at checkout. The input schema here
// mirrors the API's validation for fast form feedback only.
import { z } from "zod"

export const COUPON_STATUSES = ["active", "inactive", "expired", "exhausted", "scheduled"] as const
export type CouponStatus = (typeof COUPON_STATUSES)[number]
/** Statuses the list endpoint can filter by. */
export const COUPON_STATUS_FILTERS = ["active", "inactive", "expired", "exhausted"] as const
export type CouponStatusFilter = (typeof COUPON_STATUS_FILTERS)[number]

export const COUPON_CODE_PATTERN = /^[A-Z0-9_-]{3,20}$/
export const couponCodeSchema = z.string().trim().toUpperCase().regex(COUPON_CODE_PATTERN, "invalid_code")

/** Money and discount values arrive as decimal strings; accept numbers too and keep them as text. */
const decimal = z.union([z.string(), z.number()]).transform((value) => String(value))
const id = z.number().int().positive()

export const couponSchema = z.object({
  code: z.string(),
  type: z.enum(["percentage", "fixed"]),
  value: decimal,
  currency: z.string().default("EGP"),
  is_active: z.boolean(),
  starts_at: z.string().nullable().default(null),
  expires_at: z.string().nullable().default(null),
  max_uses: z.number().int().nullable().default(null),
  max_uses_per_student: z.number().int().nullable().default(null),
  used_count: z.number().int().min(0),
  min_price: decimal.nullable().default(null),
  applies_to: z.enum(["all", "courses", "teachers"]).default("all"),
  course_ids: z.array(id).default([]),
  teacher_ids: z.array(id).default([]),
  description: z.string().nullable().default(null),
  created_at: z.string(),
  /** Server-computed. The UI renders it; it never derives it. */
  status: z.enum(COUPON_STATUSES),
})
export type Coupon = z.infer<typeof couponSchema>

export const couponPageSchema = z.object({
  items: z.array(couponSchema),
  total: z.number().int().min(0),
})
export type CouponPage = z.infer<typeof couponPageSchema>

export const couponStatsSchema = z.object({
  active: z.number().int().min(0),
  expiring_soon: z.number().int().min(0),
  exhausted: z.number().int().min(0),
  total_redemptions: z.number().int().min(0),
  /** Decimal string in EGP, rendered as-is. */
  total_discount_given: decimal,
})
export type CouponStats = z.infer<typeof couponStatsSchema>

export const redemptionSchema = z.object({
  student_name: z.string(),
  course_title: z.string(),
  discount_amount: decimal,
  final_price: decimal,
  redeemed_at: z.string(),
})
export type Redemption = z.infer<typeof redemptionSchema>

export const redemptionPageSchema = z.object({
  items: z.array(redemptionSchema),
  total: z.number().int().min(0),
})
export type RedemptionPage = z.infer<typeof redemptionPageSchema>

// ---------------------------------------------------------------------------
// Requests

export const COUPON_SORT_FIELDS = ["code", "value", "used_count", "expires_at", "created_at", "status"] as const
export type CouponSortField = (typeof COUPON_SORT_FIELDS)[number]

export const couponListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(COUPON_STATUS_FILTERS).optional(),
  sort_by: z.enum(COUPON_SORT_FIELDS).optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  skip: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(10),
})
export type CouponListQuery = z.input<typeof couponListQuerySchema>

export const redemptionQuerySchema = z.object({
  skip: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(10),
})
export type RedemptionQuery = z.input<typeof redemptionQuerySchema>

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/
const decimalInput = z.string().trim().regex(DECIMAL_PATTERN, "invalid_amount")

/**
 * Body for POST /admin/coupons and PATCH /admin/coupons/{code}. Amounts are
 * decimal strings (EGP) so nothing is rounded through a float on the way.
 */
export const couponInputSchema = z
  .object({
    code: couponCodeSchema,
    type: z.enum(["percentage", "fixed"]),
    value: decimalInput,
    is_active: z.boolean(),
    starts_at: z.string().datetime({ offset: true }).nullable(),
    expires_at: z.string().datetime({ offset: true }).nullable(),
    max_uses: z.number().int().min(1, "min_one").nullable(),
    max_uses_per_student: z.number().int().min(1, "min_one").nullable(),
    min_price: decimalInput.nullable(),
    applies_to: z.enum(["all", "courses", "teachers"]),
    course_ids: z.array(id),
    teacher_ids: z.array(id),
    description: z.string().trim().max(200, "description_too_long"),
  })
  .superRefine((input, ctx) => {
    const value = Number(input.value)
    if (!(value > 0)) ctx.addIssue({ code: "custom", path: ["value"], message: "value_positive" })
    if (input.type === "percentage" && value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "percentage_1_100" })
    if (input.starts_at && input.expires_at && new Date(input.expires_at) <= new Date(input.starts_at))
      ctx.addIssue({ code: "custom", path: ["expires_at"], message: "expires_before_start" })
    if (input.max_uses !== null && input.max_uses_per_student !== null && input.max_uses_per_student > input.max_uses)
      ctx.addIssue({ code: "custom", path: ["max_uses_per_student"], message: "per_student_over_total" })
    if (input.applies_to === "courses" && input.course_ids.length === 0)
      ctx.addIssue({ code: "custom", path: ["course_ids"], message: "scope_courses_required" })
    if (input.applies_to === "teachers" && input.teacher_ids.length === 0)
      ctx.addIssue({ code: "custom", path: ["teacher_ids"], message: "scope_teachers_required" })
  })
export type CouponInput = z.infer<typeof couponInputSchema>

// ---------------------------------------------------------------------------
// Results

/** Typed failure codes; the UI maps each to a localized message. */
export type CouponErrorCode =
  | "not_available"
  | "not_found"
  | "duplicate_code"
  | "in_use"
  | "conflict"
  | "validation"
  | "forbidden"
  | "rate_limited"
  | "invalid_input"
  | "upstream"

export type CouponResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CouponErrorCode; /** Localized API message, when the API sent one. */ message?: string }
