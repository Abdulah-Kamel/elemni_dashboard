import "server-only"
import { apiFetch } from "@/lib/api/client"
import {
  adminOverviewSchema,
  adminLibrarySettingsSchema,
  adminStudentPageSchema,
  adminSubscriptionPageSchema,
  adminTeacherListItemSchema,
  adminTeacherPageSchema,
  publicTeacherOutSchema,
  type AdminStudentPage,
  type AdminSubscriptionPage,
  type AdminTeacherPage,
  type PublicTeacherOut,
} from "@/features/admin/schema"

type PageParams = {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  gradeId?: number
  streamId?: number
  teacherProfileId?: number
  paymentStatus?: string
}

function queryString(params: PageParams): string {
  const query = new URLSearchParams()
  const limit = params.limit ?? 10
  query.set("skip", String(((params.page ?? 1) - 1) * limit))
  query.set("limit", String(limit))
  if (params.search) query.set("search", params.search)
  if (params.isActive !== undefined) query.set("is_active", String(params.isActive))
  if (params.gradeId) query.set("grade_id", String(params.gradeId))
  if (params.streamId) query.set("stream_id", String(params.streamId))
  if (params.teacherProfileId) query.set("teacher_profile_id", String(params.teacherProfileId))
  if (params.paymentStatus) query.set("payment_status", params.paymentStatus)
  return query.toString()
}

export async function listTeachers(): Promise<PublicTeacherOut[]> {
  return apiFetch("/api/v1/teachers", publicTeacherOutSchema.array(), {
    noAuth: true,
    tags: ["teachers:all"],
    revalidate: 60,
  })
}

export async function listAdminTeachers(params: PageParams = {}): Promise<AdminTeacherPage> {
  return apiFetch(`/api/v1/admin/teachers?${queryString(params)}`, adminTeacherPageSchema)
}

export async function getAdminTeacher(id: number) {
  return apiFetch(`/api/v1/admin/teachers/${id}`, adminTeacherListItemSchema)
}

export async function getAdminOverview() {
  return apiFetch("/api/v1/admin/overview", adminOverviewSchema)
}

export async function getAdminLibrarySettings(id: number) {
  return apiFetch(`/api/v1/admin/teachers/${id}/library/settings`, adminLibrarySettingsSchema)
}

export async function listAdminStudents(params: PageParams = {}): Promise<AdminStudentPage> {
  return apiFetch(`/api/v1/admin/students?${queryString(params)}`, adminStudentPageSchema)
}

export async function listAdminSubscriptions(params: PageParams = {}): Promise<AdminSubscriptionPage> {
  return apiFetch(`/api/v1/admin/subscriptions?${queryString(params)}`, adminSubscriptionPageSchema)
}

export type { PageParams }
