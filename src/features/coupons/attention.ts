// "Needs attention" for coupons. These are display flags that point the admin
// at a filtered list — they decide nothing. Status itself always comes from
// the server; a coupon is only flagged while the server says it is active.
import type { Coupon, CouponStats } from "./schema"
import type { CouponFlag } from "./url-state"

export const EXPIRING_WINDOW_DAYS = 7
/** Flag a capped coupon once 90% of its uses are gone. */
const NEAR_CAP_NUMERATOR = 9
const NEAR_CAP_DENOMINATOR = 10

const DAY = 24 * 60 * 60 * 1000

export function isExpiringSoon(coupon: Coupon, now: number): boolean {
  if (coupon.status !== "active" || !coupon.expires_at) return false
  const expires = new Date(coupon.expires_at).getTime()
  return expires > now && expires - now <= EXPIRING_WINDOW_DAYS * DAY
}

export function isNearCap(coupon: Coupon): boolean {
  if (coupon.status !== "active" || coupon.max_uses === null || coupon.max_uses <= 0) return false
  // Integer comparison: used / max >= 0.9 without floating point.
  return coupon.used_count * NEAR_CAP_DENOMINATOR >= coupon.max_uses * NEAR_CAP_NUMERATOR
}

export function matchesFlag(coupon: Coupon, flag: CouponFlag, now: number): boolean {
  if (flag === "expiring") return isExpiringSoon(coupon, now)
  if (flag === "near_cap") return isNearCap(coupon)
  return true
}

export type CouponAttentionKind = "expiring" | "near_cap" | "exhausted"

export type CouponAttention = { id: CouponAttentionKind; count: number; href: string; tone: "warning" | "destructive" | "primary" }

/**
 * Attention rows, most urgent first. Counts the server already reports come
 * from the stats; "near cap" has no server count, so it is flagged from the
 * scanned page of active coupons (null while that page is loading).
 */
export function deriveCouponAttention(stats: CouponStats | null, scanned: Coupon[] | null): CouponAttention[] {
  const items: CouponAttention[] = [
    { id: "expiring", count: stats?.expiring_soon ?? 0, href: "/admin/coupons?flag=expiring", tone: "warning" },
    { id: "near_cap", count: scanned ? scanned.filter((coupon) => isNearCap(coupon)).length : 0, href: "/admin/coupons?flag=near_cap", tone: "warning" },
    { id: "exhausted", count: stats?.exhausted ?? 0, href: "/admin/coupons?status=exhausted", tone: "destructive" },
  ]
  return items.filter((item) => item.count > 0)
}
