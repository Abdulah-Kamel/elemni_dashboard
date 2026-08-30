import { z } from "zod"

const decimalValueSchema = z.coerce.number()

export const teacherUsageLogSchema = z.object({
  id: z.number().int(),
  teacher_profile_id: z.number().int(),
  teacher_name: z.string().nullable(),
  teacher_email: z.string().nullable(),
  teacher_slug: z.string().nullable(),
  date: z.string().min(1),
  bandwidth_bytes: z.number().int().nonnegative(),
  storage_bytes: z.number().int().nonnegative(),
  bandwidth_cost_per_gb: decimalValueSchema,
  storage_cost_per_gb_monthly: decimalValueSchema,
  bandwidth_cost_amount: decimalValueSchema,
  storage_cost_amount: decimalValueSchema,
  cost_amount: decimalValueSchema,
  created_at: z.string().min(1),
})

export type TeacherUsageLog = z.infer<typeof teacherUsageLogSchema>

export const teacherUsageSummarySchema = z.object({
  total_bandwidth_bytes: z.number().int().nonnegative(),
  total_storage_bytes: z.number().int().nonnegative(),
  total_bandwidth_cost: decimalValueSchema,
  total_storage_cost: decimalValueSchema,
  total_cost: decimalValueSchema,
  log_count: z.number().int().nonnegative(),
  pending_dues: decimalValueSchema.nullable(),
  storage_used_mb: z.number().int().nonnegative().nullable(),
})

export type TeacherUsageSummary = z.infer<typeof teacherUsageSummarySchema>

export const paginatedTeacherUsageLogsSchema = z.object({
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  summary: teacherUsageSummarySchema,
  items: teacherUsageLogSchema.array(),
})

export type PaginatedTeacherUsageLogs = z.infer<
  typeof paginatedTeacherUsageLogsSchema
>
