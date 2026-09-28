import {
  getTeacherAnalytics,
  listTopEarningCourses,
} from "@/features/analytics/queries"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"
import { listCourses } from "@/features/course-management/queries"
import type { CourseOut } from "@/features/shell/schema"
import {
  listRecentTeacherSubscriptions,
  listTeacherSubscriptions,
} from "@/features/students/queries"
import type { TeacherSubscription } from "@/features/students/schema"
import type { ApiError } from "@/lib/api/errors"

export type DashboardResult =
  | {
      kind: "ready"
      summary: TeacherAnalytics
      topCourses: TopEarningCourse[]
      recentSubscriptions: TeacherSubscription[] | null
      /** All courses (for draft / no-student counts); null if it failed. */
      courses: CourseOut[] | null
      /** Every subscription (for expiry / pending counts); null if it failed. */
      subscriptions: TeacherSubscription[] | null
      /**
       * Revenue/subscriptions over time. No endpoint exists yet, so this is
       * always null and the trend slot renders nothing.
       */
      trend: null
    }
  | { kind: "error"; error: ApiError }
  | { kind: "unauthorized" }

type DashboardFilters = { start?: string; end?: string }

export async function loadDashboardOverview(
  filters: DashboardFilters,
  teacherProfileId: number
): Promise<DashboardResult> {
  const [
    summaryResult,
    topCoursesResult,
    recentSubscriptionsResult,
    coursesResult,
    subscriptionsResult,
  ] = await Promise.allSettled([
    getTeacherAnalytics(filters),
    listTopEarningCourses({ ...filters, limit: 5 }),
    listRecentTeacherSubscriptions(),
    listCourses(teacherProfileId),
    listTeacherSubscriptions(),
  ])

  const results = [
    summaryResult,
    topCoursesResult,
    recentSubscriptionsResult,
    coursesResult,
    subscriptionsResult,
  ]
  if (results.some((r) => r.status === "rejected" && isUnauthorized(r.reason))) {
    return { kind: "unauthorized" }
  }

  if (summaryResult.status === "rejected") {
    return {
      kind: "error",
      error: toApiError(summaryResult.reason),
    }
  }

  if (topCoursesResult.status === "rejected") {
    return {
      kind: "error",
      error: toApiError(topCoursesResult.reason),
    }
  }

  return {
    kind: "ready",
    summary: summaryResult.value,
    topCourses: topCoursesResult.value,
    recentSubscriptions: valueOrNull(recentSubscriptionsResult),
    courses: valueOrNull(coursesResult),
    subscriptions: valueOrNull(subscriptionsResult),
    trend: null,
  }
}

function valueOrNull<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null
}

function toApiError(error: unknown): ApiError {
  const e = error as Error & { type?: ApiError["type"]; status?: number }
  return {
    type: e.type ?? "Upstream",
    status: e.status ?? 0,
    message: e.message ?? "Error",
  } as ApiError
}

function isUnauthorized(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
  )
}
