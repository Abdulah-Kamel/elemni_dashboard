import "server-only"
import { cache } from "react"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import {
  courseOutSchema,
  paginatedCoursesSchema,
} from "@/features/shell/schema"
import {
  subjectOutSchema,
  gradeOutSchema,
  streamOutSchema,
} from "@/features/course-management/schema"
import type { CourseOut } from "@/features/shell/schema"
import type {
  SubjectOut,
  GradeOut,
  StreamOut,
} from "@/features/course-management/schema"

export async function listCourses(
  teacherProfileId: number
): Promise<CourseOut[]> {
  const pageSize = 100
  const courses: CourseOut[] = []
  let skip = 0
  let total = 0

  do {
    const path = `${endpoints.courses.list}?skip=${skip}&limit=${pageSize}`
    const result = await apiFetch(path, paginatedCoursesSchema, {
      tags: [`courses:${teacherProfileId}`],
    })
    courses.push(...result.items)
    total = result.total
    skip += result.items.length

    if (result.items.length === 0) break
  } while (courses.length < total)

  return courses
}

export async function getCourse(courseId: number): Promise<CourseOut> {
  return apiFetch(endpoints.courses.detail(courseId), courseOutSchema, {
    tags: [`course:${courseId}`],
  })
}

export const listSubjects = cache(async (): Promise<SubjectOut[]> => {
  return apiFetch(endpoints.public.subjects, subjectOutSchema.array(), {
    noAuth: true,
    tags: ["catalog:subjects"],
    revalidate: 3600,
  })
})

export const listGrades = cache(async (): Promise<GradeOut[]> => {
  return apiFetch(endpoints.public.grades, gradeOutSchema.array(), {
    noAuth: true,
    tags: ["catalog:grades"],
    revalidate: 3600,
  })
})

export const listStreams = cache(async (): Promise<StreamOut[]> => {
  return apiFetch(endpoints.public.streams, streamOutSchema.array(), {
    noAuth: true,
    tags: ["catalog:streams"],
    revalidate: 3600,
  })
})
