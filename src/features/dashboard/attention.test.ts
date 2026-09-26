import { describe, expect, it } from "vitest"
import type { CourseOut } from "@/features/shell/schema"
import type { TeacherSubscription } from "@/features/students/schema"
import { EXPIRING_WINDOW_DAYS } from "@/features/students/roster-model"
import { countDrafts, deriveAttention } from "./attention"

const now = new Date("2026-09-26T12:00:00Z")
const day = 24 * 60 * 60 * 1000
const inDays = (n: number) => new Date(now.getTime() + n * day).toISOString()

function course(id: number, flags: { published: boolean; archived?: boolean }): CourseOut {
  return {
    id,
    title: `Course ${id}`,
    description: null,
    price: "100.00",
    is_published: flags.published,
    is_archived: flags.archived ?? false,
    use_chapters: false,
    total_duration_minutes: null,
    subject_id: null,
    teacher_profile_id: 1,
    grade_id: 1,
    stream_id: 1,
    created_by_id: null,
    created_at: "2026-01-01T00:00:00Z",
    bunny_collection_id: null,
  }
}

function sub(id: number, courseId: number, status: string, expiresAt: string): TeacherSubscription {
  return {
    enrollment_id: id,
    purchased_at: "2026-09-01T00:00:00Z",
    expires_at: expiresAt,
    payment_status: status,
    total_paid: 120,
    currency: "EGP",
    student_id: id,
    student_name: `Student ${id}`,
    student_email: `s${id}@example.com`,
    course: { id: courseId, title: `Course ${courseId}`, price: 100 },
  }
}

const courses = [
  course(1, { published: true }),
  course(2, { published: true }),
  course(3, { published: false }),
  course(4, { published: false }),
  course(5, { published: false, archived: true }),
  course(6, { published: true, archived: true }),
]

const subscriptions = [
  sub(1, 1, "completed", inDays(3)), // running, ends inside the roster's window
  sub(2, 1, "COMPLETED", inDays(40)), // running, status casing from API
  sub(3, 2, "completed", inDays(-1)), // already expired
  sub(4, 2, "pending", inDays(30)),
  sub(5, 1, "failed", inDays(2)), // not running: ignored for expiry
  sub(6, 1, "completed", inDays(EXPIRING_WINDOW_DAYS)), // exactly on the window edge
]

const byId = (entries: ReturnType<typeof deriveAttention>) =>
  Object.fromEntries((entries ?? []).map((e) => [e.id, e]))

describe("deriveAttention", () => {
  it("counts each work item from API fields and links to its filtered list", () => {
    const result = byId(deriveAttention({ courses, subscriptions, now }))

    expect(result.expiring_soon).toMatchObject({
      count: 2,
      href: "/students?access=expiring",
      tone: "warning",
    })
    expect(result.pending_payments).toMatchObject({ count: 1, href: "/students?status=pending" })
    expect(result.draft_courses).toMatchObject({ count: 2, href: "/courses?status=draft" })
    // Course 2 only has an expired and a pending subscription.
    expect(result.published_without_students).toMatchObject({
      count: 1,
      href: "/courses?status=published",
    })
  })

  it("keeps zero-count rows so the list decides what to hide", () => {
    const result = deriveAttention({ courses: [], subscriptions: [], now })
    expect(result?.map((e) => e.count)).toEqual([0, 0, 0, 0])
  })

  it("drops rows whose input failed to load", () => {
    expect(deriveAttention({ courses, subscriptions: null, now })?.map((e) => e.id)).toEqual([
      "draft_courses",
    ])
    expect(deriveAttention({ courses: null, subscriptions, now })?.map((e) => e.id)).toEqual([
      "expiring_soon",
      "pending_payments",
    ])
  })

  it("is unavailable when nothing loaded", () => {
    expect(deriveAttention({ courses: null, subscriptions: null, now })).toBeNull()
  })
})

describe("countDrafts", () => {
  it("counts unpublished, unarchived courses", () => {
    expect(countDrafts(courses)).toBe(2)
    expect(countDrafts(null)).toBeNull()
  })
})
