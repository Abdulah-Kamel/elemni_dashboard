"use server"
import { revalidateTag } from "next/cache"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import { headers } from "next/headers"
import { chapterOutSchema } from "@/features/course-management/chapters-schema"
import {
  chapterCreateSchema,
  chapterUpdateSchema,
  reorderItemSchema,
} from "@/features/course-management/chapters-schema"
import { logger } from "@/lib/logger"
import type {
  ChapterOut,
  ChapterCreate,
  ChapterUpdate,
  ReorderItem,
} from "@/features/course-management/chapters-schema"
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

export async function listChapters(
  courseId: number
): Promise<ActionResult<ChapterOut[]>> {
  logger.action("listChapters", { courseId })
  const start = performance.now()

  try {
    const chapters = await apiFetch(
      endpoints.courses.chapters.list(courseId),
      chapterOutSchema.array()
    )
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("listChapters", { count: chapters.length }, elapsed)
    return { success: true, data: chapters }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("listChapters", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("listChapters", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("listChapters", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}

export async function createChapter(
  courseId: number,
  data: ChapterCreate
): Promise<ActionResult<ChapterOut>> {
  const body = chapterCreateSchema.parse(data)

  logger.action("createChapter", { courseId, title: body.title })
  const start = performance.now()

  try {
    const chapter = await apiFetch(
      endpoints.courses.chapters.list(courseId),
      chapterOutSchema,
      { method: "POST", body: JSON.stringify(body) }
    )
    revalidateTag(`chapters:${courseId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("createChapter", { chapterId: chapter.id }, elapsed)
    return { success: true, data: chapter }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("createChapter", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("createChapter", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("createChapter", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}

export async function updateChapter(
  courseId: number,
  chapterId: number,
  data: ChapterUpdate
): Promise<ActionResult<ChapterOut>> {
  const body = chapterUpdateSchema.parse(data)

  logger.action("updateChapter", { courseId, chapterId })
  const start = performance.now()

  try {
    const chapter = await apiFetch(
      endpoints.courses.chapters.detail(courseId, chapterId),
      chapterOutSchema,
      { method: "PATCH", body: JSON.stringify(body) }
    )
    revalidateTag(`chapters:${courseId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("updateChapter", { chapterId: chapter.id }, elapsed)
    return { success: true, data: chapter }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("updateChapter", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("updateChapter", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("updateChapter", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}

export async function reorderChapters(
  courseId: number,
  items: ReorderItem[]
): Promise<ActionResult<ChapterOut[]>> {
  const body = reorderItemSchema.array().parse(items)

  logger.action("reorderChapters", { courseId, itemCount: body.length })
  const start = performance.now()

  try {
    const chapters = await apiFetch(
      endpoints.courses.chapters.reorder(courseId),
      chapterOutSchema.array(),
      { method: "PUT", body: JSON.stringify({ items: body }) }
    )
    revalidateTag(`chapters:${courseId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone(
      "reorderChapters",
      { chapterIds: chapters.map((c) => c.id) },
      elapsed
    )
    return { success: true, data: chapters }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("reorderChapters", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("reorderChapters", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("reorderChapters", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}

export async function deleteChapter(
  courseId: number,
  chapterId: number
): Promise<ActionResult<void>> {
  logger.action("deleteChapter", { courseId, chapterId })
  const start = performance.now()

  try {
    await apiFetch(
      endpoints.courses.chapters.detail(courseId, chapterId),
      chapterOutSchema,
      { method: "DELETE" }
    )
    revalidateTag(`chapters:${courseId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("deleteChapter", { chapterId }, elapsed)
    return { success: true, data: undefined }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("deleteChapter", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses/${courseId}`)
      }
      logger.actionError("deleteChapter", apiErr, elapsed)
      return { success: false, error: apiErr }
    }
    logger.actionError("deleteChapter", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}
