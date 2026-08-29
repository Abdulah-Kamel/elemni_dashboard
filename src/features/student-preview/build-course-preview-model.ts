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
}): StudentCoursePreviewModel {
  return {
    id: courseId ?? "preview",
    title: values.title || "عنوان الكورس",
    description: values.description || "وصف الكورس",
    coverUrl: coverObjectUrl ?? publicCoverUrl ?? null,
    price: values.price || "0",
    subject: subjects.find((s) => s.id === values.subjectId)?.name ?? null,
    grade: grades.find((g) => g.id === values.gradeId)?.name ?? null,
    stream: streams.find((s) => s.id === values.streamId)?.name ?? null,
    teacher,
    sections,
  };
}
