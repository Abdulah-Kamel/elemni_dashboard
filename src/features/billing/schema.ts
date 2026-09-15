import { z } from "zod"

const decimalValueSchema = z.coerce.number()

export const paymentStatusSchema = z.enum([
  "completed",
  "pending",
  "failed",
  "cancelled",
  "refunded",
  "duplicate_paid",
])

export type PaymentStatus = z.infer<typeof paymentStatusSchema>

export const teacherPaymentLogSchema = z.object({
  id: z.number().int(),
  teacher_profile_id: z.number().int(),
  admin_user_id: z.number().int().nullable(),
  admin_name: z.string().nullable(),
  amount: decimalValueSchema,
  note: z.string().nullable(),
  created_at: z.string().min(1),
  pending_dues: decimalValueSchema.nullable(),
  total_paid: decimalValueSchema.nullable(),
})

export type TeacherPaymentLog = z.infer<typeof teacherPaymentLogSchema>

export const paginatedTeacherPaymentsSchema = z.object({
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  total_paid_sum: decimalValueSchema,
  pending_dues: decimalValueSchema.nullable(),
  total_paid: decimalValueSchema.nullable(),
  items: teacherPaymentLogSchema.array(),
})

export type PaginatedTeacherPayments = z.infer<
  typeof paginatedTeacherPaymentsSchema
>

export const adminRecordTeacherPaymentRequestSchema = z.object({
  amount: z.coerce.number().positive(),
  note: z.string().trim().max(500).nullable().optional(),
})

export type AdminRecordTeacherPaymentRequest = z.infer<
  typeof adminRecordTeacherPaymentRequestSchema
>
