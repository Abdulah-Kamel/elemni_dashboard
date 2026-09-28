// Display helpers for coupons. Nothing here decides what a student pays:
// amounts are formatted as the API sent them, and the one calculation — the
// form's example preview — is labelled as an illustration; the backend
// computes the real discount at checkout.
import { formatMoney } from "@/features/admin/format"
import type { Coupon } from "./schema"

export function formatPercent(locale: string, value: string) {
  const number = Number(value)
  if (!Number.isFinite(number)) return `${value}%`
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(number / 100)
}

export function formatDiscount(locale: string, coupon: Pick<Coupon, "type" | "value" | "currency">) {
  return coupon.type === "percentage" ? formatPercent(locale, coupon.value) : formatMoney(locale, coupon.value, coupon.currency)
}

export function formatCount(locale: string, value: number) {
  return new Intl.NumberFormat(locale).format(value)
}

/** Bar width for "used / max", clamped to 0–100. Presentation only. */
export function usagePercent(used: number, max: number | null): number | null {
  if (max === null || max <= 0) return null
  return Math.min(100, Math.max(0, Math.round((used / max) * 100)))
}

const DECIMAL = /^\d+(\.\d{1,2})?$/

function toPiastres(value: string): number | null {
  const text = value.trim()
  if (!DECIMAL.test(text)) return null
  const [whole, fraction = ""] = text.split(".")
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
}

function fromPiastres(value: number): string {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`
}

export const EXAMPLE_PRICE = "200"

/**
 * Example preview for the create/edit form: what a sample course price would
 * become. Display only — never sent to the API, never used at checkout. Uses
 * whole piastres so the illustration doesn't drift through floating point.
 */
export function examplePreview(
  type: Coupon["type"],
  value: string,
  minPrice: string | null = null,
): { price: string; final: string } | null {
  const discount = toPiastres(value)
  if (discount === null || discount <= 0) return null
  if (type === "percentage" && discount > 100 * 100) return null
  const minimum = minPrice ? toPiastres(minPrice) : null
  const sample = Math.max(toPiastres(EXAMPLE_PRICE) ?? 0, minimum ?? 0)
  const off = type === "percentage" ? Math.round((sample * discount) / (100 * 100)) : Math.min(sample, discount)
  return { price: fromPiastres(sample), final: fromPiastres(sample - off) }
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** Random, unambiguous code (no 0/O, 1/I). Client-side convenience; the API still checks uniqueness. */
export function generateCouponCode(length = 8, random: (size: number) => Uint32Array = (size) => crypto.getRandomValues(new Uint32Array(size))): string {
  return Array.from(random(length), (n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join("")
}
