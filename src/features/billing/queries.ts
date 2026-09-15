import "server-only"

import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import {
  paginatedTeacherPaymentsSchema,
  type PaginatedTeacherPayments,
} from "@/features/billing/schema"

export type TeacherPaymentFilters = {
  startDate?: string
  endDate?: string
  minAmount?: string
  maxAmount?: string
  sortBy?: "created_at" | "amount"
  sortOrder?: "asc" | "desc"
  skip?: number
  limit?: number
}

export function buildTeacherPaymentsQuery(filters: TeacherPaymentFilters): string {
  const query = new URLSearchParams()

  if (filters.startDate) query.set("start_date", filters.startDate)
  if (filters.endDate) query.set("end_date", filters.endDate)
  if (filters.minAmount) query.set("min_amount", filters.minAmount)
  if (filters.maxAmount) query.set("max_amount", filters.maxAmount)
  if (filters.sortBy) query.set("sort_by", filters.sortBy)
  if (filters.sortOrder) query.set("sort_order", filters.sortOrder)
  if (filters.skip != null) query.set("skip", String(filters.skip))
  if (filters.limit != null) query.set("limit", String(filters.limit))

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

export async function getTeacherPayments(
  filters: TeacherPaymentFilters = {}
): Promise<PaginatedTeacherPayments> {
  return apiFetch(
    `${endpoints.teachers.payments}${buildTeacherPaymentsQuery(filters)}`,
    paginatedTeacherPaymentsSchema
  )
}

export async function getAdminTeacherPayments(
  teacherProfileId: number,
  filters: TeacherPaymentFilters = {}
): Promise<PaginatedTeacherPayments> {
  return apiFetch(
    `${endpoints.admin.teacherPayments(teacherProfileId)}${buildTeacherPaymentsQuery(filters)}`,
    paginatedTeacherPaymentsSchema
  )
}
