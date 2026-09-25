import type { ReactNode } from "react"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it, vi } from "vitest"
import messages from "@/i18n/messages/ar.json"
import { makeFakeClient, makeQuestion, makeTest } from "./fake-client"
import { TestBuilder } from "../../test-builder"
import { TestPreview } from "../../test-preview"

let fake = makeFakeClient(makeTest())
const push = vi.fn()

vi.mock("../../../client", () => ({
  COURSE_TESTS_CHANGED: "elemni:course-tests-changed",
  getCourseTestsClient: () => Promise.resolve(fake),
}))

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push }),
}))

vi.mock("@formkit/auto-animate/react", () => ({
  useAutoAnimate: () => [() => undefined, () => undefined],
}))

function renderWithIntl(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="ar" messages={messages} timeZone="Africa/Cairo">
      <div dir="rtl">{ui}</div>
    </NextIntlClientProvider>,
  )
}

async function renderBuilder(test = makeTest({ questions: [makeQuestion(1)] })) {
  fake = makeFakeClient(test)
  renderWithIntl(<TestBuilder courseId={12} testId={test.id} />)
  await screen.findByRole("tab", { name: /الأسئلة/ })
}

describe("TestBuilder", () => {
  it("renders the stepper, header and the selected question", async () => {
    await renderBuilder()
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([expect.stringContaining("الأسئلة"), expect.stringContaining("الإعدادات والإتاحة"), expect.stringContaining("المراجعة والنشر")])
    expect(screen.getByDisplayValue("اختبار الدرس الأول")).toBeTruthy()
    expect(screen.getByText("حُفظ تلقائياً")).toBeTruthy()
    expect(screen.getByDisplayValue("سؤال 1")).toBeTruthy()
    expect(screen.getByRole("button", { name: "نشر الاختبار" })).not.toHaveProperty("disabled", true)
  })

  it("adds a true/false question with صح / خطأ and requires a correct answer before publishing", async () => {
    await renderBuilder()
    const panel = screen.getByRole("region", { name: "أضف سؤالاً" })
    fireEvent.click(within(panel).getByRole("button", { name: "صح / خطأ" }))
    expect(await screen.findByDisplayValue("صح")).toBeTruthy()
    expect(screen.getByDisplayValue("خطأ")).toBeTruthy()
    expect(screen.getByRole("button", { name: "نشر الاختبار" })).toHaveProperty("disabled", true)
    // the list row shows the first blocking error in place of the text
    const list = screen.getByRole("complementary", { name: "قائمة الأسئلة" })
    expect(within(list).getByText("اكتب نص السؤال")).toBeTruthy()

    fireEvent.change(screen.getByLabelText("نص السؤال"), { target: { value: "القوائم قابلة للتعديل" } })
    fireEvent.click(screen.getByLabelText("الخيار أ صحيح"))
    await waitFor(() => expect(screen.getByRole("button", { name: "نشر الاختبار" })).toHaveProperty("disabled", false))
  })

  it("makes ordering questions authorable, including keyboard move buttons", async () => {
    await renderBuilder()
    fireEvent.click(within(screen.getByRole("region", { name: "أضف سؤالاً" })).getByRole("button", { name: "ترتيب" }))
    fireEvent.change(await screen.findByLabelText("نص السؤال"), { target: { value: "رتّب الخطوات" } })
    const items = ["فتح المحرر", "كتابة الكود", "التشغيل"]
    items.forEach((text, index) => fireEvent.change(screen.getByLabelText(`العنصر رقم ${index + 1}`), { target: { value: text } }))
    fireEvent.click(screen.getByRole("button", { name: "نقل العنصر 1 لأسفل" }))
    expect((screen.getByLabelText("العنصر رقم 1") as HTMLInputElement).value).toBe("كتابة الكود")
    expect((screen.getByLabelText("العنصر رقم 2") as HTMLInputElement).value).toBe("فتح المحرر")
    await waitFor(() => expect(screen.getByRole("button", { name: "نشر الاختبار" })).toHaveProperty("disabled", false))
  })

  it("adds and removes options with a minimum of two", async () => {
    await renderBuilder()
    fireEvent.click(screen.getByRole("button", { name: "إضافة خيار" }))
    expect(screen.getByLabelText("الخيار ج")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "حذف الخيار ج" }))
    expect(screen.queryByLabelText("الخيار ج")).toBeNull()
    expect(screen.getByRole("button", { name: "حذف الخيار أ" })).toHaveProperty("disabled", true)
  })

  it("confirms before deleting a question", async () => {
    await renderBuilder(makeTest({ questions: [makeQuestion(1), makeQuestion(2)] }))
    fireEvent.click(screen.getByRole("button", { name: "حذف السؤال" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("حذف السؤال 1؟")).toBeTruthy()
    expect(fake.deleteQuestion).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole("button", { name: "حذف السؤال" }))
    await waitFor(() => expect(fake.deleteQuestion).toHaveBeenCalledWith(1))
    await waitFor(() => expect(screen.getByDisplayValue("سؤال 2")).toBeTruthy())
  })

  it("warns persistently when editing a published test with attempts", async () => {
    await renderBuilder(makeTest({ status: "published", attempt_count: 3, questions: [makeQuestion(1)] }))
    expect(screen.getByRole("note").textContent).toContain("التعديلات تنطبق على المحاولات الجديدة فقط")
    expect(screen.queryByRole("button", { name: "نشر الاختبار" })).toBeNull()
  })

  it("shows the live student preview on the settings step", async () => {
    await renderBuilder()
    fireEvent.click(screen.getByRole("tab", { name: /الإعدادات والإتاحة/ }))
    const preview = await screen.findByRole("complementary", { name: "ما سيراه الطالب" })
    expect(within(preview).getByText("لم يبدأ")).toBeTruthy()
    expect(within(preview).getByText("15 د")).toBeTruthy()
    fireEvent.click(screen.getByRole("switch", { name: "تحديد مدة للاختبار" }))
    expect(within(preview).getByText("بدون حد")).toBeTruthy()
    expect(screen.getByText("2 من 2 درجة")).toBeTruthy()
  })
})

describe("TestPreview", () => {
  it("runs the student flow and scores it locally", async () => {
    fake = makeFakeClient(makeTest({ time_limit_minutes: 10, questions: [makeQuestion(1), makeQuestion(2, { type: "essay", options: [], answer_key: {}, points: 4 })] }))
    renderWithIntl(<TestPreview courseId={12} testId={5} />)
    fireEvent.click(await screen.findByRole("button", { name: "ابدأ الاختبار" }))
    expect(screen.getByRole("timer").getAttribute("aria-live")).toBe("off")
    fireEvent.click(screen.getByLabelText(/tuple/))
    fireEvent.click(screen.getByRole("button", { name: "التالي" }))
    fireEvent.change(screen.getByLabelText("إجابتك"), { target: { value: "القائمة قابلة للتعديل" } })
    fireEvent.click(screen.getAllByRole("button", { name: "مراجعة وتسليم" })[0])
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "تسليم الإجابات" }))
    expect(await screen.findByText("تم التسليم — النتيجة قيد التصحيح")).toBeTruthy()
    expect(screen.getByText("2/2")).toBeTruthy()
  })
})
