"use server"
import { revalidateTag } from "next/cache"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import { headers } from "next/headers"
import { courseOutSchema } from "@/features/shell/schema"
import {
  courseImageUploadSchema,
  courseCreateSchema,
  courseUpdateSchema,
} from "@/features/course-management/schema"
import {
  getCourse as getCourseQuery,
  listCourses as listCoursesQuery,
  listSubjects as listSubjectsQuery,
  listGrades as listGradesQuery,
  listStreams as listStreamsQuery,
} from "@/features/course-management/queries"
import { getTeacherProfile as getTeacherProfileQuery } from "@/features/profile/queries"
import type { CourseOut } from "@/features/shell/schema"
import type {
  CourseCreate,
  CourseUpdate,
} from "@/features/course-management/schema"
import type { CourseImageUpload } from "@/features/course-management/schema"
import type {
  SubjectOut,
  GradeOut,
  StreamOut,
} from "@/features/course-management/schema"
import { logger } from "@/lib/logger"
import { redirectToAuth as redirectToAuthRoute } from "@/lib/auth/redirect"

async function redirectToSignIn(nextPath: string): Promise<never> {
  const h = await headers()
  const locale = h.get("Accept-Language")?.startsWith("en") ? "en" : "ar"
  return redirectToAuthRoute(locale, nextPath)
}

export async function createCourse(
  teacherProfileId: number,
  data: FormData | CourseCreate
): Promise<
  | { success: true; course: CourseOut }
  | {
      success: false
      error: { type: string; message: string; fields?: string[] }
    }
> {
  let body: CourseCreate
  if (data instanceof FormData) {
    const raw = Object.fromEntries(data.entries())
    body = courseCreateSchema.parse(raw)
  } else {
    body = courseCreateSchema.parse(data)
  }

  logger.action("createCourse", { teacherProfileId, title: body.title })
  const start = performance.now()

  try {
    const course = await apiFetch(endpoints.courses.list, courseOutSchema, {
      method: "POST",
      body: JSON.stringify(body),
    })
    revalidateTag(`courses:${teacherProfileId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("createCourse", { courseId: course.id }, elapsed)
    return { success: true, course }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("createCourse", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses`)
      }
      logger.actionError("createCourse", apiErr, elapsed)
      return {
        success: false,
        error: {
          type: apiErr.type,
          message: apiErr.message,
          fields: apiErr.fields,
        },
      }
    }
    logger.actionError("createCourse", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}

export async function getCourseAction(courseId: number): Promise<CourseOut> {
  try {
    return await getCourseQuery(courseId)
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
    ) {
      await redirectToSignIn(`/courses/${courseId}`)
    }
    throw error
  }
}

export async function listCoursesAction(
  teacherProfileId: number
): Promise<CourseOut[]> {
  try {
    return await listCoursesQuery(teacherProfileId)
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
    ) {
      await redirectToSignIn(`/courses`)
    }
    throw error
  }
}

export async function requestCourseImageUpload(
  courseId: number,
  filename: string
): Promise<
  | { success: true; data: CourseImageUpload }
  | { success: false; error: { type: string; message: string } }
> {
  try {
    const path = `${endpoints.courses.requestImageUpload(courseId)}?filename=${encodeURIComponent(filename)}`
    const upload = await apiFetch(path, courseImageUploadSchema, {
      method: "POST",
    })
    return { success: true, data: upload }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "type" in err && "message" in err) {
      const apiErr = err as { type: string; message: string }
      return { success: false, error: apiErr }
    }
    return {
      success: false,
      error: { type: "Upstream", message: "Image upload request failed" },
    }
  }
}

export async function listSubjectsAction(): Promise<SubjectOut[]> {
  try {
    return await listSubjectsQuery()
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
    ) {
      await redirectToSignIn(`/courses`)
    }
    throw error
  }
}

export async function listGradesAction(): Promise<GradeOut[]> {
  try {
    return await listGradesQuery()
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
    ) {
      await redirectToSignIn(`/courses`)
    }
    throw error
  }
}

export async function listStreamsAction(): Promise<StreamOut[]> {
  try {
    return await listStreamsQuery()
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
    ) {
      await redirectToSignIn(`/courses`)
    }
    throw error
  }
}

/**
 * Curriculum available to the signed-in teacher. Unlike the public catalog
 * lists, this only includes subjects, grades, and streams assigned to the
 * teacher profile and therefore matches course-creation authorization.
 */
export async function getTeacherCurriculumAction(): Promise<{
  subjects: SubjectOut[]
  grades: GradeOut[]
  streams: StreamOut[]
}> {
  const profile = await getTeacherProfileQuery()
  return {
    subjects: profile.subjects,
    grades: profile.grades,
    streams: profile.streams,
  }
}

export async function publishCourse(
  courseId: number,
  teacherProfileId: number
): Promise<
  | { success: true; course: CourseOut }
  | { success: false; error: { type: string; message: string } }
> {
  return updateCourse(courseId, teacherProfileId, {
    is_published: true,
  } as CourseUpdate)
}

export async function unpublishCourse(
  courseId: number,
  teacherProfileId: number
): Promise<
  | { success: true; course: CourseOut }
  | { success: false; error: { type: string; message: string } }
> {
  return updateCourse(courseId, teacherProfileId, {
    is_published: false,
  } as CourseUpdate)
}

export async function updateCourse(
  courseId: number,
  teacherProfileId: number,
  data: FormData | CourseUpdate
): Promise<
  | { success: true; course: CourseOut }
  | {
      success: false
      error: { type: string; message: string; fields?: string[] }
    }
> {
  let body: CourseUpdate
  if (data instanceof FormData) {
    const raw = Object.fromEntries(data.entries())
    body = courseUpdateSchema.parse(raw)
  } else {
    body = courseUpdateSchema.parse(data)
  }

  logger.action("updateCourse", { courseId, teacherProfileId })
  const start = performance.now()

  try {
    const course = await apiFetch(
      endpoints.courses.detail(courseId),
      courseOutSchema,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    )
    revalidateTag(`course:${courseId}`, "default")
    revalidateTag(`courses:${teacherProfileId}`, "default")
    const elapsed = Math.round(performance.now() - start)
    logger.actionDone("updateCourse", { courseId: course.id }, elapsed)
    return { success: true, course }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start)
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] }
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("updateCourse", { unauthorized: true }, elapsed)
        await redirectToSignIn(`/courses`)
      }
      logger.actionError("updateCourse", apiErr, elapsed)
      return {
        success: false,
        error: {
          type: apiErr.type,
          message: apiErr.message,
          fields: apiErr.fields,
        },
      }
    }
    logger.actionError("updateCourse", err, elapsed)
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}
