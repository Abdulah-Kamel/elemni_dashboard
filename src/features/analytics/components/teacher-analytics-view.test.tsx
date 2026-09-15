import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TeacherAnalyticsView } from "./teacher-analytics-view"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn().mockResolvedValue("ar"),
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const messages: Record<string, string> = {
      "filters.range": "الفترة المحددة",
      "filters.all_time": "كل الوقت",
      "filters.choose": "اختر نطاق التاريخ",
      "filters.dialog_title": "اختر الفترة",
      "filters.dialog_description": "اختر الفترة",
      "filters.apply": "تطبيق",
      "filters.reset": "إعادة ضبط",
      "filters.cancel": "إلغاء",
      "stats.teacher_earnings": "أرباح المعلم",
      "stats.total_revenue": "إجمالي الإيرادات",
      "stats.subscriptions": "الاشتراكات المكتملة",
      "stats.active_courses": "الدورات النشطة",
      "stats.archived_courses": "الدورات المؤرشفة",
      "top_courses.title": "أعلى الدورات ربحًا",
      "top_courses.subtitle": "مرتبة حسب أرباح المعلم",
      "top_courses.headers.course": "الدورة",
      "top_courses.headers.price": "السعر",
      "top_courses.headers.earnings": "الأرباح",
      "top_courses.headers.subscriptions": "الاشتراكات",
      "top_courses.empty": "لا توجد دورات",
    }

    return messages[key] ?? key
  }),
}))

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

vi.mock("@/features/analytics/components/date-range-filter-form", () => ({
  DateRangeFilterForm: () => <div data-testid="date-range-filter" />,
}))

const summary: TeacherAnalytics = {
  total_earnings: 3134.03,
  sum_earning_money: 3134.03,
  total_revenue: 3281.75,
  student_subscription_count: 24,
  subscription_count: 24,
  active_courses_count: 8,
  archived_courses_count: 2,
  archieved_courses_count: 2,
  start_date: null,
  end_date: null,
}

const topCourses: TopEarningCourse[] = [
  {
    id: 1,
    title: "Advanced History",
    name: "Advanced History",
    price: 145.88,
    earning_amount: 696.55,
    total_earnings: 696.55,
    student_subscription_count: 5,
    subscribed_students_count: 5,
  },
]

describe("TeacherAnalyticsView", () => {
  it("centers RTL dashboard metric columns while preserving LTR numeric direction", async () => {
    render(
      await TeacherAnalyticsView({
        summary,
        topCourses,
        filters: {},
        currency: "EGP",
      })
    )

    const statValue = screen
      .getByText(/3,134\.03|٣٬١٣٤٫٠٣/)
      .closest("p")
    expect(statValue?.getAttribute("dir")).toBe("ltr")
    expect(statValue?.className).toContain("text-center")

    for (const header of ["السعر", "الأرباح", "الاشتراكات"]) {
      expect(screen.getByRole("columnheader", { name: header }).className).toContain(
        "text-center"
      )
    }

    for (const cell of screen.getAllByRole("cell").filter((node) => {
      return node.getAttribute("dir") === "ltr"
    })) {
      expect(cell.className).toContain("text-center")
    }
  })
})
