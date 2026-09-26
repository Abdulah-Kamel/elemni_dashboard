import type { TeacherAnalytics } from "@/features/analytics/schema"
import { overviewLinks } from "./links"

export type KpiId = "earnings" | "subscriptions" | "courses"

export type Kpi =
  | { id: "earnings"; kind: "money"; value: number; revenue: number; href: string }
  | { id: "subscriptions"; kind: "count"; value: number; href: string }
  | {
      id: "courses"
      kind: "count"
      value: number
      drafts: number | null
      archived: number
      href: string
    }

/**
 * The headline tiles. Every value is an API field passed through untouched;
 * each tile links to the list behind the number.
 */
export function buildKpis(
  summary: TeacherAnalytics,
  drafts: number | null
): Kpi[] {
  return [
    {
      id: "earnings",
      kind: "money",
      value: summary.total_earnings,
      revenue: summary.total_revenue,
      href: overviewLinks.completedSubscriptions,
    },
    {
      id: "subscriptions",
      kind: "count",
      value: summary.subscription_count,
      href: overviewLinks.completedSubscriptions,
    },
    {
      id: "courses",
      kind: "count",
      value: summary.active_courses_count,
      drafts,
      archived: summary.archived_courses_count,
      href: overviewLinks.publishedCourses,
    },
  ]
}
