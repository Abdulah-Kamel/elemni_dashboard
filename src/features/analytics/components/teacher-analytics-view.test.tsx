import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TeacherAnalyticsView } from "./teacher-analytics-view"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"

vi.mock("next-intl", () => {
  const analysisMessages: Record<string, string> = {
    title: "Performance analysis",
    subtitle: "What the selected period shows about your teaching business.",
    "business.title": "Business performance",
    "business.teacher_share": "Teacher share",
    "business.teacher_share_description":
      "Teacher earnings account for {value} of gross revenue in this period.",
    "business.earnings_per_subscription": "Earnings per subscription",
    "business.earnings_per_subscription_description":
      "Average teacher earnings were {value} per completed subscription.",
    "portfolio.title": "Portfolio health",
    "portfolio.active_ratio": "Active-course share",
    "portfolio.active_ratio_description":
      "{active} of {total} courses are active ({value}).",
    "portfolio.top_course_concentration": "Leading-course share",
    "portfolio.top_course_concentration_description":
      "The leading course accounts for {value} of teacher earnings in this period.",
    unavailable: "Not enough data",
  }
  const analyticsMessages: Record<string, string> = {
    title: "Dashboard",
    subtitle: "Overview",
    "filters.range": "Date Range",
    "filters.all_time": "All Time",
    "filters.choose": "Choose date range",
    "filters.dialog_title": "Select Range",
    "filters.dialog_description": "Pick a start and end date",
    "filters.apply": "Apply",
    "filters.reset": "Reset",
    "filters.cancel": "Cancel",
    "stats.teacher_earnings": "Teacher Earnings",
    "stats.total_revenue": "Total Revenue",
    "stats.subscriptions": "Subscriptions",
    "stats.active_courses": "Active Courses",
    "stats.archived_courses": "Archived Courses",
    "top_courses.title": "Top Earning Courses",
    "top_courses.subtitle": "Ranked by teacher earnings",
    "top_courses.headers.course": "Course",
    "top_courses.headers.price": "Price",
    "top_courses.headers.earnings": "Earnings",
    "top_courses.headers.subscriptions": "Subscriptions",
    "top_courses.empty": "No courses",
  }

  const nsMap: Record<string, Record<string, string>> = {
    analytics: analyticsMessages,
    "analytics.analysis": analysisMessages,
  }

  return {
    useTranslations: vi.fn().mockImplementation((namespace?: string) => {
      const messages = nsMap[namespace ?? "analytics"] ?? analyticsMessages
      return (
        key: string,
        values?: Record<string, string | number>
      ) => {
        const template = messages[key] ?? key
        return template.replace(
          /\{(\w+)\}/g,
          (_, name: string) => String(values?.[name] ?? `{${name}}`)
        )
      }
    }),
    useLocale: vi.fn().mockReturnValue("ar"),
  }
})

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("@/features/analytics/actions", () => ({
  getTeacherAnalyticsAction: vi.fn(),
}))

const mockDateRangeFilterForm = vi.fn(
  ({
    onApply,
    onReset,
    labels,
  }: {
    onApply?: (range: { start?: string; end?: string }) => void
    onReset?: () => void
    labels: { choose: string; apply: string; reset: string }
  }) => (
    <div data-testid="date-range-filter">
      <button type="button" data-testid="mock-apply" disabled={!onApply}>
        {labels.apply}
      </button>
      <button type="button" data-testid="mock-reset" disabled={!onReset}>
        {labels.reset}
      </button>
    </div>
  )
)

vi.mock(
  "@/features/analytics/components/date-range-filter-form",
  () => ({
    DateRangeFilterForm: (props: Parameters<typeof mockDateRangeFilterForm>[0]) =>
      mockDateRangeFilterForm(props),
  })
)

