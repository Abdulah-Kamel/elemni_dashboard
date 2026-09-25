import { describe, expect, it } from "vitest"
import { buildPseudonyms, displayStatus, previewTotal, relativeTime, sortQueue, toCsv, wordCount } from "../ui-utils"

const item = (answer_id: number, studentId: number, submitted_at: string) => ({ answer_id, submitted_at, student: { id: studentId, name: `s${studentId}`, initials: "" } })

describe("buildPseudonyms", () => {
  it("numbers students by first appearance, oldest first, one number per student", () => {
    const items = [item(3, 30, "2026-09-03T00:00:00Z"), item(1, 10, "2026-09-01T00:00:00Z"), item(2, 10, "2026-09-02T00:00:00Z"), item(4, 40, "2026-09-04T00:00:00Z")]
    const map = buildPseudonyms(items)
    expect([map.get(10), map.get(30), map.get(40)]).toEqual([1, 2, 3])
  })

  it("does not shift when items are graded (status changes, membership doesn't)", () => {
    const items = [item(1, 10, "2026-09-01T00:00:00Z"), item(2, 20, "2026-09-02T00:00:00Z"), item(3, 30, "2026-09-03T00:00:00Z")]
    const before = buildPseudonyms(items.map((entry) => ({ ...entry, status: "pending" })))
    const after = buildPseudonyms(items.map((entry, index) => ({ ...entry, status: index === 0 ? "graded" : "pending" })))
    expect([...after]).toEqual([...before])
  })
})

describe("previewTotal", () => {
  const base = { score_rest: 13, max_score: 20, test: { id: 1, title: "t", course_id: 1, pass_percent: 80 } }
  it("uses the test's pass percent", () => {
    expect(previewTotal(base, 3)).toEqual({ score: 16, max: 20, percent: 80, passed: true })
    expect(previewTotal(base, 2)).toEqual({ score: 15, max: 20, percent: 75, passed: false })
    expect(previewTotal({ ...base, test: { ...base.test, pass_percent: 60 } }, 0).passed).toBe(true)
  })
})

describe("display helpers", () => {
  it("derives scheduled from a future opens_at", () => {
    const now = Date.parse("2026-09-26T00:00:00Z")
    expect(displayStatus({ status: "published", opens_at: "2026-09-28T10:00:00Z" }, now)).toBe("scheduled")
    expect(displayStatus({ status: "published", opens_at: "2026-09-20T10:00:00Z" }, now)).toBe("published")
    expect(displayStatus({ status: "draft", opens_at: "2026-09-28T10:00:00Z" }, now)).toBe("draft")
  })

  it("counts words in Arabic and Latin text", () => {
    expect(wordCount("القائمة قابلة للتعديل [1, 2]")).toBe(5)
    expect(wordCount("   ")).toBe(0)
    expect(wordCount(null)).toBe(0)
  })

  it("formats relative times with Intl.RelativeTimeFormat", () => {
    const now = Date.parse("2026-09-26T12:00:00Z")
    expect(relativeTime("2026-09-26T10:00:00Z", "en", now)).toBe("2 hours ago")
    expect(relativeTime("2026-09-25T12:00:00Z", "en", now)).toBe("yesterday")
    expect(relativeTime("2026-09-26T11:59:40Z", "en", now)).toBe("this minute")
  })

  it("sorts the queue oldest first", () => {
    const sorted = sortQueue([item(2, 1, "2026-09-02T00:00:00Z"), item(1, 1, "2026-09-01T00:00:00Z")])
    expect(sorted.map((entry) => entry.answer_id)).toEqual([1, 2])
  })

  it("writes CSV with a BOM and quotes cells that need it", () => {
    expect(toCsv([["a", "b,c"], ['q"x', "د"]])).toBe('﻿a,"b,c"\r\n"q""x",د\r\n')
  })
})
