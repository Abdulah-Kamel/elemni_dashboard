import { z } from "zod";
import {
  gradeOutSchema,
  streamOutSchema,
  subjectOutSchema,
} from "@/features/course-management/schema";

export const teacherProfileOutSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  slug: z.string(),
  phone_number: z.string().nullable(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  experience: z.number().int().nullable(),
  // Authenticated endpoints return the stored object key (for example
  // `profiles/2`), while public endpoints resolve it to a CDN URL.
  img: z.string().nullable(),
});

export const teacherProfileSchema = teacherProfileOutSchema.extend({
  subjects: subjectOutSchema.array(),
  grades: gradeOutSchema.array(),
  streams: streamOutSchema.array(),
});

export const publicTeacherProfileSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  experience: z.number().int().nullable(),
  img: z.string().nullable(),
  subjects: subjectOutSchema.array(),
  grades: gradeOutSchema.array(),
  course_count: z.number().int(),
});

export type TeacherProfileOut = z.infer<typeof teacherProfileOutSchema>;
export type TeacherProfile = z.infer<typeof teacherProfileSchema>;
export type PublicTeacherProfile = z.infer<typeof publicTeacherProfileSchema>;

export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(60).nullable().optional(),
  location: z.string().nullable().optional(),
  experience: z.number().int().nullable().optional(),
  img: z.string().nullable().optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const profileImageUploadSchema = z.object({
  upload_url: z.string().url(),
  path: z.string().min(1),
});

export type ProfileImageUpload = z.infer<typeof profileImageUploadSchema>;
