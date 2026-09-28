import { describe, expect, it } from "vitest"
import type { TeacherAnalytics } from "@/features/analytics/schema"
import { buildKpis } from "./kpis"

const summary: TeacherAnalytics = {
  total_earnings: 900.5,
  sum_earning_money: 900.5,
  total_revenue: 1200.75,
  student_subscription_count: 8,
  subscription_count: 9,
  active_courses_count: 3,
  archived_courses_count: 1,
  archieved_courses_count: 1,
  start_date: null,
  end_date: null,
}

describe("buildKpis", () => {
  it("passes API values through untouched", () => {
    const [earnings, subscriptions, courses] = buildKpis(summary, 2)
    expect(earnings).toMatchObject({ id: "earnings", value: 900.5, revenue: 1200.75 })
    expect(subscriptions).toMatchObject({ id: "subscriptions", value: 9 })
    expect(courses).toMatchObject({ id: "courses", value: 3, drafts: 2, archived: 1 })
  })

  it("links every tile to the list behind it", () => {
    expect(Object.fromEntries(buildKpis(summary, null).map((k) => [k.id, k.href]))).toEqual({
      earnings: "/students?status=completed",
      subscriptions: "/students?status=completed",
      courses: "/courses?status=published",
    })
  })
})
