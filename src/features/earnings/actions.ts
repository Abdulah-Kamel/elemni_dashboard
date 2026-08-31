"use server"

import { redirectToAuth } from "@/lib/auth/redirect"
import { headers } from "next/headers"

import {
  getTeacherUsage as getTeacherUsageQuery,
  type TeacherUsageFilters,
} from "./queries"

export async function getTeacherUsageAction(filters: TeacherUsageFilters) {
  try {
    return await getTeacherUsageQuery(filters)
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
      await redirectToAuth(locale, `/${locale}/earnings`)
    }
    throw error
  }
}
