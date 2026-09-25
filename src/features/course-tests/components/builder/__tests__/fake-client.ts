import { vi } from "vitest"
import type { CourseTestsClient } from "../../../client"
import type { ActionResult, CourseTest, TestQuestion } from "../../../types"

const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data })

export function makeTest(patch: Partial<CourseTest> = {}): CourseTest {
  return {
    id: 5,
    course_id: 12,
    lesson_id: 100,
    position: 0,
    placement: "standalone_item",
    parent_item_id: null,
    title: "اختبار الدرس الأول",
    description: null,
    time_limit_minutes: 15,
    max_attempts: 3,
    grading_policy: "highest",
    cooldown_minutes: 0,
    pass_percent: 60,
    complete_item_on_pass_only: true,
    notify_teacher_on_attempts_exhausted: true,
    prerequisite: "none",
    prerequisite_ids: [],
    opens_at: null,
    closes_at: null,
    shuffle_questions: false,
    allow_back_navigation: true,
    random_pool_size: null,
    show_correct_answers: "after_submit",
    show_score_immediately: true,
    status: "draft",
    question_count: 0,
    total_points: 0,
    questions: [],
    attempt_count: 0,
    submission_count: 0,
    pending_grading_count: 0,
    updated_at: "2026-09-20T10:00:00.000Z",
    ...patch,
  }
}

export function makeQuestion(id: number, patch: Partial<TestQuestion> = {}): TestQuestion {
  return {
    id,
    position: id,
    type: "single",
    text: `سؤال ${id}`,
    code_snippet: null,
    image_url: null,
    points: 2,
    options: [
      { id: "a", text: "list" },
      { id: "b", text: "tuple" },
    ],
    answer_key: { option_id: "b" },
    explanation: null,
    shuffle_options: false,
    topic_ref: null,
    bank_question_id: null,
    ...patch,
  }
}

/** Tiny in-memory stand-in for the course-tests client (tests only). */
export function makeFakeClient(initial: CourseTest) {
  let test = structuredClone(initial)
  let nextId = 1000
  const client = {
    getTest: vi.fn(async () => ok(structuredClone(test))),
    listCourseItems: vi.fn(async () => ok([{ id: 100, title: "item video", kind: "video" as const, lesson_id: 100, lesson_title: "lesson 1" }])),
    listTests: vi.fn(async () => ok([])),
    updateSettings: vi.fn(async (_id: number, patch: Partial<CourseTest>) => {
      test = { ...test, ...patch }
      return ok(structuredClone(test))
    }),
    addQuestion: vi.fn(async (_testId: number, input: Omit<TestQuestion, "id" | "bank_question_id">) => {
      const question: TestQuestion = { ...input, id: nextId++, position: test.questions.length, bank_question_id: null }
      test.questions.push(question)
      return ok(structuredClone(question))
    }),
    updateQuestion: vi.fn(async (questionId: number, input: Omit<TestQuestion, "id" | "bank_question_id">) => {
      const question = test.questions.find((item) => item.id === questionId)!
      Object.assign(question, input)
      return ok(structuredClone(question))
    }),
    deleteQuestion: vi.fn(async (questionId: number) => {
      test.questions = test.questions.filter((item) => item.id !== questionId)
      return ok(null)
    }),
    reorderQuestions: vi.fn(async () => ok(null)),
    publishTest: vi.fn(async (): Promise<ActionResult<CourseTest>> => {
      test = { ...test, status: "published" }
      return ok(structuredClone(test))
    }),
    listBank: vi.fn(async () => ok([])),
    importFromBank: vi.fn(async () => ok([])),
    previewExcel: vi.fn(async () => ok({ valid: [], errors: [] })),
    importExcel: vi.fn(async () => ok([])),
  }
  return client as unknown as typeof client & CourseTestsClient
}
