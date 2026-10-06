import { z } from "zod"

export const grantSchema = z.object({
  id: z.number().int(), user_id: z.number().int(), item_id: z.number().int(),
  granted_by_id: z.number().int().nullable(), idempotency_key: z.string(),
  granted_views: z.number().int(), consumed_views: z.number().int(), remaining_views: z.number().int(),
  reason: z.string().nullable(), created_at: z.string(), expires_at: z.string().nullable(), revoked_at: z.string().nullable(),
})
export type Grant = z.infer<typeof grantSchema>

export const grantCreateSchema = z.object({
  user_id: z.number().int().positive(),
  item_id: z.number().int().positive(),
  granted_views: z.number().int().min(1).max(1000),
  reason: z.string().trim().max(500).optional(),
  expires_at: z.string().datetime({ offset: true }).refine((v) => Date.parse(v) > Date.now(), "expiry must be in the future").optional(),
})
export type GrantCreate = z.infer<typeof grantCreateSchema>

export const courseVideoSchema = z.object({
  item_id: z.number().int(), title: z.string(), lesson_title: z.string(), max_watch_count: z.number().int().nullable(),
})
export type CourseVideo = z.infer<typeof courseVideoSchema>
