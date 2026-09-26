import { beforeEach, describe, expect, it } from "vitest"
import { createDemoCouponsClient, deriveDemoStatus, DEMO_STORAGE_KEY, seedCoupons } from "../demo-client"
import type { CouponInput } from "../schema"

const NOW = Date.parse("2026-09-26T12:00:00.000Z")
const DAY = 24 * 60 * 60 * 1000

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

const input = (overrides: Partial<CouponInput> = {}): CouponInput => ({
  code: "NEWCODE",
  type: "percentage",
  value: "25",
  is_active: true,
  starts_at: null,
  expires_at: null,
  max_uses: 100,
  max_uses_per_student: 1,
  min_price: null,
  applies_to: "all",
  course_ids: [],
  teacher_ids: [],
  description: "",
  ...overrides,
})

let storage: MemoryStorage
const make = () => createDemoCouponsClient({ storage: () => storage, now: () => NOW })

function ok<T>(result: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.error}`)
  return result.data
}

beforeEach(() => {
  storage = new MemoryStorage()
})

describe("demo coupons client", () => {
  it("seeds coupons that cover every status", async () => {
    const page = ok(await make().listCoupons({ limit: 100 }))
    expect(page.total).toBe(seedCoupons(NOW).length)
    const statuses = new Set(page.items.map((coupon) => coupon.status))
    expect([...statuses].sort()).toEqual(["active", "exhausted", "expired", "inactive"])
  })

  it("derives status: expired beats exhausted beats paused; future start is scheduled", () => {
    const [base] = seedCoupons(NOW)
    expect(deriveDemoStatus({ ...base, expires_at: new Date(NOW - DAY).toISOString(), used_count: 999, max_uses: 1 }, NOW)).toBe("expired")
    expect(deriveDemoStatus({ ...base, used_count: 5, max_uses: 5, is_active: false }, NOW)).toBe("exhausted")
    expect(deriveDemoStatus({ ...base, is_active: false }, NOW)).toBe("inactive")
    expect(deriveDemoStatus({ ...base, starts_at: new Date(NOW + DAY).toISOString() }, NOW)).toBe("scheduled")
    expect(deriveDemoStatus(base, NOW)).toBe("active")
  })

  it("creates a coupon, persists it and rejects duplicate codes", async () => {
    const client = make()
    const created = ok(await client.createCoupon(input()))
    expect(created).toMatchObject({ code: "NEWCODE", used_count: 0, status: "active" })
    expect(storage.getItem(DEMO_STORAGE_KEY)).toContain("NEWCODE")
    // A fresh client (page reload) reads it back from storage.
    expect(ok(await make().listCoupons({ q: "newcode" })).items.map((coupon) => coupon.code)).toEqual(["NEWCODE"])
    expect(await client.createCoupon(input())).toEqual({ ok: false, error: "duplicate_code" })
  })

  it("rejects input the API would reject", async () => {
    expect(await make().createCoupon(input({ value: "120" }))).toEqual({ ok: false, error: "invalid_input" })
    expect(await make().createCoupon(input({ applies_to: "courses", course_ids: [] }))).toEqual({ ok: false, error: "invalid_input" })
  })

  it("refuses to delete a redeemed coupon and suggests deactivating instead", async () => {
    const client = make()
    expect(await client.deleteCoupon("SAVE20")).toEqual({ ok: false, error: "in_use" })
    expect(ok(await client.deleteCoupon("OFF50"))).toBeNull()
    expect(ok(await client.listCoupons({ q: "OFF50" })).total).toBe(0)
    expect(await client.deleteCoupon("MISSING")).toEqual({ ok: false, error: "not_found" })
  })

  it("toggles and updates without changing the code or usage", async () => {
    const client = make()
    const paused = ok(await client.toggleCoupon("SAVE20"))
    expect(paused).toMatchObject({ is_active: false, status: "inactive" })
    const updated = ok(await client.updateCoupon("SAVE20", input({ code: "IGNORED", value: "30", max_uses: 600 })))
    expect(updated).toMatchObject({ code: "SAVE20", value: "30", max_uses: 600, used_count: 37 })
    expect(await client.updateCoupon("MISSING", input())).toEqual({ ok: false, error: "not_found" })
  })

  it("filters by status, sorts and pages like the API", async () => {
    const client = make()
    const exhausted = ok(await client.listCoupons({ status: "exhausted" }))
    expect(exhausted.items.map((coupon) => coupon.code)).toEqual(["FLASH30"])
    const byUsage = ok(await client.listCoupons({ sort_by: "used_count", sort_order: "desc", limit: 2 }))
    expect(byUsage.items.map((coupon) => coupon.code)).toEqual(["LASTSEATS", "FLASH30"])
    expect(byUsage.total).toBe(6)
    const second = ok(await client.listCoupons({ sort_by: "code", skip: 2, limit: 2 }))
    expect(second.items.map((coupon) => coupon.code)).toEqual(["LASTSEATS", "OFF50"])
  })

  it("reports stats and paged redemptions as decimal strings", async () => {
    const client = make()
    const stats = ok(await client.getCouponStats())
    expect(stats).toMatchObject({ active: 3, expiring_soon: 1, exhausted: 1, total_redemptions: 200 })
    expect(stats.total_discount_given).toMatch(/^\d+\.\d{2}$/)
    const redemptions = ok(await client.listRedemptions("SAVE20", { skip: 0, limit: 5 }))
    expect(redemptions.total).toBe(37)
    expect(redemptions.items).toHaveLength(5)
    expect(redemptions.items[0].discount_amount).toMatch(/^\d+\.\d{2}$/)
  })

  it("drops the old mock's storage keys", async () => {
    storage.setItem("elemni.admin.coupons.v1", "[]")
    storage.setItem("elemni.coupons.v1", "[]")
    await make().listCoupons({})
    expect(storage.getItem("elemni.admin.coupons.v1")).toBeNull()
    expect(storage.getItem("elemni.coupons.v1")).toBeNull()
  })

  it("keeps working in memory when storage is unavailable", async () => {
    const client = createDemoCouponsClient({ storage: () => null, now: () => NOW })
    ok(await client.createCoupon(input()))
    expect(ok(await client.listCoupons({ q: "NEWCODE" })).total).toBe(1)
  })
})
