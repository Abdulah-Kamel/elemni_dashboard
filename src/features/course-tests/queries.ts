import "server-only"
import { z } from "zod"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import { isCourseTestsDemo } from "./client"
import { courseTestRowSchema, gradingQueueItemSchema, pendingCountSchema, testStatsSchema } from "./schema"
import type { CourseTestRow, GradingQueueItem, TestStats } from "./types"

// Server-side reads for first paint in API mode. They never redirect or throw:
// on any failure they return null and the client component loads (and shows
// a localized error / retry) itself. In demo mode there is no API to call.

export async function fetchCourseTestsOverview(courseId: number): Promise<{ rows: CourseTestRow[]; stats: TestStats } | null> {
  if (isCourseTestsDemo) return null
  try {
    const [rows, stats] = await Promise.all([
      apiFetch(endpoints.teacherTests.list(courseId), z.array(courseTestRowSchema), { tags: [`course-tests:${courseId}`] }),
      apiFetch(endpoints.teacherTests.stats(courseId), testStatsSchema, { tags: [`course-tests:${courseId}`] }),
    ])
    return { rows, stats }
  } catch {
    return null
  }
}

export async function fetchGradingQueue(testId?: number): Promise<GradingQueueItem[] | null> {
  if (isCourseTestsDemo) return null
  try {
    const qs = testId ? `?test_id=${testId}` : ""
    return await apiFetch(`${endpoints.teacherTests.gradingQueue}${qs}`, z.array(gradingQueueItemSchema), { tags: ["grading-queue"] })
  } catch {
    return null
  }
}

/** Sidebar badge. null = unknown (demo mode, or the API is unavailable): show no badge. */
export async function fetchPendingGradingCount(): Promise<number | null> {
  if (isCourseTestsDemo) return null
  try {
    const { count } = await apiFetch(endpoints.teacherTests.gradingCount, pendingCountSchema, { tags: ["grading-queue"], timeoutMs: 3_000 })
    return count
  } catch {
    return null
  }
}
