"use server"

import { verifySession } from "@/lib/auth/dal"
import { getCourse } from "@/features/course-management/queries"
import { listChapters } from "@/features/course-management/chapters-queries"
import { listLessons } from "@/features/course-management/lessons-queries"
import { listItems } from "@/features/course-management/items-queries"
import type { StudentPreviewSection, PreviewActionResult } from "./types"

export async function loadCoursePreviewCurriculum(
  courseId: number
): Promise<PreviewActionResult<StudentPreviewSection[]>> {
  try {
    const session = await verifySession()
    if (!session) {
      return {
        success: false,
        error: { type: "Unauthorized", message: "يجب تسجيل الدخول" },
      }
    }

    // This detail request is the authorization boundary: the upstream API only
    // returns courses the current dashboard user is allowed to manage.
    // The chapters endpoint intentionally rejects flat courses, so only call it
    // when the course is configured to use chapters.
    const course = await getCourse(courseId)

    const [chapters, lessons] = await Promise.all([
      course.use_chapters ? listChapters(courseId) : Promise.resolve([]),
      listLessons(courseId),
    ])

    const lessonsByChapter = new Map<number | null, typeof lessons>()
    for (const lesson of lessons) {
      const key = lesson.chapter_id ?? null
      if (!lessonsByChapter.has(key)) lessonsByChapter.set(key, [])
      lessonsByChapter.get(key)!.push(lesson)
    }

    const loadLesson = async (lesson: (typeof lessons)[number]) => {
      const items = await listItems(courseId, lesson.id)
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        durationMinutes: null,
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          hasVideo: !!item.bunny_stream_id,
          hasDocument: !!item.document_path,
          hasExam: !!item.exam_id,
        })),
      }
    }

    const sections: StudentPreviewSection[] = await Promise.all(
      chapters.map(async (chapter) => ({
        id: chapter.id,
        title: chapter.title,
        lessons: await Promise.all(
          (lessonsByChapter.get(chapter.id) ?? []).map(loadLesson)
        ),
      }))
    )

    const ungroupedLessons = lessonsByChapter.get(null) ?? []
    if (ungroupedLessons.length > 0) {
      sections.push({
        id: "ungrouped",
        title: null,
        lessons: await Promise.all(ungroupedLessons.map(loadLesson)),
      })
    }

    return { success: true, data: sections }
  } catch {
    return {
      success: false,
      error: { type: "Server", message: "فشل تحميل المنهج" },
    }
  }
}
