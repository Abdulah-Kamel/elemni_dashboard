import type { CourseFormValues, SubjectOut, GradeOut, StreamOut } from "@/features/course-management/schema";
import type { StudentCoursePreviewModel, StudentPreviewSection } from "./types";

export function buildCoursePreviewModel({
  courseId,
  values,
  coverObjectUrl,
  publicCoverUrl,
  teacher,
  subjects,
  grades,
  streams,
  sections,
  locale = "ar",
}: {
  courseId: string | number | null;
  values: CourseFormValues;
  coverObjectUrl: string | null;
  publicCoverUrl: string | null;
  teacher: { name: string; avatarUrl: string | null } | null;
  subjects: SubjectOut[];
  grades: GradeOut[];
  streams: StreamOut[];
  sections: StudentPreviewSection[];
  locale?: string;
}): StudentCoursePreviewModel {
  const isArabic = locale.toLowerCase().startsWith("ar");
  return {
    id: courseId ?? "preview",
    title: values.title || (isArabic ? "عنوان الكورس" : "Course title"),
    description: values.description || (isArabic ? "وصف الكورس" : "Course description"),
    coverUrl: coverObjectUrl ?? publicCoverUrl ?? null,
    price: values.price || "0",
    subject: subjects.find((s) => s.id === values.subjectId)?.name ?? null,
    subjectId: values.subjectId,
    grade: grades.find((g) => g.id === values.gradeId)?.name ?? null,
    gradeId: values.gradeId,
    stream: streams.find((s) => s.id === values.streamId)?.name ?? null,
    streamId: values.streamId,
    teacher,
    sections,
  };
}