const summary: TeacherAnalytics = {
  total_earnings: 1000.0,
  sum_earning_money: 1000.0,
  total_revenue: 1200.0,
  student_subscription_count: 10,
  subscription_count: 10,
  active_courses_count: 5,
  archived_courses_count: 2,
  archieved_courses_count: 2,
  start_date: null,
  end_date: null,
}

const topCourses: TopEarningCourse[] = [
  {
    id: 1,
    title: "Advanced Math",
    name: "Advanced Math",
    price: 100.0,
    earning_amount: 500.0,
    total_earnings: 500.0,
    student_subscription_count: 5,
    subscribed_students_count: 5,
  },
]

const filteredSummary: TeacherAnalytics = {
  total_earnings: 360.0,
  sum_earning_money: 360.0,
  total_revenue: 600.0,
  student_subscription_count: 6,
  subscription_count: 6,
  active_courses_count: 3,
  archived_courses_count: 1,
  archieved_courses_count: 1,
  start_date: "2025-01-01T00:00:00Z",
  end_date: "2025-01-31T00:00:00Z",
}

const filteredTopCourses: TopEarningCourse[] = [
  {
    id: 2,
    title: "Physics 101",
    name: "Physics 101",
    price: 75.0,
    earning_amount: 180.0,
    total_earnings: 180.0,
    student_subscription_count: 3,
    subscribed_students_count: 3,
  },
]

const getTeacherAnalyticsAction = vi.mocked(
  await import("@/features/analytics/actions")
).getTeacherAnalyticsAction

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createQueryClient()
  return {
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
    queryClient,
  }
}

