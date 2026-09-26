import { describe, expect, it } from "vitest"
import { matchScore, normalizeSearch, rankItems } from "./match"

describe("normalizeSearch", () => {
  it("folds Arabic letter variants and diacritics", () => {
    expect(normalizeSearch("أإآ")).toBe("ااا")
    expect(normalizeSearch("مدرسة")).toBe("مدرسه")
    expect(normalizeSearch("مستوى")).toBe("مستوي")
    expect(normalizeSearch("الدَّوْرات")).toBe("الدورات")
  })

  it("is case-insensitive and collapses whitespace", () => {
    expect(normalizeSearch("  My   COURSES ")).toBe("my courses")
  })
})

describe("matchScore", () => {
  it("ranks exact and prefix label hits above keyword hits", () => {
    expect(matchScore("courses", "Courses")).toBeGreaterThan(matchScore("cour", "Courses"))
    expect(matchScore("cour", "Courses")).toBeGreaterThan(matchScore("classes", "Courses", "classes"))
  })

  it("matches Arabic regardless of hamza / taa marbuta spelling", () => {
    expect(matchScore("اضافه", "إضافة دورة")).toBeGreaterThan(0)
    expect(matchScore("الاشتراكات", "الأشتراكات")).toBeGreaterThan(0)
  })

  it("accepts loose in-order letters but rejects unrelated text", () => {
    expect(matchScore("crs", "Courses")).toBeGreaterThan(0)
    expect(matchScore("zzz", "Courses")).toBe(0)
    expect(matchScore("stu", "Switch language")).toBe(0)
  })
})

describe("rankItems", () => {
  it("keeps configured order for ties and drops misses", () => {
    const items = [
      { label: "Students", keywords: "" },
      { label: "Subjects", keywords: "" },
      { label: "Coupons", keywords: "" },
    ]
    expect(rankItems(items, "s").map((i) => i.label)).toEqual(["Students", "Subjects", "Coupons"])
    expect(rankItems(items, "sub").map((i) => i.label)).toEqual(["Subjects"])
  })
})
