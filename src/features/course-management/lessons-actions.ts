"use server"
import { revalidateTag } from "next/cache"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import { headers } from "next/headers"
import {
  lessonOutSchema,
  lessonCreateSchema,
  lessonUpdateSchema,
} from "@/features/course-management/lessons-schema"
import type {
  LessonOut,
  LessonCreate,
  LessonUpdate,
} from "@/features/course-management/lessons-schema"
import {
  reorderItemSchema,
  type ReorderItem,
} from "@/features/course-management/chapters-schema"
import { logger } from "@/lib/logger"
import { redirectToAuth as redirectToAuthRoute } from "@/lib/auth/redirect"

type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false
      error: { type: string; message: string; fields?: string[] }
    }

async function redirectToSignIn(nextPath: string): Promise<never> {
  const h = await headers()
  const locale = h.get("Accept-Language")?.startsWith("en") ? "en" : "ar"
  return redirectToAuthRoute(locale, nextPath)
}

export async function listLessons(
  courseId: number,
  chapterId?: number
): Promise<ActionResult<LessonOut[]>> {
  logger.action("listLessons", { courseId, chapterId })
  const start = performance.now()

  try {
    const url =
      chapterId != null
        ? `${endpoints.courses.lessons.list(courseId)}?chapter_id=${chapterId}`
        : endpoints.courses.lessons.list(courseId)
    const lessons = await apiFetch(url, lessonOutSchema.array())
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("listLessons", { count: lessons.length }, elapsed)
    return { success: true, data: lessons }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("listLessons", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("listLessons", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("listLessons", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}

export async function createLesson(
  courseId: number,
  data: LessonCreate,
  chapterId?: number
): Promise<ActionResult<LessonOut>> {
  const body = lessonCreateSchema.parse(data)

  logger.action("createLesson", { courseId, chapterId, title: body.title })
  const start = performance.now()

  try {
    const url =
      chapterId != null
        ? `${endpoints.courses.lessons.list(courseId)}?chapter_id=${chapterId}`
        : endpoints.courses.lessons.list(courseId)
    const lesson = await apiFetch(url, lessonOutSchema, {
      method: "POST",
      body: JSON.stringify(body),
    })
    revalidateTag(`lessons:${courseId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("createLesson", { lessonId: lesson.id }, elapsed)
    return { success: true, data: lesson }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("createLesson", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("createLesson", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("createLesson", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}

export async function updateLesson(
  courseId: number,
  lessonId: number,
  data: LessonUpdate
): Promise<ActionResult<LessonOut>> {
  const body = lessonUpdateSchema.parse(data)

  logger.action("updateLesson", { courseId, lessonId })
  const start = performance.now()

  try {
    const lesson = await apiFetch(
      endpoints.courses.lessons.detail(courseId, lessonId),
      lessonOutSchema,
      { method: "PATCH", body: JSON.stringify(body) }
    )
    revalidateTag(`lessons:${courseId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("updateLesson", { lessonId: lesson.id }, elapsed)
    return { success: true, data: lesson }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("updateLesson", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("updateLesson", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("updateLesson", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}

export async function reorderLessons(
  courseId: number,
  items: ReorderItem[],
  chapterId?: number
): Promise<ActionResult<LessonOut[]>> {
  const body = reorderItemSchema.array().parse(items)

  logger.action("reorderLessons", {
    courseId,
    chapterId,
    itemCount: body.length,
  })
  const start = performance.now()

  try {
    let url = endpoints.courses.lessons.reorder(courseId)
    if (chapterId != null) {
      url = `${url}?chapter_id=${chapterId}`
    }
    const lessons = await apiFetch(url, lessonOutSchema.array(), {
      method: "PUT",
      body: JSON.stringify({ items: body }),
    })
    revalidateTag(`lessons:${courseId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone(
      "reorderLessons",
      { lessonIds: lessons.map((l) => l.id) },
      elapsed
    )
    return { success: true, data: lessons }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("reorderLessons", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("reorderLessons", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("reorderLessons", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}

export async function deleteLesson(
  courseId: number,
  lessonId: number
): Promise<ActionResult<void>> {
  logger.action("deleteLesson", { courseId, lessonId })
  const start = performance.now()

  try {
    await apiFetch(
      endpoints.courses.lessons.detail(courseId, lessonId),
      lessonOutSchema,
      { method: "DELETE" }
    )
    revalidateTag(`lessons:${courseId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("deleteLesson", { lessonId }, elapsed)
    return { success: true, data: undefined }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("deleteLesson", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("deleteLesson", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("deleteLesson", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}
