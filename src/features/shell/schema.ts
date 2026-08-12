import { z } from "zod"

export const userRoleSchema = z.enum([
  "ADMIN",
  "TEACHER",
  "ASSISTANT",
  "STUDENT",
])
export type UserRole = z.infer<typeof userRoleSchema>

export const userOutSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string(),
  phone_number: z.string().nullable(),
  role: userRoleSchema,
  is_active: z.boolean(),
  created_at: z.string().datetime(),
})
export type UserOut = z.infer<typeof userOutSchema>

export const courseOutSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  img: z.string().nullable().optional(),
  price: z.string(),
  is_published: z.boolean(),
  use_chapters: z.boolean(),
  subject_id: z.number().int().nullable(),
  subject_name: z.string().nullable().optional(),
  teacher_profile_id: z.number().int(),
  grade_id: z.number().int(),
  stream_id: z.number().int(),
  created_by_id: z.number().int().nullable(),
  created_at: z.string().datetime(),
})
export type CourseOut = z.infer<typeof courseOutSchema>

export const paginatedCoursesSchema = z.object({
  items: courseOutSchema.array(),
  total: z.number().int(),
  skip: z.number().int().optional(),
  limit: z.number().int().optional(),
})
export type PaginatedCourses = z.infer<typeof paginatedCoursesSchema>

export const sessionSchema = z.object({
  access_token: z.string().optional(),
  refresh_token: z.string(),
  expires_at: z.number().optional(),
})
export type SessionPayload = z.infer<typeof sessionSchema>

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
})
export type TokenResponse = z.infer<typeof tokenResponseSchema>

/**
 * `POST /api/v1/auth/login` response — slightly richer than `TokenResponse`,
 * the server also returns the user's email and name for the welcome state.
 * Contract: openapi.json#/components/schemas/LoginResponse
 */
export const loginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default("bearer"),
  email: z.string().email(),
  name: z.string(),
})
export type LoginResponse = z.infer<typeof loginResponseSchema>

/**
 * `POST /api/v1/auth/register` request — note `role` defaults to STUDENT on
 * the server. Public teacher signup goes through the admin endpoint
 * `/api/v1/admin/teachers` (out of scope for the dashboard's auth flow).
 * Contract: openapi.json#/components/schemas/UserRegister
 */
export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  phone_number: z.string().max(20),
  role: userRoleSchema.optional(),
  assistant_teacher_id: z.number().int().nullable().optional(),
})
export type UserRegister = z.infer<typeof userRegisterSchema>

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type UserLogin = z.infer<typeof userLoginSchema>

/**
 * Contract: openapi.json#/components/schemas/ForgotPasswordRequest
 */
export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
})
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>

/**
 * Contract: openapi.json#/components/schemas/ResetPasswordRequest
 */
export const resetPasswordRequestSchema = z.object({
  token: z.string(),
  new_password: z.string().min(8),
})
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>

export const logoutRequestSchema = z.object({
  refresh_token: z.string(),
})
export type LogoutRequest = z.infer<typeof logoutRequestSchema>

export const refreshRequestSchema = z.object({
  refresh_token: z.string(),
})
export type RefreshRequest = z.infer<typeof refreshRequestSchema>
