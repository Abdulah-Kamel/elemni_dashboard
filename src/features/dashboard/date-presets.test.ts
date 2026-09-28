import { describe, expect, it } from "vitest"
import { activeRange, rangeHref, rangePresets, termStart, toDateParam } from "./date-presets"

const today = new Date(2026, 8, 26) // 26 Sep 2026, local time

describe("rangePresets", () => {
  it("builds inclusive ranges ending today", () => {
    expect(rangePresets(today)).toEqual([
      { id: "7d", start: "2026-09-20", end: "2026-09-26" },
      { id: "30d", start: "2026-08-28", end: "2026-09-26" },
      { id: "term", start: "2026-09-01", end: "2026-09-26" },
      { id: "all" },
    ])
  })

  it("starts the term in September or February", () => {
    expect(toDateParam(termStart(new Date(2027, 0, 10)))).toBe("2026-09-01")
    expect(toDateParam(termStart(new Date(2027, 3, 10)))).toBe("2027-02-01")
    expect(toDateParam(termStart(new Date(2026, 11, 31)))).toBe("2026-09-01")
  })
})

describe("activeRange", () => {
  const presets = rangePresets(today)
  it("matches presets, all time and custom ranges", () => {
    expect(activeRange({}, presets)).toBe("all")
    expect(activeRange({ start: "2026-09-20", end: "2026-09-26" }, presets)).toBe("7d")
    expect(activeRange({ start: "2026-09-01", end: "2026-09-26" }, presets)).toBe("term")
    expect(activeRange({ start: "2026-01-01", end: "2026-02-01" }, presets)).toBe("custom")
  })
})

describe("rangeHref", () => {
  it("keeps the range in start/end params", () => {
    expect(rangeHref({ start: "2026-09-20", end: "2026-09-26" })).toBe(
      "/dashboard?start=2026-09-20&end=2026-09-26"
    )
    expect(rangeHref({})).toBe("/dashboard")
  })
})
