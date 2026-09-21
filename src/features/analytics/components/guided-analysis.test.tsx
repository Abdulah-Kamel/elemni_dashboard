import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"
import { GuidedAnalysisSection } from "./guided-analysis"

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () =>
    (key: string, values?: Record<string, string | number>) => {
      const messages: Record<string, string> = {
        title: "Performance analysis",
        subtitle: "What the selected period shows.",
        "business.title": "Business performance",
        "business.teacher_share": "Teacher share",
        "business.teacher_share_description":
          "Teacher earnings account for {value} of gross revenue.",
        "business.earnings_per_subscription": "Earnings per subscription",
        "business.earnings_per_subscription_description":
          "Average teacher earnings were {value} per subscription.",
        "portfolio.title": "Portfolio health",
        "portfolio.active_ratio": "Active-course share",
        "portfolio.active_ratio_description":
          "{active} of {total} courses are active ({value}).",
        "portfolio.top_course_concentration": "Leading-course share",
        "portfolio.top_course_concentration_description":
          "The leading course accounts for {value} of teacher earnings.",
        unavailable: "Not enough data",
      }
      return (messages[key] ?? key).replace(
        /\{(\w+)\}/g,
        (_, name: string) => String(values?.[name] ?? `{${name}}`)
      )
    },
}))

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

const topCourses: TopEarningCourse[] = [
  {
    id: 1,
    title: "Physics",
    name: "Physics",
    price: 100,
    earning_amount: 450,
    total_earnings: 450,
    student_subscription_count: 4,
    subscribed_students_count: 4,
  },
  {
    id: 2,
    title: "Math",
    name: "Math",
    price: 80,
    earning_amount: 300,
    total_earnings: 300,
    student_subscription_count: 3,
    subscribed_students_count: 3,
  },
]

describe("GuidedAnalysisSection", () => {
  it("renders two-card analysis with formatted metrics", () => {
    render(
      <GuidedAnalysisSection
        summary={summary}
        topCourses={topCourses}
        currency="USD"
      />
    )

    expect(
      screen.getByRole("heading", { name: "Performance analysis" })
    ).toBeDefined()
    expect(
      screen.getByRole("heading", { name: "Business performance" })
    ).toBeDefined()
    expect(
      screen.getByRole("heading", { name: "Portfolio health" })
    ).toBeDefined()
    expect(screen.getAllByText("75%")).toHaveLength(2)
    expect(screen.getAllByText(/100\.00/).length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText(/3 of 4 courses are active \(75%\)/)
    ).toBeDefined()
    expect(
      screen.getByText(/leading course accounts for 50%/i)
    ).toBeDefined()
  })

  it("shows unavailable when totals are zero and no courses", () => {
    const emptySummary: TeacherAnalytics = {
      ...summary,
      total_earnings: 0,
      total_revenue: 0,
      subscription_count: 0,
      active_courses_count: 0,
      archived_courses_count: 0,
      archieved_courses_count: 0,
    }

    render(
      <GuidedAnalysisSection
        summary={emptySummary}
        topCourses={[]}
        currency="USD"
      />
    )

    expect(screen.getAllByText("Not enough data")).toHaveLength(4)
    const text = document.body.textContent ?? ""
    expect(text).not.toMatch(/NaN/)
    expect(text).not.toMatch(/Infinity/)
  })
})
