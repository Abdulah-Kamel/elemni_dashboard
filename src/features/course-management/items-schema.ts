import { z } from "zod";

export const itemOutSchema = z.object({
  id: z.number().int(),
  lesson_id: z.number().int(),
  title: z.string(),
  bunny_stream_id: z.string().nullable(),
  document_path: z.string().nullable(),
  exam_id: z.number().int().nullable(),
  order: z.number(),
});
export type ItemOut = z.infer<typeof itemOutSchema>;

export const itemCreateSchema = z.object({
  title: z.string().min(1).max(200),
});
export type ItemCreate = z.infer<typeof itemCreateSchema>;

export const itemUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});
export type ItemUpdate = z.infer<typeof itemUpdateSchema>;

export const uploadUrlResponseSchema = z.object({
  url: z.string(),
  key: z.string(),
});
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
