// Create/edit form state ↔ API input. Validation mirrors the API schema for
// fast feedback only; the API validates again and has the final word.
import { couponInputSchema, type Coupon, type CouponInput } from "./schema"

export type CouponFormState = {
  code: string
  type: Coupon["type"]
  value: string
  is_active: boolean
  /** yyyy-mm-dd from <input type="date">, local time. */
  starts: string
  expires: string
  max_uses: string
  max_uses_per_student: string
  min_price: string
  applies_to: Coupon["applies_to"]
  /** Comma/space separated course ids (no admin course list endpoint yet). */
  course_ids: string
  teacher_ids: number[]
  description: string
}

export type CouponFormField = keyof CouponFormState
/** Field → message key under adminCoupons.validation. */
export type CouponFormErrors = Partial<Record<CouponFormField, string>>

export const EMPTY_COUPON_FORM: CouponFormState = {
  code: "",
  type: "percentage",
  value: "",
  is_active: true,
  starts: "",
  expires: "",
  max_uses: "",
  max_uses_per_student: "1",
  min_price: "",
  applies_to: "all",
  course_ids: "",
  teacher_ids: [],
  description: "",
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

/** ISO timestamp → yyyy-mm-dd in the admin's local time. */
export function toDateInput(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** yyyy-mm-dd → ISO at the start (or end) of that local day. */
export function fromDateInput(value: string, edge: "start" | "end"): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T${edge === "start" ? "00:00:00" : "23:59:59"}`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function formFromCoupon(coupon: Coupon): CouponFormState {
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    is_active: coupon.is_active,
    starts: toDateInput(coupon.starts_at),
    expires: toDateInput(coupon.expires_at),
    max_uses: coupon.max_uses === null ? "" : String(coupon.max_uses),
    max_uses_per_student: coupon.max_uses_per_student === null ? "" : String(coupon.max_uses_per_student),
    min_price: coupon.min_price ?? "",
    applies_to: coupon.applies_to,
    course_ids: coupon.course_ids.join(", "),
    teacher_ids: coupon.teacher_ids,
    description: coupon.description ?? "",
  }
}

const WHOLE = /^\d+$/
const DECIMAL = /^\d+(\.\d{1,2})?$/

export function parseIdList(text: string): number[] | null {
  const parts = text.split(/[\s,،]+/).filter(Boolean)
  if (!parts.every((part) => WHOLE.test(part) && Number(part) > 0)) return null
  return [...new Set(parts.map(Number))]
}

function optionalWhole(text: string): number | null | "invalid" {
  const value = text.trim()
  if (!value) return null
  return WHOLE.test(value) ? Number(value) : "invalid"
}

const FIELD_FOR_PATH: Record<string, CouponFormField> = {
  code: "code",
  type: "type",
  value: "value",
  starts_at: "starts",
  expires_at: "expires",
  max_uses: "max_uses",
  max_uses_per_student: "max_uses_per_student",
  min_price: "min_price",
  course_ids: "course_ids",
  teacher_ids: "teacher_ids",
  description: "description",
}

const KNOWN_MESSAGES = new Set([
  "invalid_code",
  "invalid_amount",
  "value_positive",
  "percentage_1_100",
  "expires_before_start",
  "per_student_over_total",
  "scope_courses_required",
  "scope_teachers_required",
  "min_one",
  "description_too_long",
])

export function validateCouponForm(form: CouponFormState): { ok: true; input: CouponInput } | { ok: false; errors: CouponFormErrors } {
  const errors: CouponFormErrors = {}
  const value = form.value.trim()
  if (!value) errors.value = "required"
  else if (!DECIMAL.test(value)) errors.value = "invalid_amount"

  const maxUses = optionalWhole(form.max_uses)
  if (maxUses === "invalid") errors.max_uses = "whole_number"
  const perStudent = optionalWhole(form.max_uses_per_student)
  if (perStudent === "invalid") errors.max_uses_per_student = "whole_number"

  const minPrice = form.min_price.trim()
  if (minPrice && !DECIMAL.test(minPrice)) errors.min_price = "invalid_amount"

  const courseIds = form.applies_to === "courses" ? parseIdList(form.course_ids) : []
  if (courseIds === null) errors.course_ids = "invalid_ids"

  const candidate = {
    code: form.code,
    type: form.type,
    value,
    is_active: form.is_active,
    starts_at: fromDateInput(form.starts, "start"),
    expires_at: fromDateInput(form.expires, "end"),
    max_uses: maxUses === "invalid" ? null : maxUses,
    max_uses_per_student: perStudent === "invalid" ? null : perStudent,
    min_price: minPrice || null,
    applies_to: form.applies_to,
    course_ids: courseIds ?? [],
    teacher_ids: form.applies_to === "teachers" ? form.teacher_ids : [],
    description: form.description,
  }
  const parsed = couponInputSchema.safeParse(candidate)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = FIELD_FOR_PATH[String(issue.path[0] ?? "")]
      if (!field || errors[field]) continue
      errors[field] = KNOWN_MESSAGES.has(issue.message) ? issue.message : "invalid"
    }
  }
  if (Object.keys(errors).length > 0 || !parsed.success) return { ok: false, errors }
  return { ok: true, input: parsed.data }
}