describe("TeacherAnalyticsView", () => {
  beforeEach(() => {
    getTeacherAnalyticsAction.mockReset()
    mockDateRangeFilterForm.mockClear()
  })

  it("renders initial data from server props", async () => {
    getTeacherAnalyticsAction.mockResolvedValue({
      summary,
      topCourses,
    })

    renderWithQuery(
      <TeacherAnalyticsView
        summary={summary}
        topCourses={topCourses}
        filters={{}}
      />
    )

    expect(screen.getByText("Dashboard")).toBeDefined()
    expect(screen.getByText("Advanced Math")).toBeDefined()
    expect(screen.getByText(/1,000\.00/)).toBeDefined()
    expect(
      screen.getByRole("heading", { name: "Performance analysis" })
    ).toBeDefined()
    expect(screen.getByText(/Teacher earnings account for/)).toBeDefined()
  })

  it("passes onApply and onReset callbacks so no Link/native fallback is used", async () => {
    getTeacherAnalyticsAction.mockResolvedValue({
      summary,
      topCourses,
    })

    renderWithQuery(
      <TeacherAnalyticsView
        summary={summary}
        topCourses={topCourses}
        filters={{}}
      />
    )

    const props = mockDateRangeFilterForm.mock.calls[0][0]
    expect(typeof props.onApply).toBe("function")
    expect(typeof props.onReset).toBe("function")

    expect(screen.getByTestId("mock-apply").getAttribute("disabled")).toBeNull()
    expect(screen.getByTestId("mock-reset").getAttribute("disabled")).toBeNull()
  })

  it("apply invokes action with selected dates and renders updated result", async () => {
    getTeacherAnalyticsAction
      .mockResolvedValueOnce({ summary, topCourses })
      .mockResolvedValueOnce({
        summary: filteredSummary,
        topCourses: filteredTopCourses,
      })

    renderWithQuery(
      <TeacherAnalyticsView
        summary={summary}
        topCourses={topCourses}
        filters={{}}
      />
    )

    expect(screen.getByText("Advanced Math")).toBeDefined()

    const props = mockDateRangeFilterForm.mock.calls[0][0]
    props.onApply!({ start: "2025-01-01", end: "2025-01-31" })

    await waitFor(() => {
      expect(getTeacherAnalyticsAction).toHaveBeenCalledWith({
        start: "2025-01-01",
        end: "2025-01-31",
      })
    })

    await waitFor(() => {
      expect(screen.getByText("Physics 101")).toBeDefined()
    })

    await waitFor(() => {
      expect(
        screen.getByText(/Teacher earnings account for 60/i)
      ).toBeDefined()
    })
    await waitFor(() => {
      expect(
        screen.getByText(/Average teacher earnings were/)
      ).toBeDefined()
    })
    await waitFor(() => {
      expect(
        screen.getByText(/leading course accounts for 50/i)
      ).toBeDefined()
    })
  })

  it("reset invokes action with cleared filters and renders unfiltered result", async () => {
    getTeacherAnalyticsAction
      .mockResolvedValueOnce({
        summary: filteredSummary,
        topCourses: filteredTopCourses,
      })
      .mockResolvedValueOnce({ summary, topCourses })

    renderWithQuery(
      <TeacherAnalyticsView
        summary={filteredSummary}
        topCourses={filteredTopCourses}
        filters={{ start: "2025-01-01", end: "2025-01-31" }}
      />
    )

    expect(screen.getByText("Physics 101")).toBeDefined()

    const props = mockDateRangeFilterForm.mock.calls[0][0]
    props.onReset!()

    await waitFor(() => {
      expect(getTeacherAnalyticsAction).toHaveBeenCalledWith({
        start: undefined,
        end: undefined,
      })
    })

    await waitFor(() => {
      expect(screen.getByText("Advanced Math")).toBeDefined()
    })
  })

  it("course titles are links to /courses/:id", async () => {
    getTeacherAnalyticsAction.mockResolvedValue({
      summary,
      topCourses,
    })

    renderWithQuery(
      <TeacherAnalyticsView
        summary={summary}
        topCourses={topCourses}
        filters={{}}
      />
    )

    const courseLink = screen.getByRole("link", {
      name: /Advanced Math/i,
    })
    expect(courseLink.getAttribute("href")).toBe("/courses/1")
  })

  it("centers RTL dashboard metric columns while preserving LTR numeric direction", async () => {
    getTeacherAnalyticsAction.mockResolvedValue({
      summary,
      topCourses,
    })

    renderWithQuery(
      <TeacherAnalyticsView
        summary={summary}
        topCourses={topCourses}
        filters={{}}
      />
    )

    const statValue = screen.getByText(/1,000\.00/).closest("p")
    expect(statValue?.getAttribute("dir")).toBe("ltr")
    expect(statValue?.className).toContain("text-center")

    for (const header of ["Price", "Earnings", "Subscriptions"]) {
      expect(
        screen.getByRole("columnheader", { name: header }).className
      ).toContain("text-center")
    }

    for (const cell of screen.getAllByRole("cell").filter((node) => {
      return node.getAttribute("dir") === "ltr"
    })) {
      expect(cell.className).toContain("text-center")
    }
  })

  it("renders zero totals with empty course list showing KPI headings, analysis, and empty messages", async () => {
    const zeroSummary: TeacherAnalytics = {
      total_earnings: 0,
      sum_earning_money: 0,
      total_revenue: 0,
      student_subscription_count: 0,
      subscription_count: 0,
      active_courses_count: 0,
      archived_courses_count: 0,
      archieved_courses_count: 0,
      start_date: null,
      end_date: null,
    }

    getTeacherAnalyticsAction.mockResolvedValue({
      summary: zeroSummary,
      topCourses: [],
    })

    renderWithQuery(
      <TeacherAnalyticsView
        summary={zeroSummary}
        topCourses={[]}
        filters={{}}
      />
    )

    expect(screen.getByText("Teacher Earnings")).toBeDefined()
    expect(screen.getByText("Total Revenue")).toBeDefined()
    expect(
      screen.getByRole("heading", { name: "Performance analysis" })
    ).toBeDefined()
    expect(screen.getAllByText("Not enough data").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("No courses")).toBeDefined()
  })
})
