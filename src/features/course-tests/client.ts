import type {
  ActionResult,
  BankQuestion,
  CourseItemOption,
  CourseTest,
  CourseTestRow,
  ExcelImportPreview,
  GradeResult,
  GradingQueueItem,
  QuestionInput,
  TestQuestion,
  TestSettings,
  TestStats,
} from "./types"

/**
 * Every course-test read/write the teacher dashboard makes. The real
 * implementation is the server actions in ./actions.ts (API via apiFetch);
 * the demo implementation (./demo-client.ts) is development-only.
 */
export interface CourseTestsClient {
  listTests(courseId: number): Promise<ActionResult<CourseTestRow[]>>
  getStats(courseId: number): Promise<ActionResult<TestStats>>
  getTest(testId: number): Promise<ActionResult<CourseTest>>
  listCourseItems(courseId: number): Promise<ActionResult<CourseItemOption[]>>
  createTest(courseId: number, input?: { title?: string }): Promise<ActionResult<{ id: number }>>
  duplicateTest(testId: number, targetCourseId?: number): Promise<ActionResult<{ id: number }>>
  updateSettings(testId: number, settings: Partial<TestSettings>): Promise<ActionResult<CourseTest>>
  publishTest(testId: number): Promise<ActionResult<CourseTest>>
  unpublishTest(testId: number): Promise<ActionResult<CourseTest>>
  archiveTest(testId: number): Promise<ActionResult<null>>
  deleteTest(testId: number): Promise<ActionResult<null>>
  addQuestion(testId: number, input: QuestionInput): Promise<ActionResult<TestQuestion>>
  updateQuestion(questionId: number, input: QuestionInput): Promise<ActionResult<TestQuestion>>
  deleteQuestion(questionId: number): Promise<ActionResult<null>>
  reorderQuestions(testId: number, questionIds: number[]): Promise<ActionResult<null>>
  listBank(query?: { courseId?: number; search?: string }): Promise<ActionResult<BankQuestion[]>>
  importFromBank(testId: number, bankQuestionIds: number[]): Promise<ActionResult<TestQuestion[]>>
  drawFromBank(testId: number, count: number, courseId?: number): Promise<ActionResult<TestQuestion[]>>
  previewExcel(testId: number, file: File): Promise<ActionResult<ExcelImportPreview>>
  importExcel(testId: number, rows: QuestionInput[]): Promise<ActionResult<TestQuestion[]>>
  getGradingQueue(query?: { testId?: number; status?: "pending" | "graded" }): Promise<ActionResult<GradingQueueItem[]>>
  getPendingGradingCount(): Promise<ActionResult<number>>
  gradeAnswer(answerId: number, points: number, feedback: string): Promise<ActionResult<GradeResult>>
}

/** Local demo data is opt-in for development only; production always uses the API. */
export const isCourseTestsDemo = process.env.NEXT_PUBLIC_COURSE_TESTS_DEMO === "1"

let client: Promise<CourseTestsClient> | null = null

export function getCourseTestsClient(): Promise<CourseTestsClient> {
  client ??= isCourseTestsDemo
    ? import("./demo-client").then((module) => module.demoCourseTestsClient)
    : // actions.ts is "use server": it exports one async function per method above.
      import("./actions").then((module): CourseTestsClient => module)
  return client
}

export const COURSE_TESTS_CHANGED = "elemni:course-tests-changed"
