import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"

export type GuidedAnalysis = {
  teacherShare: number | null
  earningsPerSubscription: number | null
  activeCourseRatio: number | null
  topCourseConcentration: number | null
  activeCourses: number
  archivedCourses: number
}

function divideOrNull(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null
}

export function deriveGuidedAnalysis(
  summary: TeacherAnalytics,
  topCourses: TopEarningCourse[]
): GuidedAnalysis {
  const courseCount =
    summary.active_courses_count + summary.archived_courses_count
  const leadingCourseEarnings = topCourses.reduce(
    (highest, course) => Math.max(highest, course.earning_amount),
    0
  )

  return {
    teacherShare: divideOrNull(
      summary.total_earnings,
      summary.total_revenue
    ),
    earningsPerSubscription: divideOrNull(
      summary.total_earnings,
      summary.subscription_count
    ),
    activeCourseRatio: divideOrNull(
      summary.active_courses_count,
      courseCount
    ),
    topCourseConcentration:
      topCourses.length > 0
        ? divideOrNull(leadingCourseEarnings, summary.total_earnings)
        : null,
    activeCourses: summary.active_courses_count,
    archivedCourses: summary.archived_courses_count,
  }
}