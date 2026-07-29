import { z } from "zod";

export const teacherProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  slug: z.string(),
  phone_number: z.string().nullable(),
  description: z.string().nullable(),
  img: z.string().nullable(),
});
export type TeacherProfile = z.infer<typeof teacherProfileSchema>;

export const updateProfileRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  img: z.string().url().nullable().optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
