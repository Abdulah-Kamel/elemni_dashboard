import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
}))

vi.mock("@/lib/api/client", () => ({
  apiFetch: mocks.apiFetch,
}))

import { listAdminSubscriptions } from "./queries"

describe("admin subscription queries", () => {
  it("sends the explicit all-statuses sentinel required by the backend", async () => {
    mocks.apiFetch.mockResolvedValue({
      total: 0,
      skip: 0,
      limit: 10,
      items: [],
    })

    await listAdminSubscriptions({ paymentStatus: "all" })

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      "/api/v1/admin/subscriptions?skip=0&limit=10&payment_status=all",
      expect.anything()
    )
  })
})
