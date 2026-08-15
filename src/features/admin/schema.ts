import { z } from "zod"

export const gradeSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  level: z.string(),
})

export const streamSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
})

export const subjectSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  grades: z.array(gradeSchema).default([]),
  streams: z.array(streamSchema).default([]),
})

export const adminTeacherListItemSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string(),
  slug: z.string(),
  phone_number: z.string().nullable(),
  teacher_profile_id: z.number().int(),
  location: z.string().nullable().optional(),
  experience: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
  bandwidth_cost_per_gb: z.string(),
  storage_cost_per_gb_monthly: z.string(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  subjects: z.array(subjectSchema),
  grades: z.array(gradeSchema),
  has_library: z.boolean().default(false),
})

export const adminTeacherPageSchema = z.object({
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  items: z.array(adminTeacherListItemSchema),
})

export const adminCreateTeacherRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email(),
  phone_number: z.string().trim().max(20).nullable().optional(),
  slug: z.string().trim().min(1).max(100).nullable().optional(),
  location: z.string().trim().nullable().optional(),
  experience: z.number().int().nonnegative().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  subject_ids: z.array(z.number().int()).default([]),
  grade_ids: z.array(z.number().int()).default([]),
})

export const adminCreateTeacherResponseSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string(),
  slug: z.string(),
  phone_number: z.string().nullable(),
  teacher_profile_id: z.number().int(),
  location: z.string().nullable().optional(),
  experience: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
  bandwidth_cost_per_gb: z.string(),
  storage_cost_per_gb_monthly: z.string(),
  subject_ids: z.array(z.number().int()).default([]),
  grade_ids: z.array(z.number().int()).default([]),
  video_library_created: z.boolean().default(false),
  invitation_sent: z.boolean(),
})

export const adminUpdateTeacherSchema = adminCreateTeacherRequestSchema
  .partial()
  .extend({
    is_active: z.boolean().optional(),
    bandwidth_cost_per_gb: z.coerce.number().nonnegative().optional(),
    storage_cost_per_gb_monthly: z.coerce.number().nonnegative().optional(),
  })

export const adminStudentSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string(),
  phone_number: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  student_profile_id: z.number().int().nullable().optional(),
  whatsapp_number: z.string().nullable().optional(),
  parent_phone: z.string().nullable().optional(),
  grade_id: z.number().int().nullable().optional(),
  stream_id: z.number().int().nullable().optional(),
  grade_name: z.string().nullable().optional(),
  stream_name: z.string().nullable().optional(),
})

export const adminStudentCreateResponseSchema = adminStudentSchema.extend({
  invitation_sent: z.boolean(),
})

export const adminStudentPageSchema = z.object({
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  items: z.array(adminStudentSchema),
})

export const adminStudentCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(100),
  phone_number: z.string().trim().max(20).nullable().optional(),
  password: z.string().min(8).nullable().optional(),
  whatsapp_number: z.string().trim().max(20).nullable().optional(),
  parent_phone: z.string().trim().max(20).nullable().optional(),
  grade_id: z.number().int().nullable().optional(),
  stream_id: z.number().int().nullable().optional(),
  is_active: z.boolean().default(true),
})

export const adminStudentUpdateSchema = adminStudentCreateSchema.partial()

const subscriptionCourseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  slug: z.string().optional(),
  img: z.string().nullable().optional(),
}).passthrough()

export const adminSubscriptionSchema = z.object({
  enrollment_id: z.number().int(),
  purchased_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  payment_status: z.string(),
  total_paid: z.string(),
  currency: z.string(),
  student_id: z.number().int(),
  student_name: z.string(),
  student_email: z.string().email(),
  student_phone: z.string().nullable().optional(),
  whatsapp_number: z.string().nullable().optional(),
  parent_phone: z.string().nullable().optional(),
  grade_id: z.number().int().nullable().optional(),
  grade_name: z.string().nullable().optional(),
  stream_id: z.number().int().nullable().optional(),
  stream_name: z.string().nullable().optional(),
  course: subscriptionCourseSchema,
})

export const adminSubscriptionPageSchema = z.object({
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  items: z.array(adminSubscriptionSchema),
})

export const adminOverviewSchema = z.object({
  teacher_total: z.number().int().nonnegative(),
  active_teacher_total: z.number().int().nonnegative(),
  student_total: z.number().int().nonnegative(),
  active_student_total: z.number().int().nonnegative(),
  completed_subscription_total: z.number().int().nonnegative(),
  collected_revenue: z.string(),
  currency: z.string(),
})

export const adminLibrarySettingsSchema = z.object({
  controls: z.array(z.enum(["play-large", "play", "rewind", "fast-forward", "progress", "current-time", "mute", "volume", "captions", "settings", "fullscreen"])),
  block_none_referrer: z.boolean(),
  enable_content_tagging: z.boolean(),
  enable_drm: z.boolean(),
}).strict()

export const gradeCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  level: z.string().trim().min(1).max(20),
})
export const streamCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  slug: z.string().trim().min(1).max(20),
})
export const subjectCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100),
  grade_ids: z.array(z.number().int()).min(1),
  stream_ids: z.array(z.number().int()).min(1),
})

export const taxonomyCreateSchema = z.union([
  gradeCreateSchema,
  streamCreateSchema,
  subjectCreateSchema,
])
export const taxonomyUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(100).optional(),
  level: z.string().trim().min(1).max(20).optional(),
  grade_ids: z.array(z.number().int()).optional(),
  stream_ids: z.array(z.number().int()).optional(),
})

export const setPasswordResponseSchema = z.object({ detail: z.string() })

export type AdminTeacherListItem = z.infer<typeof adminTeacherListItemSchema>
export type AdminTeacherPage = z.infer<typeof adminTeacherPageSchema>
export type AdminCreateTeacherRequest = z.infer<typeof adminCreateTeacherRequestSchema>
export type AdminCreateTeacherResponse = z.infer<typeof adminCreateTeacherResponseSchema>
export type AdminStudent = z.infer<typeof adminStudentSchema>
export type AdminStudentCreateResponse = z.infer<typeof adminStudentCreateResponseSchema>
export type AdminStudentPage = z.infer<typeof adminStudentPageSchema>
export type AdminSubscriptionPage = z.infer<typeof adminSubscriptionPageSchema>
export type AdminOverview = z.infer<typeof adminOverviewSchema>
export type AdminLibrarySettings = z.infer<typeof adminLibrarySettingsSchema>
export type TaxonomyCreate = z.infer<typeof taxonomyCreateSchema>
export type TaxonomyUpdate = z.infer<typeof taxonomyUpdateSchema>

export const publicTeacherOutSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
  subjects: z.array(subjectSchema),
  grades: z.array(gradeSchema),
})
export type PublicTeacherOut = z.infer<typeof publicTeacherOutSchema>
