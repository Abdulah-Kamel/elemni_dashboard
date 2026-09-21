import {
  getTeacherAnalytics,
  listTopEarningCourses,
} from "@/features/analytics/queries"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"
import { listRecentTeacherSubscriptions } from "@/features/students/queries"
import type { TeacherSubscription } from "@/features/students/schema"
import type { ApiError } from "@/lib/api/errors"

export type DashboardResult =
  | {
      kind: "ready"
      summary: TeacherAnalytics
      topCourses: TopEarningCourse[]
      recentSubscriptions: TeacherSubscription[] | null
    }
  | { kind: "error"; error: ApiError }
  | { kind: "unauthorized" }

type DashboardFilters = { start?: string; end?: string }

export async function loadDashboardOverview(
  filters: DashboardFilters
): Promise<DashboardResult> {
  const [summaryResult, topCoursesResult, recentSubscriptionsResult] =
    await Promise.allSettled([
      getTeacherAnalytics(filters),
      listTopEarningCourses({ ...filters, limit: 5 }),
      listRecentTeacherSubscriptions(),
    ])

  const results = [summaryResult, topCoursesResult, recentSubscriptionsResult]
  if (results.some((r) => r.status === "rejected" && isUnauthorized(r.reason))) {
    return { kind: "unauthorized" }
  }

  if (summaryResult.status === "rejected") {
    return {
      kind: "error",
      error: toApiError(summaryResult.reason),
    }
  }

  let recentSubscriptions: TeacherSubscription[] | null = null
  if (recentSubscriptionsResult.status === "fulfilled") {
    recentSubscriptions = recentSubscriptionsResult.value
  }

  return {
    kind: "ready",
    summary: summaryResult.value,
    topCourses:
      topCoursesResult.status === "fulfilled" ? topCoursesResult.value : [],
    recentSubscriptions,
  }
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
