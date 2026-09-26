import type { SortState } from "@/lib/sort"
import type { TeacherSubscription } from "@/features/students/schema"

/**
 * Pure view-model helpers for the students roster: row mapping, URL state,
 * filtering and access windows. Nothing here touches money beyond passing
 * `totalPaid` through exactly as the API returned it.
 */

export interface StudentSubscriptionRow {
  enrollmentId: number
  studentId: number
  name: string
  initials: string
  email: string
  phone: string | null
  studentPhone: string | null
  whatsapp: string | null
  parentPhone: string | null
  courseId: number
  course: string
  purchasedAt: string
  expiresAt: string
  totalPaid: number
  currency: string
  status: string
  gradeId: number | null
  grade: string | null
  streamId: number | null
  stream: string | null
}

export const STUDENT_SORT_KEYS = [
  "name",
  "course",
  "purchased",
  "expires",
  "amount",
  "status",
] as const
export type StudentSortKey = (typeof STUDENT_SORT_KEYS)[number]

export const ACCESS_FILTERS = ["active", "expiring", "expired"] as const
export type AccessFilter = (typeof ACCESS_FILTERS)[number]

/** Days before expiry when access counts as "ending soon". A view window, not a policy. */
export const EXPIRING_WINDOW_DAYS = 14

export const DEFAULT_STUDENT_SORT: SortState<StudentSortKey> = {
  key: "purchased",
  direction: "desc",
}

export type StudentQueryState = {
  q: string
  status: string | null
  course: number | null
  grade: number | null
  stream: number | null
  access: AccessFilter | null
  sort: SortState<StudentSortKey>
  page: number
  student: number | null
}

export const EMPTY_STUDENT_QUERY: StudentQueryState = {
  q: "",
  status: null,
  course: null,
  grade: null,
  stream: null,
  access: null,
  sort: DEFAULT_STUDENT_SORT,
  page: 1,
  student: null,
}

type RawParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function positiveInt(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

/** URL → roster state. Unknown or malformed values fall back to defaults. */
export function parseStudentQuery(params: RawParams | URLSearchParams): StudentQueryState {
  const get = (key: string) =>
    params instanceof URLSearchParams
      ? (params.get(key) ?? undefined)
      : first(params[key])

  const status = get("status")?.trim().toLowerCase()
  const access = get("access")
  const sortKey = get("sort")
  const dir = get("dir")
  const sort: SortState<StudentSortKey> =
    sortKey && (STUDENT_SORT_KEYS as readonly string[]).includes(sortKey)
      ? {
          key: sortKey as StudentSortKey,
          direction: dir === "asc" ? "asc" : "desc",
        }
      : DEFAULT_STUDENT_SORT

  return {
    q: get("q")?.slice(0, 200) ?? "",
    status: status && /^[a-z_]{1,40}$/.test(status) && status !== "all" ? status : null,
    course: positiveInt(get("course")),
    grade: positiveInt(get("grade")),
    stream: positiveInt(get("stream")),
    access: access && (ACCESS_FILTERS as readonly string[]).includes(access) ? (access as AccessFilter) : null,
    sort,
    page: positiveInt(get("page")) ?? 1,
    student: positiveInt(get("student")),
  }
}

/** Roster state → query string (without "?"). Defaults are omitted to keep links short. */
export function serializeStudentQuery(state: StudentQueryState): string {
  const params = new URLSearchParams()
  if (state.q.trim()) params.set("q", state.q.trim())
  if (state.status) params.set("status", state.status)
  if (state.course) params.set("course", String(state.course))
  if (state.grade) params.set("grade", String(state.grade))
  if (state.stream) params.set("stream", String(state.stream))
  if (state.access) params.set("access", state.access)
  const isDefaultSort =
    state.sort.key === DEFAULT_STUDENT_SORT.key &&
    state.sort.direction === DEFAULT_STUDENT_SORT.direction
  if (!isDefaultSort) {
    params.set("sort", state.sort.key)
    params.set("dir", state.sort.direction)
  }
  if (state.page > 1) params.set("page", String(state.page))
  if (state.student) params.set("student", String(state.student))
  return params.toString()
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "ST"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function toStudentRow(subscription: TeacherSubscription): StudentSubscriptionRow {
  const whatsapp = subscription.whatsapp_number ?? null
  const studentPhone = subscription.student_phone ?? null
  const parentPhone = subscription.parent_phone ?? null
  return {
    enrollmentId: subscription.enrollment_id,
    studentId: subscription.student_id,
    name: subscription.student_name,
    initials: getInitials(subscription.student_name),
    email: subscription.student_email,
    phone: whatsapp ?? studentPhone ?? parentPhone,
    studentPhone,
    whatsapp,
    parentPhone,
    courseId: subscription.course.id,
    course: subscription.course.title,
    purchasedAt: subscription.purchased_at,
    expiresAt: subscription.expires_at,
    totalPaid: subscription.total_paid,
    currency: subscription.currency || "EGP",
    status: subscription.payment_status.toLowerCase(),
    gradeId: subscription.grade_id ?? null,
    grade: subscription.grade_name ?? null,
    streamId: subscription.stream_id ?? null,
    stream: subscription.stream_name ?? null,
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

export type AccessState =
  | { kind: "none" }
  | { kind: "expired" }
  | { kind: "active"; daysLeft: number; expiring: boolean }

/** Access window from the dates the API sent: only completed payments grant access. */
export function getAccessState(
  row: Pick<StudentSubscriptionRow, "status" | "expiresAt">,
  now: number
): AccessState {
  if (row.status !== "completed") return { kind: "none" }
  const expires = new Date(row.expiresAt).getTime()
  if (Number.isNaN(expires) || expires <= now) return { kind: "expired" }
  const daysLeft = Math.ceil((expires - now) / DAY_MS)
  return { kind: "active", daysLeft, expiring: daysLeft <= EXPIRING_WINDOW_DAYS }
}

export function matchesAccess(
  row: StudentSubscriptionRow,
  access: AccessFilter,
  now: number
): boolean {
  const state = getAccessState(row, now)
  switch (access) {
    case "active":
      return state.kind === "active"
    case "expiring":
      return state.kind === "active" && state.expiring
    case "expired":
      return state.kind === "expired"
  }
}

export function filterStudentRows(
  rows: StudentSubscriptionRow[],
  state: Pick<StudentQueryState, "q" | "status" | "course" | "grade" | "stream" | "access">,
  now: number
): StudentSubscriptionRow[] {
  const term = state.q.trim().toLowerCase()
  return rows.filter((row) => {
    if (
      term &&
      !(
        row.name.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.course.toLowerCase().includes(term) ||
        row.phone?.toLowerCase().includes(term)
      )
    ) {
      return false
    }
    if (state.status && row.status !== state.status) return false
    if (state.course && row.courseId !== state.course) return false
    if (state.grade && row.gradeId !== state.grade) return false
    if (state.stream && row.streamId !== state.stream) return false
    if (state.access && !matchesAccess(row, state.access, now)) return false
    return true
  })
}

export const studentSortAccessors: Record<
  StudentSortKey,
  (row: StudentSubscriptionRow) => string | number | null
> = {
  name: (row) => row.name,
  course: (row) => row.course,
  purchased: (row) => new Date(row.purchasedAt).getTime(),
  expires: (row) => new Date(row.expiresAt).getTime(),
  amount: (row) => row.totalPaid,
  status: (row) => row.status,
}

export type RosterStats = {
  totalStudents: number
  completed: number
  pending: number
  expiring: number
}

/** Headline counts. Counting rows only — no amounts are combined. */
export function getRosterStats(rows: StudentSubscriptionRow[], now: number): RosterStats {
  return {
    totalStudents: new Set(rows.map((row) => row.studentId)).size,
    completed: rows.filter((row) => row.status === "completed").length,
    pending: rows.filter((row) => row.status === "pending").length,
    expiring: rows.filter((row) => matchesAccess(row, "expiring", now)).length,
  }
}
