import { describe, expect, it } from "vitest"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"
import { deriveGuidedAnalysis } from "./guided-analysis"

const summary: TeacherAnalytics = {
  total_earnings: 900,
  sum_earning_money: 900,
  total_revenue: 1200,
  student_subscription_count: 9,
  subscription_count: 9,
  active_courses_count: 3,
  archived_courses_count: 1,
  archieved_courses_count: 1,
  start_date: null,
  end_date: null,
}

const topCourses: TopEarningCourse[] = [
  {
    id: 1,
    title: "Physics",
    name: "Physics",
    price: 100,
    earning_amount: 450,
    total_earnings: 450,
    student_subscription_count: 4,
    subscribed_students_count: 4,
  },
  {
    id: 2,
    title: "Math",
    name: "Math",
    price: 80,
    earning_amount: 300,
    total_earnings: 300,
    student_subscription_count: 3,
    subscribed_students_count: 3,
  },
]

describe("deriveGuidedAnalysis", () => {
  it("derives factual metrics from the current response", () => {
    expect(deriveGuidedAnalysis(summary, topCourses)).toEqual({
      teacherShare: 0.75,
      earningsPerSubscription: 100,
      activeCourseRatio: 0.75,
      topCourseConcentration: 0.5,
      activeCourses: 3,
      archivedCourses: 1,
    })
  })

  it("uses the highest course earning even if input order changes", () => {
    expect(
      deriveGuidedAnalysis(summary, [...topCourses].reverse())
        .topCourseConcentration
    ).toBe(0.5)
  })

  it("returns null instead of non-finite values when data is insufficient", () => {
    const emptySummary: TeacherAnalytics = {
      ...summary,
      total_earnings: 0,
      total_revenue: 0,
      subscription_count: 0,
      active_courses_count: 0,
      archived_courses_count: 0,
      archieved_courses_count: 0,
    }

    expect(deriveGuidedAnalysis(emptySummary, [])).toEqual({
      teacherShare: null,
      earningsPerSubscription: null,
      activeCourseRatio: null,
      topCourseConcentration: null,
      activeCourses: 0,
      archivedCourses: 0,
    })
  })
})