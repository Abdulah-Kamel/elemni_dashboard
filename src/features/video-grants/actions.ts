"use server"

import { revalidateTag } from "next/cache"
import { getLocale } from "next-intl/server"
import { z } from "zod"
import { listLessons } from "@/features/course-management/lessons-queries"
import { listItems } from "@/features/course-management/items-queries"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import { ApiErrorImpl } from "@/lib/api/errors"
import { redirectToAuth } from "@/lib/auth/redirect"
import { logger } from "@/lib/logger"
import { mapGrantError, type GrantErrorCode } from "./errors"
import {
  grantSchema,
  grantCreateSchema,
  type Grant,
  type GrantCreate,
  type CourseVideo,
} from "./schema"

export type GrantActionResult<T> =
  | { success: true; data: T }
  | { success: false; code: GrantErrorCode }

async function actionError(
  name: string,
  err: unknown,
  start: number
): Promise<{ success: false; code: GrantErrorCode }> {
  const elapsed = Math.round(performance.now() - start)
  if (err instanceof ApiErrorImpl && err.type === "Unauthorized") {
    logger.actionDone(name, { unauthorized: true }, elapsed)
    const locale = await getLocale()
    await redirectToAuth(locale, "/students")
  }
  logger.actionError(name, err, elapsed)
  return { success: false, code: mapGrantError(err) }
}

export async function listStudentGrants(
  studentId: number
): Promise<GrantActionResult<Grant[]>> {
  logger.action("listStudentGrants", { studentId })
  const start = performance.now()
  try {
    const grants = await apiFetch(
      endpoints.videoAnalytics.grants.list(studentId),
      grantSchema.array(),
      { tags: [`grants:${studentId}`] }
    )
    logger.actionDone("listStudentGrants", { count: grants.length }, Math.round(performance.now() - start))
    return { success: true, data: grants }
  } catch (err: unknown) {
    return actionError("listStudentGrants", err, start)
  }
}

export async function createGrant(
  input: GrantCreate,
  idempotencyKey: string
): Promise<GrantActionResult<Grant>> {
  logger.action("createGrant", { studentId: input.user_id, itemId: input.item_id })
  const start = performance.now()
  const parsed = grantCreateSchema.safeParse(input)
  if (!parsed.success) {
    logger.actionError("createGrant", parsed.error, Math.round(performance.now() - start))
    return { success: false, code: "invalid" }
  }
  try {
    const grant = await apiFetch(endpoints.videoAnalytics.grants.create, grantSchema, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(parsed.data),
      refreshOnUnauthorized: false,
    })
    revalidateTag(`grants:${input.user_id}`, "default")
    logger.actionDone("createGrant", { grantId: grant.id }, Math.round(performance.now() - start))
    return { success: true, data: grant }
  } catch (err: unknown) {
    return actionError("createGrant", err, start)
  }
}

export async function revokeGrant(
  grantId: number,
  studentId: number
): Promise<GrantActionResult<null>> {
  logger.action("revokeGrant", { grantId, studentId })
  const start = performance.now()
  try {
    await apiFetch(
      endpoints.videoAnalytics.grants.revoke(grantId),
      z.object({ status: z.literal("revoked") }),
      { method: "DELETE" }
    )
    revalidateTag(`grants:${studentId}`, "default")
    logger.actionDone("revokeGrant", { grantId }, Math.round(performance.now() - start))
    return { success: true, data: null }
  } catch (err: unknown) {
    return actionError("revokeGrant", err, start)
  }
}

export async function listCourseVideos(
  courseId: number
): Promise<GrantActionResult<CourseVideo[]>> {
  logger.action("listCourseVideos", { courseId })
  const start = performance.now()
  try {
    const lessons = (await listLessons(courseId)).sort((a, b) => a.order - b.order)
    const items = await Promise.all(lessons.map((lesson) => listItems(courseId, lesson.id)))
    const videos = lessons.flatMap((lesson, index) =>
      items[index]
        .filter((item) => item.bunny_stream_id)
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          item_id: item.id,
          title: item.title,
          lesson_title: lesson.title,
          max_watch_count: item.max_watch_count,
        }))
    )
    logger.actionDone("listCourseVideos", { count: videos.length }, Math.round(performance.now() - start))
    return { success: true, data: videos }
  } catch (err: unknown) {
    return actionError("listCourseVideos", err, start)
  }
}
