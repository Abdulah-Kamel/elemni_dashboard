import { z } from "zod"

const decimalValueSchema = z.coerce.number()

export const teacherAnalyticsSchema = z.object({
  total_earnings: decimalValueSchema,
  sum_earning_money: decimalValueSchema,
  total_revenue: decimalValueSchema,
  student_subscription_count: z.number().int().nonnegative(),
  subscription_count: z.number().int().nonnegative(),
  active_courses_count: z.number().int().nonnegative(),
  archived_courses_count: z.number().int().nonnegative(),
  archieved_courses_count: z.number().int().nonnegative(),
  start_date: z.string().datetime().nullable(),
  end_date: z.string().datetime().nullable(),
})
export type TeacherAnalytics = z.infer<typeof teacherAnalyticsSchema>

export const topEarningCourseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  name: z.string(),
  price: decimalValueSchema,
  img: z.string().nullable().optional(),
  course_image: z.string().nullable().optional(),
  earning_amount: decimalValueSchema,
  total_earnings: decimalValueSchema,
  student_subscription_count: z.number().int().nonnegative(),
  subscribed_students_count: z.number().int().nonnegative(),
})
export type TopEarningCourse = z.infer<typeof topEarningCourseSchema>
