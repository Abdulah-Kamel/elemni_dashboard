import { describe, expect, it } from "vitest"
import {
  paginatedTeacherUsageLogsSchema,
  teacherUsageLogSchema,
  teacherUsageSummarySchema,
} from "@/features/earnings/schema"

const usageLog = {
  id: 14,
  teacher_profile_id: 3,
  teacher_name: "Amina Hassan",
  teacher_email: "amina@example.com",
  teacher_slug: "amina-hassan",
  date: "2026-08-30",
  bandwidth_bytes: 2147483648,
  storage_bytes: 524288000,
  bandwidth_cost_per_gb: "3.00",
  storage_cost_per_gb_monthly: "3.00",
  bandwidth_cost_amount: "6.00",
  storage_cost_amount: "1.50",
  cost_amount: "7.50",
  created_at: "2026-08-30T23:00:00+00:00",
}

describe("teacher usage API contract", () => {
  it("coerces decimal strings returned by the backend", () => {
    const result = teacherUsageLogSchema.parse(usageLog)

    expect(result.bandwidth_cost_amount).toBe(6)
    expect(result.storage_cost_amount).toBe(1.5)
    expect(result.cost_amount).toBe(7.5)
  })

  it("accepts an optional current balance and storage reading", () => {
    const result = teacherUsageSummarySchema.parse({
      total_bandwidth_bytes: 2147483648,
      total_storage_bytes: 524288000,
      total_bandwidth_cost: "6.00",
      total_storage_cost: "1.50",
      total_cost: "7.50",
      log_count: 1,
      pending_dues: null,
      storage_used_mb: null,
    })

    expect(result.pending_dues).toBeNull()
    expect(result.storage_used_mb).toBeNull()
  })

  it("keeps pagination and summary in the same response contract", () => {
    const result = paginatedTeacherUsageLogsSchema.parse({
      total: 1,
      skip: 0,
      limit: 20,
      summary: {
        total_bandwidth_bytes: usageLog.bandwidth_bytes,
        total_storage_bytes: usageLog.storage_bytes,
        total_bandwidth_cost: usageLog.bandwidth_cost_amount,
        total_storage_cost: usageLog.storage_cost_amount,
        total_cost: usageLog.cost_amount,
        log_count: 1,
        pending_dues: "7.50",
        storage_used_mb: 500,
      },
      items: [usageLog],
    })

    expect(result.items).toHaveLength(1)
    expect(result.summary.total_cost).toBe(7.5)
  })

  it("rejects a log with a negative byte count", () => {
    expect(() =>
      teacherUsageLogSchema.parse({ ...usageLog, storage_bytes: -1 })
    ).toThrow()
  })
})
