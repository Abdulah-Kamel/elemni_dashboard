"use server"

import { redirectToAuth } from "@/lib/auth/redirect"
import { headers } from "next/headers"

import {
  getTeacherAnalytics as getTeacherAnalyticsQuery,
  listTopEarningCourses as listTopEarningCoursesQuery,
  type AnalyticsFilters,
} from "./queries"
import type { TeacherAnalytics, TopEarningCourse } from "./schema"

export type AnalyticsResult = {
  summary: TeacherAnalytics
  topCourses: TopEarningCourse[]
}

export async function getTeacherAnalyticsAction(
  filters: AnalyticsFilters = {}
): Promise<AnalyticsResult> {
  try {
    const [summary, topCourses] = await Promise.all([
      getTeacherAnalyticsQuery(filters),
      listTopEarningCoursesQuery({ ...filters, limit: 5 }),
    ])
    return { summary, topCourses }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
    ) {
      const requestHeaders = await headers()
      const locale = requestHeaders.get("Accept-Language")?.startsWith("en")
        ? "en"
        : "ar"
      await redirectToAuth(locale, `/${locale}/dashboard`)
    }
    throw error
  }
}
