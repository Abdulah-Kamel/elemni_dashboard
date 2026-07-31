import { z } from "zod";

export const adminCreateTeacherRequestSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone_number: z.string().max(20).nullable().optional(),
  location: z.string().nullable().optional(),
  estimated_students: z.number().int().nullable().optional(),
  experience: z.number().int().nullable().optional(),
  cost_value: z.number().int().nullable().optional(),
  cost_type: z.string().nullable().optional(),
  current_platform: z.string().nullable().optional(),
  social_media: z.string().nullable().optional(),
  feedback: z.string().nullable().optional(),
  interest_level: z.string().nullable().optional(),
  call_status: z.string().nullable().optional(),
  call_date: z.string().nullable().optional(),
  follow_up_date: z.string().nullable().optional(),
  follow_up_count: z.number().int().default(0),
  demo_scheduled: z.string().nullable().optional(),
  signed_up: z.boolean().default(false),
  next_step: z.string().nullable().optional(),
  closed: z.boolean().default(false),
  description: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
  subject_ids: z.array(z.number().int()).default([]),
  grade_ids: z.array(z.number().int()).default([]),
});
export type AdminCreateTeacherRequest = z.infer<typeof adminCreateTeacherRequestSchema>;

export const adminCreateTeacherResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  slug: z.string(),
  phone_number: z.string().nullable(),
  teacher_profile_id: z.number(),
  location: z.string().nullable().optional(),
  estimated_students: z.number().int().nullable().optional(),
  experience: z.number().int().nullable().optional(),
  cost_value: z.number().int().nullable().optional(),
  cost_type: z.string().nullable().optional(),
  current_platform: z.string().nullable().optional(),
  social_media: z.string().nullable().optional(),
  feedback: z.string().nullable().optional(),
  interest_level: z.string().nullable().optional(),
  call_status: z.string().nullable().optional(),
  call_date: z.string().nullable().optional(),
  follow_up_date: z.string().nullable().optional(),
  follow_up_count: z.number().int().default(0),
  demo_scheduled: z.string().nullable().optional(),
  signed_up: z.boolean().default(false),
  next_step: z.string().nullable().optional(),
  closed: z.boolean().default(false),
  description: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
  subject_ids: z.array(z.number().int()).default([]),
  grade_ids: z.array(z.number().int()).default([]),
});
export type AdminCreateTeacherResponse = z.infer<typeof adminCreateTeacherResponseSchema>;

export const publicTeacherOutSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
  subjects: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })),
  grades: z.array(z.object({ id: z.number(), name: z.string(), level: z.string() })),
});
export type PublicTeacherOut = z.infer<typeof publicTeacherOutSchema>;

export const adminTeacherListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  subjects: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })),
  grades: z.array(z.object({ id: z.number(), name: z.string(), level: z.string() })),
  call_status: z.string().nullable().optional(),
  interest_level: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});
export type AdminTeacherListItem = z.infer<typeof adminTeacherListItemSchema>;

export const setPasswordResponseSchema = z.object({
  detail: z.string(),
});

export const taxonomyCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  level: z.string().min(1).optional(),
});
export type TaxonomyCreate = z.infer<typeof taxonomyCreateSchema>;

export const taxonomyUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  level: z.string().min(1).optional(),
});
export type TaxonomyUpdate = z.infer<typeof taxonomyUpdateSchema>;
