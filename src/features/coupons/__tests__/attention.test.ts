import { describe, expect, it } from "vitest"
import { deriveCouponAttention, isExpiringSoon, isNearCap, matchesFlag } from "../attention"
import { coupon } from "./fixtures"

const NOW = Date.parse("2026-09-26T12:00:00.000Z")
const inDays = (days: number) => new Date(NOW + days * 24 * 60 * 60 * 1000).toISOString()

describe("coupon attention", () => {
  it("flags active coupons expiring within 7 days", () => {
    expect(isExpiringSoon(coupon({ expires_at: inDays(3) }), NOW)).toBe(true)
    expect(isExpiringSoon(coupon({ expires_at: inDays(7) }), NOW)).toBe(true)
    expect(isExpiringSoon(coupon({ expires_at: inDays(8) }), NOW)).toBe(false)
    expect(isExpiringSoon(coupon({ expires_at: null }), NOW)).toBe(false)
    // Status comes from the server; a paused coupon is never flagged.
    expect(isExpiringSoon(coupon({ expires_at: inDays(2), status: "inactive" }), NOW)).toBe(false)
  })

  it("flags active capped coupons at 90% usage or more", () => {
    expect(isNearCap(coupon({ used_count: 90, max_uses: 100 }))).toBe(true)
    expect(isNearCap(coupon({ used_count: 89, max_uses: 100 }))).toBe(false)
    expect(isNearCap(coupon({ used_count: 9, max_uses: 10 }))).toBe(true)
    expect(isNearCap(coupon({ used_count: 1000, max_uses: null }))).toBe(false)
    expect(isNearCap(coupon({ used_count: 50, max_uses: 50, status: "exhausted" }))).toBe(false)
  })

  it("matches flags for the filtered views", () => {
    const soon = coupon({ expires_at: inDays(1) })
    expect(matchesFlag(soon, "expiring", NOW)).toBe(true)
    expect(matchesFlag(soon, "near_cap", NOW)).toBe(false)
    expect(matchesFlag(soon, "none", NOW)).toBe(true)
  })

  it("derives rows from server stats plus the scanned page, hiding zero counts", () => {
    const stats = { active: 5, expiring_soon: 2, exhausted: 0, total_redemptions: 10, total_discount_given: "100.00" }
    const scanned = [coupon({ code: "A", used_count: 95, max_uses: 100 }), coupon({ code: "B", used_count: 1 })]
    expect(deriveCouponAttention(stats, scanned)).toEqual([
      { id: "expiring", count: 2, href: "/admin/coupons?flag=expiring", tone: "warning" },
      { id: "near_cap", count: 1, href: "/admin/coupons?flag=near_cap", tone: "warning" },
    ])
    expect(deriveCouponAttention(null, null)).toEqual([])
  })
})
