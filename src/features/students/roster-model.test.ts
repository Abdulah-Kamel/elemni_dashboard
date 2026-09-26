import { describe, expect, it } from "vitest"
import { sortRows } from "@/lib/sort"
import {
  DEFAULT_STUDENT_SORT,
  EMPTY_STUDENT_QUERY,
  filterStudentRows,
  getAccessState,
  getRosterStats,
  parseStudentQuery,
  serializeStudentQuery,
  studentSortAccessors,
  toStudentRow,
} from "./roster-model"
import type { TeacherSubscription } from "./schema"

const NOW = Date.parse("2026-09-26T12:00:00Z")
const DAY = 24 * 60 * 60 * 1000

function subscription(overrides: Partial<TeacherSubscription> = {}): TeacherSubscription {
  return {
    enrollment_id: 1,
    purchased_at: "2026-09-01T10:00:00Z",
    expires_at: new Date(NOW + 100 * DAY).toISOString(),
    payment_status: "completed",
    total_paid: 250,
    currency: "EGP",
    student_id: 4,
    student_name: "Mona Ali",
    student_email: "mona@example.com",
    student_phone: "0100",
    whatsapp_number: null,
    parent_phone: null,
    grade_id: 3,
    grade_name: "Grade 12",
    stream_id: 1,
    stream_name: "Science",
    course: { id: 8, title: "Physics", price: 250 },
    ...overrides,
  }
}

describe("parseStudentQuery", () => {
  it("reads every supported param", () => {
    expect(
      parseStudentQuery({
        q: "mona",
        status: "pending",
        course: "8",
        grade: "3",
        stream: "1",
        access: "expiring",
        sort: "amount",
        dir: "asc",
        page: "2",
        student: "4",
      })
    ).toEqual({
      q: "mona",
      status: "pending",
      course: 8,
      grade: 3,
      stream: 1,
      access: "expiring",
      sort: { key: "amount", direction: "asc" },
      page: 2,
      student: 4,
    })
  })

  it("falls back to defaults for malformed values", () => {
    expect(
      parseStudentQuery({
        status: "all",
        course: "abc",
        grade: "-1",
        access: "forever",
        sort: "password",
        page: "0",
        student: "1.5",
      })
    ).toEqual(EMPTY_STUDENT_QUERY)
  })

  it("accepts URLSearchParams and array values", () => {
    expect(parseStudentQuery(new URLSearchParams("status=PENDING")).status).toBe("pending")
    expect(parseStudentQuery({ course: ["5", "6"] }).course).toBe(5)
  })

  it("round-trips through serialize and omits defaults", () => {
    expect(serializeStudentQuery(EMPTY_STUDENT_QUERY)).toBe("")
    const state = parseStudentQuery({ status: "pending", course: "8", sort: "name", dir: "asc", page: "3" })
    expect(serializeStudentQuery(state)).toBe("status=pending&course=8&sort=name&dir=asc&page=3")
    expect(parseStudentQuery(new URLSearchParams(serializeStudentQuery(state)))).toEqual(state)
    expect(serializeStudentQuery({ ...EMPTY_STUDENT_QUERY, sort: DEFAULT_STUDENT_SORT })).toBe("")
  })
})

describe("access windows", () => {
  it("only grants access to completed, unexpired subscriptions", () => {
    const active = toStudentRow(subscription())
    expect(getAccessState(active, NOW)).toEqual({ kind: "active", daysLeft: 100, expiring: false })
    expect(getAccessState({ ...active, status: "pending" }, NOW)).toEqual({ kind: "none" })
    expect(getAccessState({ ...active, expiresAt: new Date(NOW - DAY).toISOString() }, NOW)).toEqual({
      kind: "expired",
    })
    expect(getAccessState({ ...active, expiresAt: new Date(NOW + 3 * DAY).toISOString() }, NOW)).toEqual({
      kind: "active",
      daysLeft: 3,
      expiring: true,
    })
  })
})

describe("filterStudentRows", () => {
  const rows = [
    toStudentRow(subscription()),
    toStudentRow(
      subscription({
        enrollment_id: 2,
        student_id: 5,
        student_name: "Omar",
        student_email: "omar@example.com",
        payment_status: "PENDING",
        course: { id: 9, title: "Chemistry", price: 100 },
        grade_id: 4,
        stream_id: 2,
      })
    ),
    toStudentRow(
      subscription({
        enrollment_id: 3,
        student_id: 6,
        student_name: "Sara",
        expires_at: new Date(NOW + 5 * DAY).toISOString(),
      })
    ),
  ]

  it("filters by status, course id, grade id, stream id and search", () => {
    const base = EMPTY_STUDENT_QUERY
    expect(filterStudentRows(rows, { ...base, status: "pending" }, NOW).map((r) => r.enrollmentId)).toEqual([2])
    expect(filterStudentRows(rows, { ...base, course: 8 }, NOW).map((r) => r.enrollmentId)).toEqual([1, 3])
    expect(filterStudentRows(rows, { ...base, grade: 4 }, NOW).map((r) => r.enrollmentId)).toEqual([2])
    expect(filterStudentRows(rows, { ...base, stream: 2 }, NOW).map((r) => r.enrollmentId)).toEqual([2])
    expect(filterStudentRows(rows, { ...base, q: "OMAR@" }, NOW).map((r) => r.enrollmentId)).toEqual([2])
  })

  it("filters by access window", () => {
    const base = EMPTY_STUDENT_QUERY
    expect(filterStudentRows(rows, { ...base, access: "expiring" }, NOW).map((r) => r.enrollmentId)).toEqual([3])
    expect(filterStudentRows(rows, { ...base, access: "active" }, NOW).map((r) => r.enrollmentId)).toEqual([1, 3])
  })

  it("counts rows for the headline tiles without touching amounts", () => {
    expect(getRosterStats(rows, NOW)).toEqual({ totalStudents: 3, completed: 2, pending: 1, expiring: 1 })
  })

  it("sorts with the shared accessors", () => {
    const byName = sortRows(rows, { key: "name", direction: "asc" }, studentSortAccessors, "en")
    expect(byName.map((r) => r.name)).toEqual(["Mona Ali", "Omar", "Sara"])
    const byExpiry = sortRows(rows, { key: "expires", direction: "asc" }, studentSortAccessors, "en")
    expect(byExpiry[0].enrollmentId).toBe(3)
  })
})
