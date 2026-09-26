import { describe, expect, it } from "vitest"
import { sortRows } from "@/lib/sort"
import {
  EMPTY_COURSE_QUERY,
  courseSortAccessors,
  deriveCourseCounts,
  earningsByCourse,
  parseCourseQuery,
  serializeCourseQuery,
} from "../components/course-overview/course-overview-model"
import { mockCourses } from "./mocks"

describe("deriveCourseCounts", () => {
  it("counts distinct paying students and pending rows per course", () => {
    const counts = deriveCourseCounts([
      { student_id: 1, payment_status: "completed", course: { id: 1 } },
      { student_id: 1, payment_status: "completed", course: { id: 1 } }, // renewal, same student
      { student_id: 2, payment_status: "COMPLETED", course: { id: 1 } },
      { student_id: 3, payment_status: "pending", course: { id: 1 } },
      { student_id: 3, payment_status: "pending", course: { id: 2 } },
      { student_id: 4, payment_status: "failed", course: { id: 2 } },
    ])
    expect(counts).toEqual({
      1: { students: 2, pending: 1 },
      2: { students: 0, pending: 1 },
    })
  })

  it("returns an empty map for no subscriptions", () => {
    expect(deriveCourseCounts([])).toEqual({})
  })
})

describe("earningsByCourse", () => {
  it("copies API earnings verbatim by course id", () => {
    expect(
      earningsByCourse([
        { id: 1, earning_amount: 120.5 },
        { id: 3, earning_amount: 0 },
      ])
    ).toEqual({ 1: 120.5, 3: 0 })
  })
})

describe("course list URL state", () => {
  it("parses supported params and ignores junk", () => {
    expect(parseCourseQuery({ q: "جبر", status: "draft", sort: "students", view: "table" })).toEqual({
      q: "جبر",
      status: "draft",
      sort: { key: "students", direction: "desc" },
      view: "table",
    })
    expect(parseCourseQuery({ status: "deleted", sort: "price", view: "list" })).toEqual(EMPTY_COURSE_QUERY)
    expect(parseCourseQuery({ sort: "title" }).sort).toEqual({ key: "title", direction: "asc" })
    expect(parseCourseQuery({ sort: "title", dir: "desc" }).sort).toEqual({ key: "title", direction: "desc" })
  })

  it("serializes without defaults and round-trips", () => {
    expect(serializeCourseQuery(EMPTY_COURSE_QUERY)).toBe("")
    const state = parseCourseQuery({ status: "published", sort: "earnings", view: "table" })
    const query = serializeCourseQuery(state)
    expect(query).toBe("status=published&sort=earnings&dir=desc&view=table")
    expect(parseCourseQuery(new URLSearchParams(query))).toEqual(state)
  })
})

describe("course sorting", () => {
  const metrics = {
    counts: { 1: { students: 2, pending: 0 }, 3: { students: 7, pending: 0 } },
    earnings: { 1: 300 },
  }

  it("sorts newest first by created date", () => {
    const sorted = sortRows(mockCourses, { key: "created", direction: "desc" }, courseSortAccessors(metrics), "ar")
    expect(sorted.map((course) => course.id)).toEqual([3, 2, 1])
  })

  it("sorts by title", () => {
    const sorted = sortRows(mockCourses, { key: "title", direction: "asc" }, courseSortAccessors(metrics), "en")
    expect(sorted[0].title).toBe("Archived Chemistry")
  })

  it("sorts by student count, missing courses count as zero", () => {
    const sorted = sortRows(mockCourses, { key: "students", direction: "desc" }, courseSortAccessors(metrics), "ar")
    expect(sorted.map((course) => course.id)).toEqual([3, 1, 2])
  })

  it("keeps courses without an earnings figure at the end", () => {
    const sorted = sortRows(mockCourses, { key: "earnings", direction: "desc" }, courseSortAccessors(metrics), "ar")
    expect(sorted[0].id).toBe(1)
  })
})
