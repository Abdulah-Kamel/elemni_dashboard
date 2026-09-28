import { describe, expect, it } from "vitest"
import { EMPTY_COUPON_FORM, formFromCoupon, parseIdList, validateCouponForm, type CouponFormState } from "../form"
import { examplePreview, generateCouponCode } from "../format"
import { coupon } from "./fixtures"

const form = (overrides: Partial<CouponFormState> = {}): CouponFormState => ({ ...EMPTY_COUPON_FORM, code: "SAVE20", value: "20", ...overrides })

function errorsOf(state: CouponFormState) {
  const result = validateCouponForm(state)
  return result.ok ? {} : result.errors
}

describe("coupon form validation (UX mirror of the API schema)", () => {
  it("builds the API body from a valid form", () => {
    const result = validateCouponForm(form({ code: "save20", max_uses: "500", min_price: "150.5", starts: "2026-10-01", expires: "2026-10-31" }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.input).toMatchObject({ code: "SAVE20", value: "20", max_uses: 500, max_uses_per_student: 1, min_price: "150.5", applies_to: "all" })
    expect(new Date(result.input.expires_at as string) > new Date(result.input.starts_at as string)).toBe(true)
  })

  it("flags code, value and percentage range", () => {
    expect(errorsOf(form({ code: "ab", value: "" }))).toEqual({ code: "invalid_code", value: "required" })
    expect(errorsOf(form({ value: "0" }))).toEqual({ value: "value_positive" })
    expect(errorsOf(form({ value: "150" }))).toEqual({ value: "percentage_1_100" })
    expect(errorsOf(form({ type: "fixed", value: "150" }))).toEqual({})
    expect(errorsOf(form({ value: "12.345" }))).toEqual({ value: "invalid_amount" })
  })

  it("checks dates and limits against each other", () => {
    expect(errorsOf(form({ starts: "2026-10-10", expires: "2026-10-01" }))).toEqual({ expires: "expires_before_start" })
    expect(errorsOf(form({ max_uses: "5", max_uses_per_student: "6" }))).toEqual({ max_uses_per_student: "per_student_over_total" })
    expect(errorsOf(form({ max_uses: "1.5", max_uses_per_student: "0" }))).toEqual({ max_uses: "whole_number", max_uses_per_student: "min_one" })
    expect(errorsOf(form({ min_price: "abc" }))).toEqual({ min_price: "invalid_amount" })
  })

  it("requires targets for a scoped coupon", () => {
    expect(errorsOf(form({ applies_to: "courses", course_ids: "" }))).toEqual({ course_ids: "scope_courses_required" })
    expect(errorsOf(form({ applies_to: "courses", course_ids: "3, x" }))).toEqual({ course_ids: "invalid_ids" })
    expect(errorsOf(form({ applies_to: "teachers" }))).toEqual({ teacher_ids: "scope_teachers_required" })
    const scoped = validateCouponForm(form({ applies_to: "courses", course_ids: "12، 48 12" }))
    expect(scoped.ok && scoped.input.course_ids).toEqual([12, 48])
  })

  it("prefills the edit form from a coupon", () => {
    const state = formFromCoupon(coupon({ max_uses: null, min_price: "99.00", applies_to: "courses", course_ids: [4, 7] }))
    expect(state).toMatchObject({ code: "SAVE20", max_uses: "", min_price: "99.00", course_ids: "4, 7" })
    expect(parseIdList("1 2,3")).toEqual([1, 2, 3])
  })
})

describe("example preview (display only)", () => {
  it("shows a sample price before and after the discount", () => {
    expect(examplePreview("percentage", "20")).toEqual({ price: "200.00", final: "160.00" })
    expect(examplePreview("fixed", "50")).toEqual({ price: "200.00", final: "150.00" })
    expect(examplePreview("fixed", "500")).toEqual({ price: "200.00", final: "0.00" })
    expect(examplePreview("percentage", "12.5", "350")).toEqual({ price: "350.00", final: "306.25" })
  })

  it("shows nothing for an invalid value", () => {
    expect(examplePreview("percentage", "")).toBeNull()
    expect(examplePreview("percentage", "101")).toBeNull()
    expect(examplePreview("fixed", "-5")).toBeNull()
  })

  it("generates unambiguous codes that pass the code rule", () => {
    const code = generateCouponCode()
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/)
    expect(generateCouponCode(4, () => new Uint32Array([0, 1, 2, 31]))).toBe("ABC9")
  })
})
