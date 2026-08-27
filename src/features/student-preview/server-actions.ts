"use server";

import { verifySession } from "@/lib/auth/dal";
import { listChapters } from "@/features/course-management/chapters-queries";
import { listLessons } from "@/features/course-management/lessons-queries";
import { listItems } from "@/features/course-management/items-queries";
import type { StudentPreviewSection, PreviewActionResult } from "./types";

export async function loadCoursePreviewCurriculum(
  courseId: number
): Promise<PreviewActionResult<StudentPreviewSection[]>> {
  try {
    const session = await verifySession();
    if (!session) {
      return { success: false, error: { type: "Unauthorized", message: "يجب تسجيل الدخول" } };
    }

    const chapters = await listChapters(courseId);
    const lessons = await listLessons(courseId);

    const lessonsByChapter = new Map<number | null, typeof lessons>();
    for (const lesson of lessons) {
      const key = lesson.chapter_id ?? null;
      if (!lessonsByChapter.has(key)) lessonsByChapter.set(key, []);
      lessonsByChapter.get(key)!.push(lesson);
    }

    const sections: StudentPreviewSection[] = [];

    for (const chapter of chapters) {
      const chapterLessons = lessonsByChapter.get(chapter.id) ?? [];
      const lessonsWithItems = await Promise.all(
        chapterLessons.map(async (lesson) => {
          const items = await listItems(courseId, lesson.id);
          return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            durationMinutes: null,
            items: items.map((item) => ({
              id: item.id,
              title: item.title,
              hasVideo: !!item.bunny_stream_id,
              hasDocument: false,
              hasExam: !!item.exam_id,
            })),
          };
        })
      );

      sections.push({
        id: chapter.id,
        title: chapter.title,
        lessons: lessonsWithItems,
      });
    }

    return { success: true, data: sections };
  } catch (error) {
    return { success: false, error: { type: "Server", message: "فشل تحميل المنهج" } };
  }
}
