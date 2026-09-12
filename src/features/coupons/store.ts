// src/features/coupons/store.ts (excerpt — full CRUD + localStorage mirror)
import type { Coupon, CouponStatus } from "./schema";
import { createCouponSchema } from "./schema";

export const ADMIN_STORAGE_KEY = "elemni.admin.coupons.v1";
export const SHARED_STORAGE_KEY = "elemni.coupons.v1";
export const SEED_COUPONS: Coupon[] = [
  {
    code: "SAVE20",
    type: "percentage",
    value: 20,
    currency: "EGP",
    active: true,
    expiresAt: "2026-12-11T00:00:00.000Z",
    maxUses: 500,
    usedCount: 37,
    description: "",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    code: "WELCOME50",
    type: "fixed",
    value: 50,
    currency: "EGP",
    active: true,
    expiresAt: "2026-10-12T00:00:00.000Z",
    maxUses: 200,
    usedCount: 12,
    description: "",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    code: "EXPIRED10",
    type: "percentage",
    value: 10,
    currency: "EGP",
    active: true,
    expiresAt: "2026-09-11T00:00:00.000Z",
    maxUses: null,
    usedCount: 0,
    description: "",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    code: "OFF50",
    type: "percentage",
    value: 50,
    currency: "EGP",
    active: false,
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    description: "",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
];

function storage(): Storage | null {
  // jsdom-safe: Node >=22 defines a global localStorage stub that warns and
  // yields undefined without --localstorage-file; real browsers are unaffected.
  try {
    if (typeof window === "undefined") return null;
    const ls = window.localStorage;
    return ls ?? null;
  } catch { return null; }
}
// In-memory mirror so CRUD still works where localStorage is unavailable (tests).
let memory: Coupon[] | null = null;
function read(): Coupon[] {
  const fallback = memory ?? [...SEED_COUPONS];
  const s = storage();
  if (!s) return fallback;
  try {
    const raw = s.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return [...SEED_COUPONS];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [...SEED_COUPONS];
  } catch { return fallback; }
}
function write(all: Coupon[]) {
  memory = all;
  const s = storage();
  if (!s) return;
  try {
    s.setItem(ADMIN_STORAGE_KEY, JSON.stringify(all));
    s.setItem(SHARED_STORAGE_KEY, JSON.stringify(all));
  } catch { /* private mode etc.; in-memory copy already updated */ }
}
export function deriveStatus(c: Coupon, now = new Date()): CouponStatus {
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now.getTime()) return "expired";
  if (c.maxUses != null && c.usedCount >= c.maxUses) return "exhausted";
  if (!c.active) return "inactive";
  return "active";
}
export function listCoupons(): Coupon[] { return read(); }
export function createCoupon(input: unknown): Coupon {
  const parsed = createCouponSchema.parse({ ...(input as object), currency: undefined });
  const all = read();
  if (all.some((c) => c.code === parsed.code)) throw new Error("duplicate_code");
  const coupon: Coupon = { ...parsed, currency: "EGP", usedCount: 0, createdAt: new Date().toISOString() };
  write([...all, coupon]);
  return coupon;
}
export function updateCoupon(code: string, patch: unknown): Coupon {
  const all = read();
  const idx = all.findIndex((c) => c.code === code);
  if (idx === -1) throw new Error("not_found");
  const next = { ...all[idx], ...(patch as object), code };
  write(all.map((c, i) => (i === idx ? next : c)));
  return next;
}
export function deleteCoupon(code: string): void {
  write(read().filter((c) => c.code !== code));
}
export function toggleCoupon(code: string): Coupon {
  const all = read();
  const idx = all.findIndex((c) => c.code === code);
  if (idx === -1) throw new Error("not_found");
  const next = { ...all[idx], active: !all[idx].active };
  write(all.map((c, i) => (i === idx ? next : c)));
  return next;
}
