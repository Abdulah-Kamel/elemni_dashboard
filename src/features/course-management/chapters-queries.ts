import "server-only";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { chapterOutSchema } from "@/features/course-management/chapters-schema";
import type { ChapterOut } from "@/features/course-management/chapters-schema";

export async function listChapters(courseId: number): Promise<ChapterOut[]> {
  return apiFetch(endpoints.courses.chapters.list(courseId), chapterOutSchema.array(), {
    tags: [`chapters:${courseId}`],
  });
}
