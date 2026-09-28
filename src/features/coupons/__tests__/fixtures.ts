import type { Coupon } from "../schema"

export function coupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    code: "SAVE20",
    type: "percentage",
    value: "20",
    currency: "EGP",
    is_active: true,
    starts_at: null,
    expires_at: null,
    max_uses: 500,
    max_uses_per_student: 1,
    used_count: 37,
    min_price: null,
    applies_to: "all",
    course_ids: [],
    teacher_ids: [],
    description: null,
    created_at: "2026-09-01T00:00:00.000Z",
    status: "active",
    ...overrides,
  }
}
