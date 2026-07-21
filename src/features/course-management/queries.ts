import "server-only";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { courseOutSchema, paginatedCoursesSchema } from "@/features/shell/schema";
import {
  subjectOutSchema,
  gradeOutSchema,
  streamOutSchema,
} from "@/features/course-management/schema";
import type { CourseOut } from "@/features/shell/schema";
import type { SubjectOut, GradeOut, StreamOut } from "@/features/course-management/schema";

export async function listCourses(teacherProfileId: number): Promise<CourseOut[]> {
  const result = await apiFetch(endpoints.courses.list, paginatedCoursesSchema, {
    tags: [`courses:${teacherProfileId}`],
  });
  return result.items;
}

export async function getCourse(courseId: number): Promise<CourseOut> {
  return apiFetch(endpoints.courses.detail(courseId), courseOutSchema, {
    tags: [`course:${courseId}`],
  });
}

export async function listSubjects(): Promise<SubjectOut[]> {
  return apiFetch(endpoints.public.subjects, subjectOutSchema.array(), {
    noAuth: true,
    revalidate: 3600,
  });
}

export async function listGrades(): Promise<GradeOut[]> {
  return apiFetch(endpoints.public.grades, gradeOutSchema.array(), {
    noAuth: true,
    revalidate: 3600,
  });
}

export async function listStreams(): Promise<StreamOut[]> {
  return apiFetch(endpoints.public.streams, streamOutSchema.array(), {
    noAuth: true,
    revalidate: 3600,
  });
}
