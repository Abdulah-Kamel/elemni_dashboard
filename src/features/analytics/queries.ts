import "server-only"

import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import {
  teacherAnalyticsSchema,
  topEarningCourseSchema,
  type TeacherAnalytics,
  type TopEarningCourse,
} from "@/features/analytics/schema"

type AnalyticsFilters = {
  start?: string
  end?: string
  limit?: number
}

function buildQueryString(filters: AnalyticsFilters): string {
  const query = new URLSearchParams()

  if (filters.start) query.set("start", filters.start)
  if (filters.end) query.set("end", filters.end)
  if (filters.limit) query.set("limit", String(filters.limit))

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

export async function getTeacherAnalytics(
  filters: AnalyticsFilters = {}
): Promise<TeacherAnalytics> {
  return apiFetch(
    `${endpoints.teachers.analytics}${buildQueryString(filters)}`,
    teacherAnalyticsSchema
  )
}

export async function listTopEarningCourses(
  filters: AnalyticsFilters = {}
): Promise<TopEarningCourse[]> {
  return apiFetch(
    `${endpoints.teachers.analyticsTopCourses}${buildQueryString(filters)}`,
    topEarningCourseSchema.array()
  )
}

export type { AnalyticsFilters }
