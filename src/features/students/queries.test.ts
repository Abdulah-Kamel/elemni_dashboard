import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
}))

vi.mock("@/lib/api/client", () => ({
  apiFetch: mocks.apiFetch,
}))

import { listRecentTeacherSubscriptions } from "./queries"

describe("student subscription queries", () => {
  beforeEach(() => {
    mocks.apiFetch.mockReset()
  })

  it("requests and returns the latest five subscriptions across statuses", async () => {
    const items = [
      {
        enrollment_id: 17,
        purchased_at: "2026-09-21T10:00:00Z",
        expires_at: "2027-09-21T10:00:00Z",
        payment_status: "completed",
        total_paid: 250,
        currency: "EGP",
        student_id: 4,
        student_name: "Mona Ali",
        student_email: "mona@example.com",
        course: { id: 8, title: "Physics", price: 250 },
      },
    ]
    mocks.apiFetch.mockResolvedValue({
      total: 1,
      skip: 0,
      limit: 5,
      items,
    })

    await expect(listRecentTeacherSubscriptions()).resolves.toEqual(items)
    expect(mocks.apiFetch).toHaveBeenCalledWith(
      "/api/v1/teachers/me/subscriptions?payment_status=all&skip=0&limit=5",
      expect.anything(),
      { tags: ["teacher-subscriptions"] }
    )
  })
})
