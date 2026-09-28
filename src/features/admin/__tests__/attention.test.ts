import { describe, expect, it } from "vitest"
import { countTeachersWithoutLibrary, deriveAdminAttention } from "../attention"
import type { AdminTeacherPage } from "../schema"

const none = {
  duplicatePayments: 0,
  failedPayments: 0,
  teachersWithoutLibrary: 0,
  inactiveTeachers: 0,
  pendingPayments: 0,
}

describe("deriveAdminAttention", () => {
  it("returns nothing when every count is zero or unknown", () => {
    expect(deriveAdminAttention(none)).toEqual([])
    expect(
      deriveAdminAttention({ duplicatePayments: null, failedPayments: null, teachersWithoutLibrary: null, inactiveTeachers: null, pendingPayments: null }),
    ).toEqual([])
  })

  it("orders money problems first and links each row to its filtered list", () => {
    const items = deriveAdminAttention({
      duplicatePayments: 1,
      failedPayments: 2,
      teachersWithoutLibrary: 3,
      inactiveTeachers: 4,
      pendingPayments: 5,
    })
    expect(items.map(({ id, count, href, tone }) => [id, count, href, tone])).toEqual([
      ["duplicatePayments", 1, "/admin/subscriptions?status=duplicate_paid", "destructive"],
      ["failedPayments", 2, "/admin/subscriptions?status=failed", "destructive"],
      ["teachersWithoutLibrary", 3, "/admin/teachers?library=missing", "warning"],
      ["inactiveTeachers", 4, "/admin/teachers?status=inactive", "warning"],
      ["pendingPayments", 5, "/admin/subscriptions?status=pending", "primary"],
    ])
  })

  it("skips a row whose count could not be loaded", () => {
    const items = deriveAdminAttention({ ...none, failedPayments: null, inactiveTeachers: 2 })
    expect(items.map((item) => item.id)).toEqual(["inactiveTeachers"])
  })
})

describe("countTeachersWithoutLibrary", () => {
  const teacher = (id: number, has_library: boolean) => ({ id, has_library }) as AdminTeacherPage["items"][number]

  it("counts has_library === false when the page holds every teacher", () => {
    expect(
      countTeachersWithoutLibrary({ total: 3, skip: 0, limit: 100, items: [teacher(1, true), teacher(2, false), teacher(3, false)] }),
    ).toBe(2)
  })

  it("refuses to undercount when the list was truncated", () => {
    expect(countTeachersWithoutLibrary({ total: 150, skip: 0, limit: 100, items: [teacher(1, false)] })).toBeNull()
    expect(countTeachersWithoutLibrary(null)).toBeNull()
  })
})
