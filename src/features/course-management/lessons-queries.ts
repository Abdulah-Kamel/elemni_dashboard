import "server-only";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { lessonOutSchema } from "@/features/course-management/lessons-schema";
import type { LessonOut } from "@/features/course-management/lessons-schema";

export async function listLessons(
  courseId: number,
  chapterId?: number,
): Promise<LessonOut[]> {
  const url =
    chapterId != null
      ? `${endpoints.courses.lessons.list(courseId)}?chapter_id=${chapterId}`
      : endpoints.courses.lessons.list(courseId);
  return apiFetch(url, lessonOutSchema.array(), {
    tags: [`lessons:${courseId}`],
  });
}
