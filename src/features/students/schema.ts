import { z } from "zod"

export const teacherSubscriptionCourseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  price: z.coerce.number(),
  subject_name: z.string().nullable().optional(),
  grade_id: z.number().int().nullable().optional(),
  stream_id: z.number().int().nullable().optional(),
})
export type TeacherSubscriptionCourse = z.infer<
  typeof teacherSubscriptionCourseSchema
>

export const teacherSubscriptionSchema = z.object({
  enrollment_id: z.number().int(),
  purchased_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  payment_status: z.string(),
  total_paid: z.coerce.number(),
  currency: z.string().default("EGP"),
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
  course: teacherSubscriptionCourseSchema,
})
export type TeacherSubscription = z.infer<typeof teacherSubscriptionSchema>

export const teacherSubscriptionsPageSchema = z.object({
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  items: z.array(teacherSubscriptionSchema),
})
export type TeacherSubscriptionsPage = z.infer<
  typeof teacherSubscriptionsPageSchema
>
