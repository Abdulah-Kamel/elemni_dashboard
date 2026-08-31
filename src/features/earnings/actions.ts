"use server"

import {
  getTeacherUsage as getTeacherUsageQuery,
  type TeacherUsageFilters,
} from "./queries"

export async function getTeacherUsageAction(filters: TeacherUsageFilters) {
  return getTeacherUsageQuery(filters)
}
