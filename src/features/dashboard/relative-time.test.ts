import { describe, expect, it } from "vitest"
import { formatRelative, relativeParts } from "./relative-time"

const now = new Date("2026-09-26T12:00:00Z")
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000)

describe("relativeParts", () => {
  it("picks the largest whole unit", () => {
    expect(relativeParts(ago(30), now)).toEqual({ value: 0, unit: "minute" })
    expect(relativeParts(ago(5 * 60), now)).toEqual({ value: -5, unit: "minute" })
    expect(relativeParts(ago(3 * 3600), now)).toEqual({ value: -3, unit: "hour" })
    expect(relativeParts(ago(2 * 86400), now)).toEqual({ value: -2, unit: "day" })
    expect(relativeParts(ago(15 * 86400), now)).toEqual({ value: -2, unit: "week" })
    expect(relativeParts(ago(400 * 86400), now)).toEqual({ value: -1, unit: "year" })
  })
})

describe("formatRelative", () => {
  it("uses Intl.RelativeTimeFormat for the locale", () => {
    expect(formatRelative(ago(86400), now, "en")).toBe("yesterday")
    expect(formatRelative(ago(3 * 3600), now, "en")).toBe("3 hours ago")
  })
})
