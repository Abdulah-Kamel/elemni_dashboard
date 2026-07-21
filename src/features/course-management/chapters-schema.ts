import { z } from "zod";

export const chapterOutSchema = z.object({
  id: z.number().int(),
  course_id: z.number().int(),
  title: z.string(),
  order: z.number(),
});
export type ChapterOut = z.infer<typeof chapterOutSchema>;

export const chapterCreateSchema = z.object({
  title: z.string().min(1).max(200),
});
export type ChapterCreate = z.infer<typeof chapterCreateSchema>;

export const chapterUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});
export type ChapterUpdate = z.infer<typeof chapterUpdateSchema>;

export const reorderItemSchema = z.object({
  id: z.number().int(),
  order: z.number(),
});
export type ReorderItem = z.infer<typeof reorderItemSchema>;

export const reorderRequestSchema = z.object({
  items: z.array(reorderItemSchema).min(2, "At least 2 items required for reorder"),
});
export type ReorderRequest = z.infer<typeof reorderRequestSchema>;
