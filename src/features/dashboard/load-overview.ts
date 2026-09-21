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

async function loadRecentSubscriptions() {
  try {
    return await listRecentTeacherSubscriptions()
  } catch (error) {
    if (isUnauthorized(error)) throw error
    return null
  }
}

export async function loadDashboardOverview(
  filters: DashboardFilters
): Promise<DashboardResult> {
  try {
    const [summary, topCourses, recentSubscriptions] = await Promise.all([
      getTeacherAnalytics(filters),
      listTopEarningCourses({ ...filters, limit: 5 }),
      loadRecentSubscriptions(),
    ])
    return { kind: "ready", summary, topCourses, recentSubscriptions }
  } catch (error) {
    if (isUnauthorized(error)) return { kind: "unauthorized" }
    const apiError = error as Error & {
      type?: ApiError["type"]
      status?: number
    }
    return {
      kind: "error",
      error: {
        type: apiError.type ?? "Upstream",
        status: apiError.status ?? 0,
        message: apiError.message ?? "Error",
      } as ApiError,
    }
  }
}

function isUnauthorized(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
  )
}
