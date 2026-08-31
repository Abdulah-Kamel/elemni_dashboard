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
  limit?: number | "all"
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
  if (filters.limit != null && filters.limit !== "all") {
    query.set("limit", String(filters.limit))
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

export async function getTeacherUsage(
  filters: TeacherUsageFilters = {}
): Promise<PaginatedTeacherUsageLogs> {
  if (filters.limit === "all") {
    return getAllTeacherUsage(filters)
  }

  return apiFetch(
    `${endpoints.teachers.usage}${buildQueryString(filters)}`,
    paginatedTeacherUsageLogsSchema
  )
}

const API_PAGE_SIZE = 100

async function getAllTeacherUsage(
  filters: TeacherUsageFilters
): Promise<PaginatedTeacherUsageLogs> {
  const firstPage = await getTeacherUsagePage(filters, 0, API_PAGE_SIZE)

  if (firstPage.total <= firstPage.items.length) {
    return {
      ...firstPage,
      skip: 0,
      limit: Math.max(firstPage.total, 1),
    }
  }

  const pageCount = Math.ceil(firstPage.total / API_PAGE_SIZE)
  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      getTeacherUsagePage(filters, (index + 1) * API_PAGE_SIZE, API_PAGE_SIZE)
    )
  )
  const items = [firstPage, ...remainingPages]
    .flatMap((page) => page.items)
    .slice(0, firstPage.total)

  return {
    ...firstPage,
    skip: 0,
    limit: Math.max(firstPage.total, 1),
    items,
  }
}

function getTeacherUsagePage(
  filters: TeacherUsageFilters,
  skip: number,
  limit: number
) {
  return apiFetch(
    `${endpoints.teachers.usage}${buildQueryString({
      ...filters,
      skip,
      limit,
    })}`,
    paginatedTeacherUsageLogsSchema
  )
}
