import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/ar.json"
import type { CourseTestRow, TestStats } from "../types"

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("../client", () => ({ COURSE_TESTS_CHANGED: "x", isCourseTestsDemo: false, getCourseTestsClient: vi.fn() }))

const { TestsTable } = await import("../components/tests-table")
const { TestsKpis } = await import("../components/tests-kpis")

function row(overrides: Partial<CourseTestRow>): CourseTestRow {
  return {
    id: 1,
    course_id: 3,
    lesson_id: null,
    position: 0,
    placement: "standalone_item",
    parent_item_id: null,
    title: "اختبار",
    description: null,
    time_limit_minutes: 15,
    max_attempts: 3,
    grading_policy: "highest",
    cooldown_minutes: 0,
    pass_percent: 60,
    complete_item_on_pass_only: true,
    notify_teacher_on_attempts_exhausted: false,
    prerequisite: "none",
    prerequisite_ids: [],
    opens_at: null,
    closes_at: null,
    shuffle_questions: false,
    allow_back_navigation: true,
    random_pool_size: null,
    show_correct_answers: "after_submit",
    show_score_immediately: true,
    status: "published",
    question_count: 10,
    total_points: 20,
    attempt_count: 48,
    submission_count: 48,
    pending_grading_count: 12,
    updated_at: "2026-09-20T00:00:00Z",
    placement_label: "الدرس الأول",
    average_percent: 72,
    ...overrides,
  }
}

const wrap = (ui: React.ReactNode) => render(<NextIntlClientProvider locale="ar" messages={messages}>{ui}</NextIntlClientProvider>)

describe("TestsTable", () => {
  it("renders statuses, placement, and links pending grading to the filtered queue", () => {
    wrap(
      <TestsTable
        rows={[
          row({ id: 1, title: "اختبار الدرس الأول" }),
          row({ id: 2, title: "الاختبار النهائي", opens_at: "2999-09-28T10:00:00Z", submission_count: 0, pending_grading_count: 0 }),
          row({ id: 3, title: "اختبار الوحدة الثالثة", status: "draft", placement_label: null, time_limit_minutes: null, max_attempts: null, submission_count: 0, pending_grading_count: 0 }),
          row({ id: 4, title: "مؤرشف", status: "archived" }),
        ]}
      />,
    )
    const table = screen.getByRole("table")
    expect(within(table).getByText("منشور")).toBeTruthy()
    expect(within(table).getByText("مجدول")).toBeTruthy()
    expect(within(table).getByText("مسودة")).toBeTruthy()
    // Archived rows are hidden until requested.
    expect(within(table).queryByText("مؤرشف")).toBeNull()
    expect(screen.getByRole("button", { name: /عرض اختبار مؤرشف/ })).toBeTruthy()

    const pending = within(table).getByRole("link", { name: "12 بانتظار التصحيح" })
    expect(pending.getAttribute("href")).toBe("/grading?testId=1")
    expect(within(table).getByText("غير مضاف للدورة")).toBeTruthy()
    expect(within(table).getByText("بلا وقت")).toBeTruthy()
    expect(within(table).getByText("غير محدودة")).toBeTruthy()
    expect(within(table).getByRole("link", { name: "متابعة التحرير" }).getAttribute("href")).toBe("/courses/3/tests/3")
    expect(within(table).getByRole("button", { name: "خيارات الاختبار: اختبار الدرس الأول" })).toBeTruthy()
  })
})

describe("TestsKpis", () => {
  it("shows the API's numbers and a dash when there is no data", () => {
    const stats: TestStats = { published_tests: 3, draft_tests: 1, scheduled_tests: 0, pending_grading: 12, average_score: null, pass_rate: 81 }
    wrap(<TestsKpis stats={stats} animate={false} />)
    expect(screen.getByText("+ مسودة واحدة")).toBeTruthy()
    expect(screen.getByText("81%")).toBeTruthy()
    expect(screen.getByText("—")).toBeTruthy()
    expect(screen.getByText("لا توجد محاولات مصحّحة بعد")).toBeTruthy()
  })
})
