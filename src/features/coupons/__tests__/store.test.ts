// src/features/coupons/__tests__/store.test.ts
import { describe, expect, it, beforeEach } from "vitest";
import { createCoupon, listCoupons, toggleCoupon, deriveStatus } from "../store";
import { updateCouponSchema } from "../schema";

// Env shim: Node >=22 defines globalThis.localStorage as an experimental stub
// (undefined without --localstorage-file) which shadows jsdom's, so install a
// minimal in-memory implementation when no working localStorage exists.
if (typeof window !== "undefined" && !window.localStorage) {
  const data = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
      setItem: (k: string, v: string) => { data.set(k, String(v)); },
      removeItem: (k: string) => { data.delete(k); },
      clear: () => { data.clear(); },
      get length() { return data.size; },
      key: (i: number) => [...data.keys()][i] ?? null,
    },
    configurable: true,
  });
}

beforeEach(() => localStorage.clear());

describe("coupon store", () => {
  it("seeds 4 coupons including SAVE20", () => {
    expect(listCoupons().map((c) => c.code)).toContain("SAVE20");
    expect(listCoupons()).toHaveLength(4);
  });
  it("rejects duplicate code", () => {
    expect(() => createCoupon({ code: "SAVE20", type: "percentage", value: 10, active: true, expiresAt: null, maxUses: null, description: "" })).toThrow();
  });
  it("toggles active flag", () => {
    const off = toggleCoupon("SAVE20");
    expect(off.active).toBe(false);
    expect(deriveStatus(off)).toBe("inactive");
  });
  it("derives expired status", () => {
    const c = listCoupons().find((x) => x.code === "EXPIRED10")!;
    expect(deriveStatus(c, new Date("2026-09-12T00:00:00Z"))).toBe("expired");
  });
  it("update schema enforces percentage 1-100", () => {
    expect(() => updateCouponSchema.parse({ code: "SAVE20", type: "percentage", value: 200 })).toThrow();
    expect(() => updateCouponSchema.parse({ code: "SAVE20", type: "percentage", value: 25 })).not.toThrow();
  });
});
