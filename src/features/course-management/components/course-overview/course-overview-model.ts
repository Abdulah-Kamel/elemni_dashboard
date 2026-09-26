import type { SortState } from "@/lib/sort"
import type { CourseOut } from "@/features/shell/schema"

/**
 * Per-course numbers for the courses list. Counts are derived by counting
 * rows of the teacher's complete subscriptions list; earnings are copied
 * verbatim from the top-courses API. Nothing here adds money together.
 */

export type CourseCounts = {
  /** Distinct students with a completed subscription to the course. */
  students: number
  /** Subscriptions still awaiting payment confirmation. */
  pending: number
}

export type CourseMetrics = {
  /** null when the subscriptions list could not be loaded. */
  counts: Record<number, CourseCounts> | null
  /** null when the top-courses API could not be loaded. */
  earnings: Record<number, number> | null
}

type SubscriptionLike = {
  student_id: number
  payment_status: string
  course: { id: number }
}

export function deriveCourseCounts(
  subscriptions: readonly SubscriptionLike[]
): Record<number, CourseCounts> {
  const students = new Map<number, Set<number>>()
  const pending = new Map<number, number>()
  for (const subscription of subscriptions) {
    const courseId = subscription.course.id
    const status = subscription.payment_status.toLowerCase()
    if (status === "completed") {
      const set = students.get(courseId) ?? new Set<number>()
      set.add(subscription.student_id)
      students.set(courseId, set)
    } else if (status === "pending") {
      pending.set(courseId, (pending.get(courseId) ?? 0) + 1)
    }
  }
  const result: Record<number, CourseCounts> = {}
  for (const courseId of new Set([...students.keys(), ...pending.keys()])) {
    result[courseId] = {
      students: students.get(courseId)?.size ?? 0,
      pending: pending.get(courseId) ?? 0,
    }
  }
  return result
}

/** Maps course id → earning_amount exactly as the API returned it. */
export function earningsByCourse(
  topCourses: readonly { id: number; earning_amount: number }[]
): Record<number, number> {
  return Object.fromEntries(topCourses.map((course) => [course.id, course.earning_amount]))
}

export const COURSE_STATUSES = ["all", "published", "draft", "archived"] as const
export type CourseStatusFilter = (typeof COURSE_STATUSES)[number]

export const COURSE_SORT_KEYS = ["created", "title", "students", "earnings"] as const
export type CourseSortKey = (typeof COURSE_SORT_KEYS)[number]

export const COURSE_VIEWS = ["grid", "table"] as const
export type CourseView = (typeof COURSE_VIEWS)[number]

export const DEFAULT_COURSE_SORT: SortState<CourseSortKey> = { key: "created", direction: "desc" }

export type CourseQueryState = {
  q: string
  status: CourseStatusFilter
  sort: SortState<CourseSortKey>
  view: CourseView
}

export const EMPTY_COURSE_QUERY: CourseQueryState = {
  q: "",
  status: "all",
  sort: DEFAULT_COURSE_SORT,
  view: "grid",
}

type RawParams = Record<string, string | string[] | undefined>

export function parseCourseQuery(params: RawParams | URLSearchParams): CourseQueryState {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }
  const status = get("status")
  const sortKey = get("sort")
  const view = get("view")
  const sort: SortState<CourseSortKey> =
    sortKey && (COURSE_SORT_KEYS as readonly string[]).includes(sortKey)
      ? {
          key: sortKey as CourseSortKey,
          direction: get("dir") === "asc" ? "asc" : get("dir") === "desc" ? "desc" : defaultDirection(sortKey as CourseSortKey),
        }
      : DEFAULT_COURSE_SORT
  return {
    q: get("q")?.slice(0, 200) ?? "",
    status: status && (COURSE_STATUSES as readonly string[]).includes(status) ? (status as CourseStatusFilter) : "all",
    sort,
    view: view && (COURSE_VIEWS as readonly string[]).includes(view) ? (view as CourseView) : "grid",
  }
}

export function serializeCourseQuery(state: CourseQueryState): string {
  const params = new URLSearchParams()
  if (state.q.trim()) params.set("q", state.q.trim())
  if (state.status !== "all") params.set("status", state.status)
  if (state.sort.key !== DEFAULT_COURSE_SORT.key || state.sort.direction !== DEFAULT_COURSE_SORT.direction) {
    params.set("sort", state.sort.key)
    params.set("dir", state.sort.direction)
  }
  if (state.view !== "grid") params.set("view", state.view)
  return params.toString()
}

/** Title reads A→Z; every numeric column reads biggest/newest first. */
export function defaultDirection(key: CourseSortKey): "asc" | "desc" {
  return key === "title" ? "asc" : "desc"
}

export function courseStatus(course: Pick<CourseOut, "is_archived" | "is_published">) {
  if (course.is_archived) return "archived" as const
  return course.is_published ? ("published" as const) : ("draft" as const)
}

export function courseSortAccessors(
  metrics: CourseMetrics
): Record<CourseSortKey, (course: CourseOut) => string | number | null> {
  return {
    created: (course) => new Date(course.created_at).getTime(),
    title: (course) => course.title,
    students: (course) => (metrics.counts ? (metrics.counts[course.id]?.students ?? 0) : null),
    earnings: (course) => (metrics.earnings ? (metrics.earnings[course.id] ?? null) : null),
  }
}
