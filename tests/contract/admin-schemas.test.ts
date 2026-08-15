import { describe, expect, it } from "vitest"
import {
  adminCreateTeacherResponseSchema,
  adminOverviewSchema,
  adminStudentCreateResponseSchema,
  adminTeacherPageSchema,
  adminStudentPageSchema,
  subjectCreateSchema,
} from "@/features/admin/schema"

describe("admin API contracts", () => {
  it("requires invitation delivery status in account creation responses", () => {
    const teacher = adminCreateTeacherResponseSchema.safeParse({
      id: 4,
      email: "teacher@test.com",
      name: "Teacher",
      slug: "teacher",
      phone_number: null,
      teacher_profile_id: 9,
      bandwidth_cost_per_gb: "3.00",
      storage_cost_per_gb_monthly: "3.00",
      subject_ids: [],
      grade_ids: [],
      video_library_created: true,
      invitation_sent: true,
    })
    const student = adminStudentCreateResponseSchema.safeParse({
      id: 5,
      email: "student@test.com",
      name: "Student",
      phone_number: null,
      is_active: true,
      created_at: "2026-08-15T12:00:00Z",
      invitation_sent: true,
    })

    expect(teacher.success).toBe(true)
    expect(student.success).toBe(true)
    expect(adminCreateTeacherResponseSchema.safeParse({}).success).toBe(false)
  })

  it("parses the paginated teacher response without dropping operational fields", () => {
    const parsed = adminTeacherPageSchema.parse({
      total: 1,
      skip: 0,
      limit: 10,
      items: [{
        id: 4,
        email: "teacher@test.com",
        name: "Teacher",
        slug: "teacher",
        phone_number: "+20100",
        teacher_profile_id: 9,
        location: null,
        experience: null,
        description: null,
        img: null,
        bandwidth_cost_per_gb: "3.00",
        storage_cost_per_gb_monthly: "3.00",
        is_active: true,
        created_at: "2026-08-15T12:00:00Z",
        subjects: [],
        grades: [],
        has_library: false,
      }],
    })

    expect(parsed.items[0].phone_number).toBe("+20100")
    expect(parsed.items[0].is_active).toBe(true)
  })

  it("parses overview totals and decimal revenue", () => {
    expect(adminOverviewSchema.parse({
      teacher_total: 8,
      active_teacher_total: 6,
      student_total: 100,
      active_student_total: 90,
      completed_subscription_total: 70,
      collected_revenue: "1500.50",
      currency: "EGP",
    }).collected_revenue).toBe("1500.50")
  })

  it("requires subject grade and stream associations", () => {
    expect(subjectCreateSchema.safeParse({ name: "Math", slug: "math" }).success).toBe(false)
    expect(subjectCreateSchema.safeParse({
      name: "Math",
      slug: "math",
      grade_ids: [10],
      stream_ids: [2],
    }).success).toBe(true)
  })

  it("parses paginated students", () => {
    const parsed = adminStudentPageSchema.parse({ total: 0, skip: 0, limit: 20, items: [] })
    expect(parsed.total).toBe(0)
  })
})
