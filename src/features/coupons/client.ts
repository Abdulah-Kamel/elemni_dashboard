import type {
  Coupon,
  CouponInput,
  CouponListQuery,
  CouponPage,
  CouponResult,
  CouponStats,
  RedemptionPage,
  RedemptionQuery,
} from "./schema"

/**
 * Every coupon read/write the admin console makes. The real implementation is
 * the server actions in ./actions.ts (API via apiFetch); the demo
 * implementation (./demo-client.ts) is development-only.
 */
export interface CouponsClient {
  listCoupons(query: CouponListQuery): Promise<CouponResult<CouponPage>>
  getCouponStats(): Promise<CouponResult<CouponStats>>
  createCoupon(input: CouponInput): Promise<CouponResult<Coupon>>
  updateCoupon(code: string, input: CouponInput): Promise<CouponResult<Coupon>>
  deleteCoupon(code: string): Promise<CouponResult<null>>
  toggleCoupon(code: string): Promise<CouponResult<Coupon>>
  listRedemptions(code: string, query: RedemptionQuery): Promise<CouponResult<RedemptionPage>>
}

/**
 * Local demo data is opt-in for development only; production always uses the
 * API. Either flag enables it (the course-tests flag is shared so one line in
 * .env.local turns on every demo area). Each variable is read literally so
 * Next inlines it, and a production build folds this to `false`.
 */
export const isCouponsDemo =
  process.env.NODE_ENV !== "production" &&
  (process.env.NEXT_PUBLIC_COUPONS_DEMO === "1" || process.env.NEXT_PUBLIC_COURSE_TESTS_DEMO === "1")

let client: Promise<CouponsClient> | null = null

export function getCouponsClient(): Promise<CouponsClient> {
  client ??= isCouponsDemo
    ? import("./demo-client").then((module) => module.demoCouponsClient)
    : // actions.ts is "use server": it exports one async function per method above.
      import("./actions").then((module): CouponsClient => module)
  return client
}
