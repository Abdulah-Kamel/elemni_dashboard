import { describe, expect, it } from "vitest"
import { grantCreateSchema, grantSchema } from "./schema"

const grant = { id: 9, user_id: 5, item_id: 319, granted_by_id: 3, idempotency_key: "0b6f3b9e-1d5e-4c7a-9f1e-2a3b4c5d6e7f",
  granted_views: 3, consumed_views: 1, remaining_views: 2, reason: null, created_at: "2026-10-06T10:00:00Z", expires_at: null, revoked_at: null }

describe("grant schemas", () => {
  it("parses a backend grant", () => { expect(grantSchema.parse(grant).remaining_views).toBe(2) })
  it.each([0, 1001, 1.5])("rejects granted_views %s", (n) => {
    expect(grantCreateSchema.safeParse({ user_id: 5, item_id: 319, granted_views: n }).success).toBe(false)
  })
  it("rejects a reason over 500 chars and a past expiry", () => {
    expect(grantCreateSchema.safeParse({ user_id: 5, item_id: 319, granted_views: 1, reason: "x".repeat(501) }).success).toBe(false)
    expect(grantCreateSchema.safeParse({ user_id: 5, item_id: 319, granted_views: 1, expires_at: "2000-01-01T00:00:00Z" }).success).toBe(false)
  })
  it.each([1, 1000])("accepts views boundary %s with optional fields omitted", (granted_views) => {
    expect(grantCreateSchema.parse({ user_id: 5, item_id: 319, granted_views })).toEqual({ user_id: 5, item_id: 319, granted_views })
  })
  it("accepts a future offset expiry and trims a 500-character reason", () => {
    const expires_at = new Date(Date.now() + 86400000).toISOString().replace("Z", "+00:00")
    expect(grantCreateSchema.parse({ user_id: 5, item_id: 319, granted_views: 1, expires_at, reason: ` ${"x".repeat(500)} ` }).reason).toBe("x".repeat(500))
  })
  it("rejects non-positive ids and malformed expiry", () => {
    expect(grantCreateSchema.safeParse({ user_id: 0, item_id: 319, granted_views: 1 }).success).toBe(false)
    expect(grantCreateSchema.safeParse({ user_id: 5, item_id: -1, granted_views: 1 }).success).toBe(false)
    expect(grantCreateSchema.safeParse({ user_id: 5, item_id: 319, granted_views: 1, expires_at: "tomorrow" }).success).toBe(false)
  })
})
