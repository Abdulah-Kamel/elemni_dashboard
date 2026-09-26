// DEVELOPMENT ONLY. A localStorage implementation of CouponsClient that stands
// in for the backend's /api/v1/admin/coupons endpoints so the admin UI can be
// exercised before they exist. Loaded only when NEXT_PUBLIC_COUPONS_DEMO=1 or
// NEXT_PUBLIC_COURSE_TESTS_DEMO=1 in development (see ./client.ts).
//
// It is a fake backend, so — unlike the UI — it derives status and totals
// itself. Coupons created here live in this browser only; they never reach
// students and are never the source of truth.

import type { CouponsClient } from "./client"
import {
  couponInputSchema,
  type Coupon,
  type CouponInput,
  type CouponListQuery,
  type CouponPage,
  type CouponResult,
  type CouponStats,
  type CouponStatus,
  type Redemption,
  type RedemptionPage,
  type RedemptionQuery,
} from "./schema"

export const DEMO_STORAGE_KEY = "elemni.admin.coupons.demo.v2"
/** Keys written by the old localStorage mock; removed on first load. */
const LEGACY_KEYS = ["elemni.admin.coupons.v1", "elemni.coupons.v1"]

const DAY = 24 * 60 * 60 * 1000
export const DEMO_EXPIRING_WINDOW_DAYS = 7

type StoredCoupon = Omit<Coupon, "status">
type DemoState = { version: 2; coupons: StoredCoupon[] }

function iso(time: number) {
  return new Date(time).toISOString()
}

function seedCoupon(partial: Partial<StoredCoupon> & Pick<StoredCoupon, "code" | "type" | "value">, now: number): StoredCoupon {
  return {
    currency: "EGP",
    is_active: true,
    starts_at: null,
    expires_at: null,
    max_uses: null,
    max_uses_per_student: 1,
    used_count: 0,
    min_price: null,
    applies_to: "all",
    course_ids: [],
    teacher_ids: [],
    description: null,
    created_at: iso(now - 30 * DAY),
    ...partial,
  }
}

/** Seed data relative to `now`, so "expiring soon" and "expired" stay meaningful. */
export function seedCoupons(now: number): StoredCoupon[] {
  return [
    seedCoupon({ code: "SAVE20", type: "percentage", value: "20", expires_at: iso(now + 75 * DAY), max_uses: 500, used_count: 37, description: "خصم الترم الأول" }, now),
    seedCoupon({ code: "WELCOME50", type: "fixed", value: "50", expires_at: iso(now + 4 * DAY), max_uses: 200, used_count: 12, min_price: "150" }, now),
    seedCoupon({ code: "LASTSEATS", type: "percentage", value: "15", expires_at: iso(now + 20 * DAY), max_uses: 100, used_count: 93, applies_to: "courses", course_ids: [1, 2] }, now),
    seedCoupon({ code: "FLASH30", type: "percentage", value: "30", max_uses: 50, used_count: 50, applies_to: "teachers", teacher_ids: [1] }, now),
    seedCoupon({ code: "EXPIRED10", type: "percentage", value: "10", starts_at: iso(now - 60 * DAY), expires_at: iso(now - 15 * DAY), used_count: 8 }, now),
    seedCoupon({ code: "OFF50", type: "percentage", value: "50", is_active: false, max_uses_per_student: null }, now),
  ]
}

export function deriveDemoStatus(coupon: StoredCoupon, now: number): CouponStatus {
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) return "expired"
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return "exhausted"
  if (!coupon.is_active) return "inactive"
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return "scheduled"
  return "active"
}

// ---------------------------------------------------------------------------
// Fake redemptions, generated deterministically from the code.

const STUDENTS = ["سارة أحمد", "محمد علي", "يوسف حسن", "مريم خالد", "عمر محمود", "نور إبراهيم", "آدم سامي", "ليلى مصطفى"]
const COURSES = [
  { title: "الفيزياء — الترم الأول", price: 20000 },
  { title: "الكيمياء العضوية", price: 35000 },
  { title: "مراجعة الرياضيات البحتة", price: 15000 },
]

function hash(text: string) {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
  return value
}

function piastres(decimal: string) {
  const [whole, fraction = ""] = decimal.split(".")
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2))
}

