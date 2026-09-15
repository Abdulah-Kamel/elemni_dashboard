import { beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/tests/setup"

const mockApiUrl = "http://localhost:8000"

vi.mock("@/env", () => ({
  env: {
    API_URL: mockApiUrl,
    SESSION_SECRET: "test-secret-at-least-32-chars-long-AAAA",
    NODE_ENV: "test",
  },
}))

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({
    access_token: "test-token",
    refresh_token: "test-ref",
  }),
}))

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
  headers: async () => ({
    get: () => "ar",
  }),
}))

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

const paginatedPayments = {
  total: 1,
  skip: 0,
  limit: 20,
  total_paid_sum: "150.00",
  pending_dues: "42.50",
  total_paid: "150.00",
  items: [
    {
      id: 7,
      teacher_profile_id: 3,
      admin_user_id: 1,
      admin_name: "Site Admin",
      amount: "150.00",
      note: "Cash received",
      created_at: "2026-09-01T10:00:00+00:00",
      pending_dues: "42.50",
      total_paid: "150.00",
    },
  ],
}

describe("teacher payment queries and actions", () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  it("fetches teacher payment history with supported filters", async () => {
    let requestedUrl = ""
    server.use(
      http.get(`${mockApiUrl}/api/v1/teachers/me/payments`, ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json(paginatedPayments)
      })
    )

    const { getTeacherPayments } = await import(
      "@/features/billing/queries"
    )
    const result = await getTeacherPayments({
      startDate: "2026-08-01",
      endDate: "2026-09-01",
      minAmount: "10",
      maxAmount: "500",
      sortBy: "amount",
      sortOrder: "asc",
      skip: 0,
      limit: 20,
    })

    expect(result.total_paid_sum).toBe(150)
    expect(requestedUrl).toContain("/api/v1/teachers/me/payments")
    expect(requestedUrl).toContain("start_date=2026-08-01")
    expect(requestedUrl).toContain("end_date=2026-09-01")
    expect(requestedUrl).toContain("min_amount=10")
    expect(requestedUrl).toContain("max_amount=500")
    expect(requestedUrl).toContain("sort_by=amount")
    expect(requestedUrl).toContain("sort_order=asc")
  })

  it("fetches admin teacher payment history by profile id", async () => {
    let requestedUrl = ""
    server.use(
      http.get(
        `${mockApiUrl}/api/v1/admin/teachers/3/payments`,
        ({ request }) => {
          requestedUrl = request.url
          return HttpResponse.json(paginatedPayments)
        }
      )
    )

    const { getAdminTeacherPayments } = await import(
      "@/features/billing/queries"
    )
    const result = await getAdminTeacherPayments(3, { sortBy: "created_at" })

    expect(result.total).toBe(1)
    expect(requestedUrl).toContain("/api/v1/admin/teachers/3/payments")
    expect(requestedUrl).toContain("sort_by=created_at")
  })

  it("records an admin manual payment with amount and note", async () => {
    let receivedBody: unknown = null
    server.use(
      http.post(
        `${mockApiUrl}/api/v1/admin/teachers/3/payments`,
        async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json(paginatedPayments.items[0], {
            status: 201,
          })
        }
      )
    )

    const { recordTeacherPaymentAction } = await import(
      "@/features/billing/actions"
    )
    const result = await recordTeacherPaymentAction(3, {
      amount: 200,
      note: "Cash received",
    })

    expect(result.success).toBe(true)
    expect(receivedBody).toMatchObject({ amount: 200, note: "Cash received" })
  })
})
