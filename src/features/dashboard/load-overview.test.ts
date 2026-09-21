import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TeacherAnalytics, TopEarningCourse } from "@/features/analytics/schema"
import type { TeacherSubscription } from "@/features/students/schema"

const mocks = vi.hoisted(() => ({
  getTeacherAnalytics: vi.fn(),
  listTopEarningCourses: vi.fn(),
  listRecentTeacherSubscriptions: vi.fn(),
}))

vi.mock("@/features/analytics/queries", () => ({
  getTeacherAnalytics: mocks.getTeacherAnalytics,
  listTopEarningCourses: mocks.listTopEarningCourses,
}))
vi.mock("@/features/students/queries", () => ({
  listRecentTeacherSubscriptions: mocks.listRecentTeacherSubscriptions,
}))

import { loadDashboardOverview } from "./load-overview"

const summary: TeacherAnalytics = {
  total_earnings: 900,
  sum_earning_money: 900,
  total_revenue: 1200,
  student_subscription_count: 9,
  subscription_count: 9,
  active_courses_count: 3,
  archived_courses_count: 1,
  archieved_courses_count: 1,
  start_date: null,
  end_date: null,
}
const topCourses: TopEarningCourse[] = [{
  id: 8,
  title: "Physics",
  name: "Physics",
  price: 250,
  earning_amount: 450,
  total_earnings: 450,
  student_subscription_count: 4,
  subscribed_students_count: 4,
}]
const subscriptions: TeacherSubscription[] = [{
  enrollment_id: 17,
  purchased_at: "2026-09-21T10:00:00Z",
  expires_at: "2027-09-21T10:00:00Z",
  payment_status: "completed",
  total_paid: 250,
  currency: "EGP",
  student_id: 4,
  student_name: "Mona Ali",
  student_email: "mona@example.com",
  course: { id: 8, title: "Physics", price: 250 },
}]

describe("loadDashboardOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns analytics and recent subscriptions together", async () => {
    mocks.getTeacherAnalytics.mockResolvedValue(summary)
    mocks.listTopEarningCourses.mockResolvedValue(topCourses)
    mocks.listRecentTeacherSubscriptions.mockResolvedValue(subscriptions)

    await expect(loadDashboardOverview({ start: "2026-09-01" })).resolves.toEqual({
      kind: "ready",
      summary,
      topCourses,
      recentSubscriptions: subscriptions,
    })
  })

  it("keeps analytics ready when recent subscriptions fail upstream", async () => {
    mocks.getTeacherAnalytics.mockResolvedValue(summary)
    mocks.listTopEarningCourses.mockResolvedValue(topCourses)
    mocks.listRecentTeacherSubscriptions.mockRejectedValue({ type: "Upstream", status: 503 })

    await expect(loadDashboardOverview({})).resolves.toEqual({
      kind: "ready",
      summary,
      topCourses,
      recentSubscriptions: null,
    })
  })

  it("returns unauthorized when recent subscriptions are unauthorized", async () => {
    mocks.getTeacherAnalytics.mockResolvedValue(summary)
    mocks.listTopEarningCourses.mockResolvedValue(topCourses)
    mocks.listRecentTeacherSubscriptions.mockRejectedValue({ type: "Unauthorized", status: 401 })

    await expect(loadDashboardOverview({})).resolves.toEqual({ kind: "unauthorized" })
  })

  it("preserves the existing analytics error result", async () => {
    mocks.getTeacherAnalytics.mockRejectedValue({
      type: "Upstream",
      status: 503,
      message: "Unavailable",
    })
    mocks.listTopEarningCourses.mockResolvedValue(topCourses)
    mocks.listRecentTeacherSubscriptions.mockResolvedValue(subscriptions)

    await expect(loadDashboardOverview({})).resolves.toEqual({
      kind: "error",
      error: {
        type: "Upstream",
        status: 503,
        message: "Unavailable",
      },
    })
  })

  it("returns unauthorized when analytics rejects Upstream and subscriptions rejects Unauthorized", async () => {
    mocks.getTeacherAnalytics.mockRejectedValue({
      type: "Upstream",
      status: 503,
      message: "Service unavailable",
    })
    mocks.listTopEarningCourses.mockRejectedValue({
      type: "Upstream",
      status: 503,
      message: "Service unavailable",
    })
    mocks.listRecentTeacherSubscriptions.mockRejectedValue({
      type: "Unauthorized",
      status: 401,
    })

    await expect(loadDashboardOverview({})).resolves.toEqual({
      kind: "unauthorized",
    })
  })
})