function toDecimal(value: number) {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`
}

function demoDiscount(coupon: StoredCoupon, price: number) {
  const discount =
    coupon.type === "percentage" ? Math.round((price * piastres(coupon.value)) / 10000) : Math.min(price, piastres(coupon.value))
  return discount
}

function demoRedemptions(coupon: StoredCoupon, now: number): Redemption[] {
  const seed = hash(coupon.code)
  const created = new Date(coupon.created_at).getTime()
  const span = Math.max(DAY, Math.min(now, coupon.expires_at ? new Date(coupon.expires_at).getTime() : now) - created)
  return Array.from({ length: coupon.used_count }, (_, index) => {
    const course = COURSES[(seed + index) % COURSES.length]
    const discount = demoDiscount(coupon, course.price)
    return {
      student_name: STUDENTS[(seed + index * 3) % STUDENTS.length],
      course_title: course.title,
      discount_amount: toDecimal(discount),
      final_price: toDecimal(course.price - discount),
      redeemed_at: iso(created + Math.round((span * (coupon.used_count - index)) / (coupon.used_count + 1))),
    }
  })
}

// ---------------------------------------------------------------------------
// Storage

function browserStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? (window.localStorage ?? null) : null
  } catch {
    return null
  }
}

type DemoOptions = {
  storage?: () => Storage | null
  now?: () => number
  latencyMs?: number
}

const SORT_ACCESSORS: Record<string, (coupon: Coupon) => string | number> = {
  code: (coupon) => coupon.code,
  value: (coupon) => Number(coupon.value),
  used_count: (coupon) => coupon.used_count,
  expires_at: (coupon) => (coupon.expires_at ? new Date(coupon.expires_at).getTime() : Number.MAX_SAFE_INTEGER),
  created_at: (coupon) => new Date(coupon.created_at).getTime(),
  status: (coupon) => coupon.status,
}

export function createDemoCouponsClient({ storage = browserStorage, now = Date.now, latencyMs = 0 }: DemoOptions = {}): CouponsClient {
  let memory: DemoState | null = null

  function read(): DemoState {
    const store = storage()
    if (store) {
      try {
        for (const key of LEGACY_KEYS) store.removeItem(key)
        const raw = store.getItem(DEMO_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as DemoState
          if (parsed?.version === 2 && Array.isArray(parsed.coupons)) return parsed
        }
      } catch {
        // Corrupt or blocked storage: fall through to memory / seed.
      }
    }
    memory ??= { version: 2, coupons: seedCoupons(now()) }
    return memory
  }

  function write(state: DemoState) {
    memory = state
    try {
      storage()?.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Private mode etc.; the in-memory copy is already updated.
    }
  }

  const withStatus = (coupon: StoredCoupon): Coupon => ({ ...coupon, status: deriveDemoStatus(coupon, now()) })

  async function respond<T>(value: CouponResult<T>): Promise<CouponResult<T>> {
    if (latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, latencyMs))
    return value
  }

  function validate(input: CouponInput): CouponInput | null {
    const parsed = couponInputSchema.safeParse(input)
    return parsed.success ? parsed.data : null
  }

  function fromInput(input: CouponInput, base: Pick<StoredCoupon, "used_count" | "created_at" | "currency">): StoredCoupon {
    return {
      ...base,
      code: input.code,
      type: input.type,
      value: input.value,
      is_active: input.is_active,
      starts_at: input.starts_at,
      expires_at: input.expires_at,
      max_uses: input.max_uses,
      max_uses_per_student: input.max_uses_per_student,
      min_price: input.min_price,
      applies_to: input.applies_to,
      course_ids: input.applies_to === "courses" ? input.course_ids : [],
      teacher_ids: input.applies_to === "teachers" ? input.teacher_ids : [],
      description: input.description || null,
    }
  }

  return {
    async listCoupons(query: CouponListQuery): Promise<CouponResult<CouponPage>> {
      const q = (query.q ?? "").trim().toUpperCase()
      let rows = read().coupons.map(withStatus)
      if (q) rows = rows.filter((coupon) => coupon.code.includes(q) || (coupon.description ?? "").toUpperCase().includes(q))
      if (query.status) rows = rows.filter((coupon) => coupon.status === query.status)
      const accessor = SORT_ACCESSORS[query.sort_by ?? "created_at"]
      const factor = (query.sort_order ?? (query.sort_by ? "asc" : "desc")) === "asc" ? 1 : -1
      rows = [...rows].sort((a, b) => {
        const x = accessor(a)
        const y = accessor(b)
        const result = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))
        return result * factor || a.code.localeCompare(b.code)
      })
      const skip = query.skip ?? 0
      const limit = query.limit ?? 10
      return respond({ ok: true, data: { items: rows.slice(skip, skip + limit), total: rows.length } })
    },

    async getCouponStats(): Promise<CouponResult<CouponStats>> {
      const time = now()
      const rows = read().coupons.map(withStatus)
      const soon = time + DEMO_EXPIRING_WINDOW_DAYS * DAY
      let discount = 0
      for (const coupon of rows) for (const item of demoRedemptions(coupon, time)) discount += piastres(item.discount_amount)
      return respond({
        ok: true,
        data: {
          active: rows.filter((coupon) => coupon.status === "active").length,
          expiring_soon: rows.filter((coupon) => coupon.status === "active" && coupon.expires_at && new Date(coupon.expires_at).getTime() <= soon).length,
          exhausted: rows.filter((coupon) => coupon.status === "exhausted").length,
          total_redemptions: rows.reduce((sum, coupon) => sum + coupon.used_count, 0),
          total_discount_given: toDecimal(discount),
        },
      })
    },

    async createCoupon(input: CouponInput): Promise<CouponResult<Coupon>> {
      const parsed = validate(input)
      if (!parsed) return respond({ ok: false, error: "invalid_input" })
      const state = read()
      if (state.coupons.some((coupon) => coupon.code === parsed.code)) return respond({ ok: false, error: "duplicate_code" })
      const coupon = fromInput(parsed, { used_count: 0, created_at: iso(now()), currency: "EGP" })
      write({ ...state, coupons: [coupon, ...state.coupons] })
      return respond({ ok: true, data: withStatus(coupon) })
    },

    async updateCoupon(code: string, input: CouponInput): Promise<CouponResult<Coupon>> {
      const parsed = validate({ ...input, code })
      if (!parsed) return respond({ ok: false, error: "invalid_input" })
      const state = read()
      const existing = state.coupons.find((coupon) => coupon.code === code)
      if (!existing) return respond({ ok: false, error: "not_found" })
      const next = fromInput(parsed, existing)
      write({ ...state, coupons: state.coupons.map((coupon) => (coupon.code === code ? next : coupon)) })
      return respond({ ok: true, data: withStatus(next) })
    },

    async deleteCoupon(code: string): Promise<CouponResult<null>> {
      const state = read()
      const existing = state.coupons.find((coupon) => coupon.code === code)
      if (!existing) return respond({ ok: false, error: "not_found" })
      if (existing.used_count > 0) return respond({ ok: false, error: "in_use" })
      write({ ...state, coupons: state.coupons.filter((coupon) => coupon.code !== code) })
      return respond({ ok: true, data: null })
    },

    async toggleCoupon(code: string): Promise<CouponResult<Coupon>> {
      const state = read()
      const existing = state.coupons.find((coupon) => coupon.code === code)
      if (!existing) return respond({ ok: false, error: "not_found" })
      const next = { ...existing, is_active: !existing.is_active }
      write({ ...state, coupons: state.coupons.map((coupon) => (coupon.code === code ? next : coupon)) })
      return respond({ ok: true, data: withStatus(next) })
    },

    async listRedemptions(code: string, query: RedemptionQuery): Promise<CouponResult<RedemptionPage>> {
      const existing = read().coupons.find((coupon) => coupon.code === code)
      if (!existing) return respond({ ok: false, error: "not_found" })
      const items = demoRedemptions(existing, now())
      const skip = query.skip ?? 0
      const limit = query.limit ?? 10
      return respond({ ok: true, data: { items: items.slice(skip, skip + limit), total: items.length } })
    },
  }
}

export const demoCouponsClient = createDemoCouponsClient({ latencyMs: 150 })
