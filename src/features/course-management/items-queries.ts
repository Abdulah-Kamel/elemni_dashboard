import "server-only";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { itemOutSchema } from "@/features/course-management/items-schema";
import type { ItemOut } from "@/features/course-management/items-schema";

export async function listItems(courseId: number, lessonId: number): Promise<ItemOut[]> {
  return apiFetch(endpoints.courses.items.list(courseId, lessonId), itemOutSchema.array(), {
    tags: [`items:${courseId}:${lessonId}`],
  });
}
