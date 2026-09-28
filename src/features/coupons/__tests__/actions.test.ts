import { describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/tests/setup"

const API = "http://localhost:3000"

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({ access_token: "acc", refresh_token: "ref" }),
  saveSession: async () => {},
  destroySession: async () => {},
}))
vi.mock("@/lib/auth/redirect", () => ({
  redirectToAuth: vi.fn(async () => {
    throw new Error("redirected")
  }),
}))
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}))

const { createCoupon, deleteCoupon, getCouponStats, listCoupons, toggleCoupon } = await import("../actions")

const apiCoupon = {
  code: "SAVE20",
  type: "percentage",
  value: "20.00",
  currency: "EGP",
  is_active: true,
  starts_at: null,
  expires_at: "2026-12-11T00:00:00Z",
  max_uses: 500,
  max_uses_per_student: 1,
  used_count: 37,
  min_price: null,
  applies_to: "all",
  course_ids: [],
  teacher_ids: [],
  description: null,
  created_at: "2026-09-01T00:00:00Z",
  status: "active",
}

const validInput = {
  code: "NEW10",
  type: "percentage" as const,
  value: "10",
  is_active: true,
  starts_at: null,
  expires_at: null,
  max_uses: null,
  max_uses_per_student: 1,
  min_price: null,
  applies_to: "all" as const,
  course_ids: [],
  teacher_ids: [],
  description: "",
}

describe("coupon server actions", () => {
  it("lists coupons with the query string and parses the page", async () => {
    let url = ""
    server.use(
      http.get(`${API}/api/v1/admin/coupons`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ items: [apiCoupon], total: 1 })
      }),
    )
    const result = await listCoupons({ q: "save", status: "active", sort_by: "used_count", sort_order: "desc", skip: 10, limit: 10 })
    expect(result).toEqual({ ok: true, data: { items: [expect.objectContaining({ code: "SAVE20", status: "active" })], total: 1 } })
    expect(new URL(url).search).toBe("?q=save&status=active&sort_by=used_count&sort_order=desc&skip=10&limit=10")
  })

  it.each([404, 501])("reports a missing endpoint (%i) as not_available", async (status) => {
    server.use(
      http.get(`${API}/api/v1/admin/coupons/stats`, () => HttpResponse.json({ detail: "Not Found" }, { status })),
    )
    expect(await getCouponStats()).toEqual({ ok: false, error: "not_available" })
  })

  it("maps a 409 on delete to in_use with the API message", async () => {
    server.use(
      http.delete(`${API}/api/v1/admin/coupons/SAVE20`, () =>
        HttpResponse.json({ detail: "Coupon has redemptions; deactivate it instead" }, { status: 409 }),
      ),
    )
    expect(await deleteCoupon("SAVE20")).toEqual({ ok: false, error: "in_use", message: "Coupon has redemptions; deactivate it instead" })
  })

  it("maps a 409 on create to duplicate_code and a 404 on a single coupon to not_found", async () => {
    server.use(
      http.post(`${API}/api/v1/admin/coupons`, () => HttpResponse.json({ detail: "exists" }, { status: 409 })),
      http.post(`${API}/api/v1/admin/coupons/GONE/toggle`, () => HttpResponse.json({ detail: "Not Found" }, { status: 404 })),
    )
    expect(await createCoupon(validInput)).toEqual({ ok: false, error: "duplicate_code" })
    expect(await toggleCoupon("GONE")).toEqual({ ok: false, error: "not_found" })
  })

  it("rejects malformed input before calling the API", async () => {
    expect(await createCoupon({ ...validInput, value: "150" })).toEqual({ ok: false, error: "invalid_input" })
    expect(await deleteCoupon("../admin")).toEqual({ ok: false, error: "invalid_input" })
  })

  it("rejects a response that breaks the contract", async () => {
    server.use(http.get(`${API}/api/v1/admin/coupons`, () => HttpResponse.json({ items: [{ code: "X" }], total: 1 })))
    expect(await listCoupons({})).toEqual({ ok: false, error: "upstream" })
  })
})
