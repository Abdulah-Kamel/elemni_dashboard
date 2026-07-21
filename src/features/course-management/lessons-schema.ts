import { z } from "zod";

export const lessonOutSchema = z.object({
  id: z.number().int(),
  course_id: z.number().int(),
  chapter_id: z.number().int().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  order: z.number(),
});
export type LessonOut = z.infer<typeof lessonOutSchema>;

export const lessonCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).nullable().optional(),
});
export type LessonCreate = z.infer<typeof lessonCreateSchema>;

export const lessonUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).nullable().optional(),
});
export type LessonUpdate = z.infer<typeof lessonUpdateSchema>;

export { reorderItemSchema, type ReorderItem } from "@/features/course-management/chapters-schema";
