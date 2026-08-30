import "server-only"

import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import {
  paginatedTeacherUsageLogsSchema,
  type PaginatedTeacherUsageLogs,
} from "@/features/earnings/schema"

export type TeacherUsageFilters = {
  startDate?: string
  endDate?: string
  minCost?: string
  maxCost?: string
  minBandwidthBytes?: number
  minStorageBytes?: number
  sortBy?: "date" | "cost_amount" | "bandwidth_bytes" | "storage_bytes"
  sortOrder?: "asc" | "desc"
  skip?: number
  limit?: number
}

function buildQueryString(filters: TeacherUsageFilters): string {
  const query = new URLSearchParams()

  if (filters.startDate) query.set("start_date", filters.startDate)
  if (filters.endDate) query.set("end_date", filters.endDate)
  if (filters.minCost) query.set("min_cost", filters.minCost)
  if (filters.maxCost) query.set("max_cost", filters.maxCost)
  if (filters.minBandwidthBytes != null) {
    query.set("min_bandwidth_bytes", String(filters.minBandwidthBytes))
  }
  if (filters.minStorageBytes != null) {
    query.set("min_storage_bytes", String(filters.minStorageBytes))
  }
  if (filters.sortBy) query.set("sort_by", filters.sortBy)
  if (filters.sortOrder) query.set("sort_order", filters.sortOrder)
  if (filters.skip != null) query.set("skip", String(filters.skip))
  if (filters.limit != null) query.set("limit", String(filters.limit))

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

export async function getTeacherUsage(
  filters: TeacherUsageFilters = {}
): Promise<PaginatedTeacherUsageLogs> {
  return apiFetch(
    `${endpoints.teachers.usage}${buildQueryString(filters)}`,
    paginatedTeacherUsageLogsSchema
  )
}
