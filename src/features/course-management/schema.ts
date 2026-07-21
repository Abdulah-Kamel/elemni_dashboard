import { z } from "zod";

export type { CourseOut } from "@/features/shell/schema";

const priceRegex = /^\d{1,8}\.\d{2}$/;

export const courseCreateSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(500).nullable().optional(),
  price: z.union([z.number(), z.string().regex(priceRegex)]).default("0.00"),
  subject_id: z.number().int(),
  grade_id: z.number().int(),
  stream_id: z.number().int(),
  is_published: z.boolean().default(false),
  use_chapters: z.boolean().default(false),
});
export type CourseCreate = z.infer<typeof courseCreateSchema>;

export const courseUpdateSchema = z.object({
  title: z.string().min(1).max(150).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  price: z.union([z.number(), z.string(), z.null()]).optional(),
  is_published: z.boolean().nullable().optional(),
  use_chapters: z.boolean().nullable().optional(),
});
export type CourseUpdate = z.infer<typeof courseUpdateSchema>;

export const courseFormSchema = z.object({
  title: z.string().min(1, "عنوان الدورة مطلوب").max(150, "العنوان لا يزيد عن 150 حرفًا"),
  description: z.string().max(500).nullable().optional(),
  price: z
    .string()
    .regex(/^\d{0,8}\.\d{2}$/, "السعر يجب أن يكون رقمًا بمنزلتين عشريتين (مثال: 100.00)")
    .default("0.00"),
  subjectId: z.number().int({ message: "المادة مطلوبة" }),
  gradeId: z.number().int({ message: "الصف مطلوب" }),
  streamId: z.number().int({ message: "الشعبة مطلوبة" }),
  useChapters: z.boolean().default(false),
  isPublished: z.boolean().optional(),
});
export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const subjectOutSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
});
export type SubjectOut = z.infer<typeof subjectOutSchema>;

export const gradeOutSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  level: z.string(),
});
export type GradeOut = z.infer<typeof gradeOutSchema>;

export const streamOutSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
});
export type StreamOut = z.infer<typeof streamOutSchema>;

export function formValuesToCourseCreate(values: CourseFormValues): CourseCreate {
  return {
    title: values.title,
    description: values.description ?? null,
    price: values.price || "0.00",
    subject_id: values.subjectId,
    grade_id: values.gradeId,
    stream_id: values.streamId,
    is_published: false,
    use_chapters: values.useChapters,
  };
}

export function formValuesToCourseUpdate(values: CourseFormValues): CourseUpdate {
  const update: CourseUpdate = {};
  if (values.title) update.title = values.title;
  if (values.description !== undefined) update.description = values.description ?? null;
  if (values.price) update.price = values.price;
  if (values.isPublished !== undefined) update.is_published = values.isPublished;
  if (values.useChapters !== undefined) update.use_chapters = values.useChapters;
  return update;
}
