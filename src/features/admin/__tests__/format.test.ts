import { describe, expect, it } from "vitest"
import { formatMoney, formatRelative } from "../format"

describe("admin formatting", () => {
  const now = Date.parse("2026-09-26T12:00:00Z")

  it("formats relative times against an injected clock", () => {
    expect(formatRelative("en", "2026-09-26T09:00:00Z", now)).toBe("3 hours ago")
    expect(formatRelative("en", "2026-09-25T12:00:00Z", now)).toBe("yesterday")
    expect(formatRelative("en", "2026-09-26T11:59:40Z", now)).toBe("this minute")
  })

  it("renders the API amount string without altering it", () => {
    expect(formatMoney("en", "1200.50", "EGP")).toContain("1,200.50")
    expect(formatMoney("en", "not-a-number", "EGP")).toBe("not-a-number")
  })
})
