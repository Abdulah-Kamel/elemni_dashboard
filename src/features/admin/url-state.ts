// URL <-> filter state for the admin lists. Pure functions so the overview
// tiles, the attention panel and the tables all agree on the same query
// string, and so parsing is unit-testable without a router.
import type { SortState } from "@/lib/sort"

export type ParamReader = { get(name: string): string | null }

export const PAYMENT_STATUSES = [
  "completed",
  "pending",
  "failed",
  "cancelled",
  "refunded",
  "duplicate_paid",
  "all",
] as const
export type PaymentStatusFilter = (typeof PAYMENT_STATUSES)[number]

const ACTIVE_STATUSES = ["all", "active", "inactive"] as const
export type ActiveStatusFilter = (typeof ACTIVE_STATUSES)[number]

const LIBRARY_STATUSES = ["all", "ready", "missing"] as const
export type LibraryFilter = (typeof LIBRARY_STATUSES)[number]

export const TEACHER_SORT_KEYS = ["name", "subjects", "status", "library", "joined"] as const
export type TeacherSortKey = (typeof TEACHER_SORT_KEYS)[number]

export const STUDENT_SORT_KEYS = ["name", "level", "status", "joined"] as const
export type StudentSortKey = (typeof STUDENT_SORT_KEYS)[number]

export const SUBSCRIPTION_SORT_KEYS = ["student", "course", "status", "amount", "date"] as const
export type SubscriptionSortKey = (typeof SUBSCRIPTION_SORT_KEYS)[number]

export type TeacherFilters = {
  q: string
  status: ActiveStatusFilter
  library: LibraryFilter
  sort: SortState<TeacherSortKey> | null
  page: number
  view: number | null
}

export type StudentFilters = {
  q: string
  status: ActiveStatusFilter
  grade: number | null
  stream: number | null
  sort: SortState<StudentSortKey> | null
  page: number
  view: number | null
}

export type SubscriptionFilters = {
  q: string
  status: PaymentStatusFilter
  sort: SortState<SubscriptionSortKey> | null
  page: number
  view: number | null
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function positiveInt(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function text(value: string | null): string {
  return (value ?? "").trim().slice(0, 200)
}

export function parseSort<K extends string>(params: ParamReader, keys: readonly K[]): SortState<K> | null {
  const key = params.get("sort")
  if (key === null || !(keys as readonly string[]).includes(key)) return null
  return { key: key as K, direction: params.get("dir") === "desc" ? "desc" : "asc" }
}

function writeCommon(
  out: URLSearchParams,
  { q, sort, page, view }: { q: string; sort: SortState<string> | null; page: number; view: number | null },
) {
  if (q) out.set("q", q)
  if (sort) {
    out.set("sort", sort.key)
    if (sort.direction === "desc") out.set("dir", "desc")
  }
  if (page > 1) out.set("page", String(page))
  if (view !== null) out.set("view", String(view))
}

export function parseTeacherFilters(params: ParamReader): TeacherFilters {
  return {
    q: text(params.get("q")),
    status: oneOf(params.get("status"), ACTIVE_STATUSES, "all"),
    library: oneOf(params.get("library"), LIBRARY_STATUSES, "all"),
    sort: parseSort(params, TEACHER_SORT_KEYS),
    page: positiveInt(params.get("page")) ?? 1,
    view: positiveInt(params.get("view")),
  }
}

export function serializeTeacherFilters(filters: TeacherFilters): URLSearchParams {
  const out = new URLSearchParams()
  if (filters.status !== "all") out.set("status", filters.status)
  if (filters.library !== "all") out.set("library", filters.library)
  writeCommon(out, filters)
  return out
}

export function parseStudentFilters(params: ParamReader): StudentFilters {
  return {
    q: text(params.get("q")),
    status: oneOf(params.get("status"), ACTIVE_STATUSES, "all"),
    grade: positiveInt(params.get("grade")),
    stream: positiveInt(params.get("stream")),
    sort: parseSort(params, STUDENT_SORT_KEYS),
    page: positiveInt(params.get("page")) ?? 1,
    view: positiveInt(params.get("view")),
  }
}

export function serializeStudentFilters(filters: StudentFilters): URLSearchParams {
  const out = new URLSearchParams()
  if (filters.status !== "all") out.set("status", filters.status)
  if (filters.grade !== null) out.set("grade", String(filters.grade))
  if (filters.stream !== null) out.set("stream", String(filters.stream))
  writeCommon(out, filters)
  return out
}

/** The subscriptions API defaults to completed payments, so the list does too. */
export function parseSubscriptionFilters(params: ParamReader): SubscriptionFilters {
  return {
    q: text(params.get("q")),
    status: oneOf(params.get("status"), PAYMENT_STATUSES, "completed"),
    sort: parseSort(params, SUBSCRIPTION_SORT_KEYS),
    page: positiveInt(params.get("page")) ?? 1,
    view: positiveInt(params.get("view")),
  }
}

export function serializeSubscriptionFilters(filters: SubscriptionFilters): URLSearchParams {
  const out = new URLSearchParams()
  if (filters.status !== "completed") out.set("status", filters.status)
  writeCommon(out, filters)
  return out
}

/** Build an in-app href such as `/admin/teachers?status=inactive`. */
export function listHref(path: string, params: URLSearchParams): string {
  const query = params.toString()
  return query ? `${path}?${query}` : path
}
