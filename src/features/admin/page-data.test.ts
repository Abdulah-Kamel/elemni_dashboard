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
})
