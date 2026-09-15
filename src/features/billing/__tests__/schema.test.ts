import { describe, expect, it } from "vitest"
import {
  adminRecordTeacherPaymentRequestSchema,
  paginatedTeacherPaymentsSchema,
  teacherPaymentLogSchema,
} from "@/features/billing/schema"

const paymentLog = {
  id: 7,
  teacher_profile_id: 3,
  admin_user_id: 1,
  admin_name: "Site Admin",
  amount: "150.00",
  note: "Cash received",
  created_at: "2026-09-01T10:00:00+00:00",
  pending_dues: "42.50",
  total_paid: "150.00",
}

describe("teacher payments API contract", () => {
  it("parses a payment log with admin attribution and balances", () => {
    const result = teacherPaymentLogSchema.parse(paymentLog)

    expect(result.amount).toBe(150)
    expect(result.admin_name).toBe("Site Admin")
    expect(result.pending_dues).toBe(42.5)
    expect(result.total_paid).toBe(150)
  })

  it("accepts null admin attribution and null balances", () => {
    const result = teacherPaymentLogSchema.parse({
      ...paymentLog,
      admin_user_id: null,
      admin_name: null,
      note: null,
      pending_dues: null,
      total_paid: null,
    })

    expect(result.admin_user_id).toBeNull()
    expect(result.admin_name).toBeNull()
    expect(result.pending_dues).toBeNull()
  })

  it("keeps pagination totals alongside filtered sums", () => {
    const result = paginatedTeacherPaymentsSchema.parse({
      total: 1,
      skip: 0,
      limit: 20,
      total_paid_sum: "150.00",
      pending_dues: "42.50",
      total_paid: "150.00",
      items: [paymentLog],
    })

    expect(result.items).toHaveLength(1)
    expect(result.total_paid_sum).toBe(150)
    expect(result.pending_dues).toBe(42.5)
  })

  it("accepts a positive manual payment with an optional note", () => {
    const result = adminRecordTeacherPaymentRequestSchema.parse({
      amount: 200,
      note: "Cash received",
    })

    expect(result.amount).toBe(200)
  })

  it("rejects a non-positive manual payment amount", () => {
    expect(() =>
      adminRecordTeacherPaymentRequestSchema.parse({ amount: 0 })
    ).toThrow()
    expect(() =>
      adminRecordTeacherPaymentRequestSchema.parse({ amount: -5 })
    ).toThrow()
  })

  it("rejects a note longer than the backend limit", () => {
    expect(() =>
      adminRecordTeacherPaymentRequestSchema.parse({
        amount: 10,
        note: "x".repeat(501),
      })
    ).toThrow()
  })
})
