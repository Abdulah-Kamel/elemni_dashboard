import "server-only";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { lessonOutSchema } from "@/features/course-management/lessons-schema";
import type { LessonOut } from "@/features/course-management/lessons-schema";

export async function listLessons(courseId: number): Promise<LessonOut[]> {
  return apiFetch(endpoints.courses.lessons.list(courseId), lessonOutSchema.array(), {
    tags: [`lessons:${courseId}`],
  });
}
