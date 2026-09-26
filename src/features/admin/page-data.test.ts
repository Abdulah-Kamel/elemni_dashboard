import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiErrorImpl } from "@/lib/api/errors"

vi.mock("@/features/admin/queries", () => ({
  getAdminOverview: vi.fn(),
  listAdminTeachers: vi.fn(),
  listAdminSubscriptions: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe("loadAdminPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns an error result and logs the failing admin endpoint instead of throwing", async () => {
    const queries = await import("@/features/admin/queries")
    const { logger } = await import("@/lib/logger")
    const { loadAdminPageData } = await import("./page-data")

    vi.mocked(queries.getAdminOverview).mockRejectedValue(
      new ApiErrorImpl({
        type: "NotFound",
        status: 404,
        message: "Not Found",
      })
    )
    vi.mocked(queries.listAdminTeachers).mockResolvedValue({
      items: [],
      total: 0,
      skip: 0,
      limit: 5,
    } as never)
    vi.mocked(queries.listAdminSubscriptions).mockResolvedValue({
      items: [],
      total: 0,
      skip: 0,
      limit: 5,
    } as never)

    const result = await loadAdminPageData()

    expect(result).toMatchObject({
      kind: "error",
      error: {
        type: "NotFound",
        status: 404,
        message: "Not Found",
      },
    })
    expect(logger.error).toHaveBeenCalledWith(
      "Admin page data load failed",
      expect.objectContaining({
        request: "/api/v1/admin/overview",
        type: "NotFound",
        status: 404,
        message: "Not Found",
      })
    )
  })

  it("derives attention counts from list totals and hides a count whose request failed", async () => {
    const queries = await import("@/features/admin/queries")
    const { loadAdminPageData } = await import("./page-data")

    vi.mocked(queries.getAdminOverview).mockResolvedValue({
      teacher_total: 2,
      active_teacher_total: 1,
      student_total: 0,
      active_student_total: 0,
      completed_subscription_total: 0,
      collected_revenue: "0.00",
      currency: "EGP",
    })
    vi.mocked(queries.listAdminTeachers).mockImplementation(async (params = {}) =>
      params.isActive === false
        ? ({ items: [], total: 1, skip: 0, limit: 1 } as never)
        : ({
            items: [
              { id: 1, has_library: true },
              { id: 2, has_library: false },
            ],
            total: 2,
            skip: 0,
            limit: 100,
          } as never)
    )
    vi.mocked(queries.listAdminSubscriptions).mockImplementation(async (params = {}) => {
      if (params.paymentStatus === "failed") {
        throw new ApiErrorImpl({ type: "Upstream", status: 502, message: "Bad gateway" })
      }
      const totals: Record<string, number> = { pending: 4, duplicate_paid: 1, completed: 0 }
      return { items: [], total: totals[params.paymentStatus ?? "completed"] ?? 0, skip: 0, limit: 1 } as never
    })

    const result = await loadAdminPageData()

    expect(result.kind).toBe("ready")
    if (result.kind !== "ready") return
    expect(result.attention).toEqual({
      duplicatePayments: 1,
      failedPayments: null,
      teachersWithoutLibrary: 1,
      inactiveTeachers: 1,
      pendingPayments: 4,
    })
  })
})
