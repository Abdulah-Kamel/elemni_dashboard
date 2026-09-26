import type { CourseOut } from "@/features/shell/schema"
import {
  matchesAccess,
  toStudentRow,
} from "@/features/students/roster-model"
import type { TeacherSubscription } from "@/features/students/schema"
import { overviewLinks } from "./links"

export type AttentionId =
  | "draft_courses"
  | "expiring_soon"
  | "pending_payments"
  | "published_without_students"

export type AttentionEntry = {
  id: AttentionId
  count: number
  href: string
  tone: "warning" | "primary"
}

const isDraft = (course: CourseOut) => !course.is_published && !course.is_archived
const isPublished = (course: CourseOut) => course.is_published && !course.is_archived
const statusOf = (s: TeacherSubscription) => s.payment_status.toLowerCase()

// Access windows use the students roster's own helpers, so each count equals
// what the linked, filtered roster shows.
const hasAccess = (s: TeacherSubscription, now: Date, access: "active" | "expiring") =>
  matchesAccess(toStudentRow(s), access, now.getTime())

/**
 * Work items for the "needs your attention" list, counted straight from API
 * fields (course publish/archive flags, subscription status and end date).
 * An input that failed to load is `null` and its rows are left out; the
 * result is `null` when neither input loaded. Zero-count rows are kept here
 * and hidden by the list.
 */
export function deriveAttention({
  courses,
  subscriptions,
  now,
}: {
  courses: CourseOut[] | null
  subscriptions: TeacherSubscription[] | null
  now: Date
}): AttentionEntry[] | null {
  if (courses === null && subscriptions === null) return null
  const entries: AttentionEntry[] = []

  if (subscriptions !== null) {
    entries.push({
      id: "expiring_soon",
      count: subscriptions.filter((s) => hasAccess(s, now, "expiring")).length,
      href: overviewLinks.expiringSubscriptions,
      tone: "warning",
    })
    entries.push({
      id: "pending_payments",
      count: subscriptions.filter((s) => statusOf(s) === "pending").length,
      href: overviewLinks.pendingSubscriptions,
      tone: "warning",
    })
  }

  if (courses !== null) {
    entries.push({
      id: "draft_courses",
      count: courses.filter(isDraft).length,
      href: overviewLinks.draftCourses,
      tone: "primary",
    })
  }

  if (courses !== null && subscriptions !== null) {
    const withStudents = new Set(
      subscriptions.filter((s) => hasAccess(s, now, "active")).map((s) => s.course.id)
    )
    entries.push({
      id: "published_without_students",
      count: courses.filter((c) => isPublished(c) && !withStudents.has(c.id)).length,
      href: overviewLinks.publishedCourses,
      tone: "primary",
    })
  }

  return entries
}

/** Draft count for the courses tile hint; `null` when courses did not load. */
export function countDrafts(courses: CourseOut[] | null): number | null {
  return courses === null ? null : courses.filter(isDraft).length
}
