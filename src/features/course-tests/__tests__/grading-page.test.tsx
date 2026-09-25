import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/ar.json"
import type { GradeResult, GradingQueueItem } from "../types"

const gradeAnswer = vi.fn<(answerId: number, points: number, feedback: string) => Promise<{ ok: true; data: GradeResult }>>()

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

let queue: GradingQueueItem[] = []

vi.mock("../client", () => ({
  COURSE_TESTS_CHANGED: "elemni:course-tests-changed",
  isCourseTestsDemo: false,
  getCourseTestsClient: async () => ({
    getGradingQueue: async () => ({ ok: true, data: queue }),
    gradeAnswer: (answerId: number, points: number, feedback: string) => gradeAnswer(answerId, points, feedback),
  }),
}))

const { GradingWorkspace, nextPendingId } = await import("../components/grading-page")

function essay(answer_id: number, student: { id: number; name: string }, submitted_at: string, overrides: Partial<GradingQueueItem> = {}): GradingQueueItem {
  return {
    answer_id,
    attempt_id: answer_id * 10,
    attempt_number: 1,
    status: "pending",
    submitted_at,
    student: { ...student, initials: student.name.slice(0, 2) },
    test: { id: 7, title: "اختبار الدرس الأول", course_id: 3, pass_percent: 80 },
    question: {
      id: 1,
      position: 7,
      type: "essay",
      text: "اشرح الفرق بين list و tuple.",
      code_snippet: null,
      image_url: null,
      points: 4,
      options: [],
      answer_key: { model_answer: "list قابلة للتعديل", rubric: [{ criterion: "قابلية التعديل", points: 2 }] },
      explanation: null,
      shuffle_options: false,
      topic_ref: null,
      bank_question_id: null,
    },
    response: "القائمة قابلة للتعديل بينما الصف ثابت",
    feedback: null,
    points_awarded: null,
    score_rest: 13,
    max_score: 20,
    remaining_essays_in_attempt: 0,
    ...overrides,
  }
}

function renderWorkspace(initial: GradingQueueItem[]) {
  queue = initial
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      <GradingWorkspace initial={initial} />
    </NextIntlClientProvider>,
  )
}

beforeEach(() => {
  gradeAnswer.mockReset()
  try {
    window.localStorage?.removeItem("elemni:grading-anonymous")
  } catch {
    // no storage in this environment
  }
})

describe("GradingWorkspace", () => {
  const items = [
    essay(1, { id: 10, name: "سارة أحمد" }, "2026-09-20T10:00:00Z"),
    essay(2, { id: 20, name: "عمر خالد" }, "2026-09-21T10:00:00Z"),
    essay(3, { id: 30, name: "مريم حسن" }, "2026-09-19T10:00:00Z", { status: "graded", points_awarded: 3 }),
  ]

  it("hides names and initials in anonymous mode with stable pseudonyms", () => {
    renderWorkspace(items)
    const queueList = screen.getByRole("complementary")
    expect(within(queueList).queryByText("سارة أحمد")).toBeNull()
    expect(within(queueList).queryByText("سأ")).toBeNull()
    // Mariam submitted first (graded), so Sara is student 2 and Omar student 3.
    expect(within(queueList).getByText("طالب 2")).toBeTruthy()
    expect(within(queueList).getByText("طالب 3")).toBeTruthy()

    fireEvent.click(within(queueList).getByRole("checkbox"))
    expect(within(queueList).getByText("سارة أحمد")).toBeTruthy()
    // Restore the (module-level / persisted) preference for the next tests.
    fireEvent.click(within(queueList).getByRole("checkbox"))
    expect(within(queueList).queryByText("سارة أحمد")).toBeNull()
  })

  it("shows filter counts and graded items under the graded filter", () => {
    renderWorkspace(items)
    const pending = screen.getByRole("button", { name: /بانتظار التصحيح · 2/ })
    expect(pending.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: /مصحّح · 1/ }))
    expect(screen.getByRole("button", { name: /مصحّح · 1/ }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByText(/مصحّح · 3 \/ 4/)).toBeTruthy()
  })

  it("previews the total with the test's pass percent and keyboard-operable chips", () => {
    renderWorkspace(items)
    const chip3 = screen.getByRole("button", { name: "3 من 4" })
    fireEvent.click(chip3)
    expect(chip3.getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByText("16 / 20 · 80%")).toBeTruthy()
    expect(screen.getAllByText("ناجح").length).toBeGreaterThan(0)

    fireEvent.keyDown(chip3, { key: "Home" })
    expect(screen.getByRole("button", { name: "0 من 4" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByText("13 / 20 · 65%")).toBeTruthy()
    expect(screen.getAllByText("لم يجتز").length).toBeGreaterThan(0)
  })

  it("requires a score, then saves and moves to the next pending answer", async () => {
    gradeAnswer.mockResolvedValue({ ok: true, data: { attempt_id: 10, attempt_status: "graded", score_total: 17, max_score: 20, percent: 85, passed: true } })
    renderWorkspace(items)
    fireEvent.click(screen.getByRole("button", { name: /حفظ والانتقال للتالي/ }))
    expect(screen.getByRole("alert").textContent).toContain("اختر الدرجة أولاً")
    expect(gradeAnswer).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "4 من 4" }))
    fireEvent.change(screen.getByLabelText(/ملاحظة للطالب/), { target: { value: "ممتاز" } })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /حفظ والانتقال للتالي/ }))
    })
    expect(gradeAnswer).toHaveBeenCalledWith(1, 4, "ممتاز")
    await waitFor(() => {
      const current = screen.getByRole("complementary").querySelector('[aria-current="true"]')
      expect(current?.textContent).toContain("طالب 3")
    })
  })

  it("skips to the next pending answer without saving", () => {
    renderWorkspace(items)
    fireEvent.click(screen.getByRole("button", { name: "تخطٍّ" }))
    expect(gradeAnswer).not.toHaveBeenCalled()
    const current = screen.getByRole("complementary").querySelector('[aria-current="true"]')
    expect(current?.textContent).toContain("طالب 3")
  })
})

describe("nextPendingId", () => {
  it("wraps around and skips graded items", () => {
    const list = [essay(1, { id: 1, name: "a" }, "2026-01-01T00:00:00Z"), essay(2, { id: 2, name: "b" }, "2026-01-02T00:00:00Z", { status: "graded" }), essay(3, { id: 3, name: "c" }, "2026-01-03T00:00:00Z")]
    expect(nextPendingId(list, 1)).toBe(3)
    expect(nextPendingId(list, 3)).toBe(1)
    expect(nextPendingId([list[0]], 1)).toBeNull()
  })
})
