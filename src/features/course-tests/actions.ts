"use server"

// The real CourseTestsClient: one Server Action per method (see ./client.ts).
// Each action: session gate (UX only — the API authorizes) → shape check →
// API call parsed with zod → cache invalidation → typed, localized result.

import { updateTag } from "next/cache"
import { cookies } from "next/headers"
import { getTranslations } from "next-intl/server"
import { z } from "zod"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import { getSession } from "@/lib/auth/session"
import { redirectToAuth } from "@/lib/auth/redirect"
import { logger } from "@/lib/logger"
import {
  bankQuerySchema,
  bankQuestionSchema,
  courseItemOptionSchema,
  courseTestRowSchema,
  courseTestSchema,
  createdSchema,
  EXCEL_MAX_BYTES,
  excelImportPreviewSchema,
  gradeInputSchema,
  gradeResultSchema,
  gradingQueueItemSchema,
  pendingCountSchema,
  positiveId,
  publishErrorBodySchema,
  questionInputSchema,
  queueQuerySchema,
  settingsInputSchema,
  testQuestionSchema,
  testStatsSchema,
} from "./schema"
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

// ---------------------------------------------------------------------------
// Plumbing

const tags = {
  course: (courseId: number) => `course-tests:${courseId}`,
  test: (testId: number) => `course-test:${testId}`,
  grading: "grading-queue",
}

async function currentLocale(): Promise<"ar" | "en"> {
  try {
    return (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "ar"
  } catch {
    return "ar"
  }
}

async function errorsT() {
  return getTranslations({ locale: await currentLocale(), namespace: "courseTests.errors" })
}

class InvalidInput extends Error {}

function parseInput<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value)
  if (!result.success) throw new InvalidInput(result.error.message)
  return result.data
}

type ApiLikeError = { type: string; message: string; body?: unknown }

function isApiError(error: unknown): error is ApiLikeError {
  return !!error && typeof error === "object" && "type" in error && "message" in error && typeof (error as ApiLikeError).type === "string"
}

/**
 * Runs one action. `nextPath` is where to return after re-authenticating.
 * Business-rule messages (409/422) come from the API, already localized via
 * Accept-Language; everything else gets a localized, actionable message here.
 */
async function run<T>(name: string, nextPath: string, operation: () => Promise<T>): Promise<ActionResult<T>> {
  const locale = await currentLocale()
  const session = await getSession()
  if (!session?.refresh_token) return redirectToAuth(locale, nextPath)

  const start = performance.now()
  logger.action(name, {})
  try {
    const data = await operation()
    logger.actionDone(name, {}, Math.round(performance.now() - start))
    return { ok: true, data }
  } catch (error: unknown) {
    const elapsed = Math.round(performance.now() - start)
    const t = await errorsT()
    if (error instanceof InvalidInput) {
      logger.actionError(name, error, elapsed)
      return { ok: false, error: t("invalid_input") }
    }
    if (!isApiError(error)) {
      logger.actionError(name, error, elapsed)
      return { ok: false, error: t("upstream") }
    }
    logger.actionError(name, error, elapsed)
    switch (error.type) {
      case "Unauthorized":
        return redirectToAuth(locale, nextPath)
      case "Forbidden":
        return { ok: false, error: t("forbidden") }
      case "NotFound":
        return { ok: false, error: t("not_found") }
      case "RateLimited":
        return { ok: false, error: t("rate_limited") }
      case "Validation": {
        const issues = publishErrorBodySchema.safeParse(error.body)
        const message = error.message && !error.message.startsWith("HTTP ") ? error.message : t("validation")
        return issues.success ? { ok: false, error: message, issues: issues.data.issues } : { ok: false, error: message }
      }
      case "Conflict":
        return { ok: false, error: error.message && !error.message.startsWith("HTTP ") ? error.message : t("conflict") }
      default:
        return { ok: false, error: t("upstream") }
    }
  }
}

const json = (body: unknown) => JSON.stringify(body)
const courseTestsPath = (courseId: number) => `/courses/${courseId}/tests`
const testPath = (testId: number) => `/tests/${testId}`

function invalidateTest(test: { id: number; course_id: number }) {
  updateTag(tags.test(test.id))
  updateTag(tags.course(test.course_id))
}

// ---------------------------------------------------------------------------
// Reads

export async function listTests(courseId: number): Promise<ActionResult<CourseTestRow[]>> {
  return run("courseTests.listTests", courseTestsPath(courseId), async () => {
    const id = parseInput(positiveId, courseId)
    return apiFetch(endpoints.teacherTests.list(id), z.array(courseTestRowSchema), { tags: [tags.course(id)] })
  })
}

export async function getStats(courseId: number): Promise<ActionResult<TestStats>> {
  return run("courseTests.getStats", courseTestsPath(courseId), async () => {
    const id = parseInput(positiveId, courseId)
    return apiFetch(endpoints.teacherTests.stats(id), testStatsSchema, { tags: [tags.course(id)] })
  })
}

export async function getTest(testId: number): Promise<ActionResult<CourseTest>> {
  return run("courseTests.getTest", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    return apiFetch(endpoints.teacherTests.detail(id), courseTestSchema, { tags: [tags.test(id)] })
  })
}

export async function listCourseItems(courseId: number): Promise<ActionResult<CourseItemOption[]>> {
  return run("courseTests.listCourseItems", courseTestsPath(courseId), async () => {
    const id = parseInput(positiveId, courseId)
    return apiFetch(endpoints.teacherTests.courseItems(id), z.array(courseItemOptionSchema))
  })
}

export async function listBank(query?: { courseId?: number; search?: string }): Promise<ActionResult<BankQuestion[]>> {
  return run("courseTests.listBank", "/courses", async () => {
    const parsed = parseInput(bankQuerySchema, query)
    const params = new URLSearchParams()
    if (parsed?.courseId) params.set("course_id", String(parsed.courseId))
    if (parsed?.search?.trim()) params.set("search", parsed.search.trim())
    const qs = params.toString()
    return apiFetch(`${endpoints.teacherTests.bank}${qs ? `?${qs}` : ""}`, z.array(bankQuestionSchema))
  })
}

export async function getGradingQueue(query?: { testId?: number; status?: "pending" | "graded" }): Promise<ActionResult<GradingQueueItem[]>> {
  return run("courseTests.getGradingQueue", "/grading", async () => {
    const parsed = parseInput(queueQuerySchema, query)
    const params = new URLSearchParams()
    if (parsed?.testId) params.set("test_id", String(parsed.testId))
    if (parsed?.status) params.set("status", parsed.status)
    const qs = params.toString()
    return apiFetch(`${endpoints.teacherTests.gradingQueue}${qs ? `?${qs}` : ""}`, z.array(gradingQueueItemSchema), { tags: [tags.grading] })
  })
}

export async function getPendingGradingCount(): Promise<ActionResult<number>> {
  return run("courseTests.getPendingGradingCount", "/grading", async () => {
    const result = await apiFetch(endpoints.teacherTests.gradingCount, pendingCountSchema, { tags: [tags.grading] })
    return result.count
  })
}

// ---------------------------------------------------------------------------
// Test lifecycle

export async function createTest(courseId: number, input?: { title?: string }): Promise<ActionResult<{ id: number }>> {
  return run("courseTests.createTest", courseTestsPath(courseId), async () => {
    const id = parseInput(positiveId, courseId)
    const body = parseInput(z.object({ title: z.string().trim().max(200).optional() }).optional(), input)
    const created = await apiFetch(endpoints.teacherTests.list(id), createdSchema, { method: "POST", body: json({ title: body?.title || undefined }) })
    updateTag(tags.course(id))
    return created
  })
}

export async function duplicateTest(testId: number, targetCourseId?: number): Promise<ActionResult<{ id: number }>> {
  return run("courseTests.duplicateTest", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    const target = parseInput(positiveId.optional(), targetCourseId)
    const created = await apiFetch(endpoints.teacherTests.duplicate(id), createdSchema, { method: "POST", body: json({ target_course_id: target ?? null }) })
    // The copy's course isn't known from the response; refresh the target (if given).
    if (target) updateTag(tags.course(target))
    updateTag(tags.test(id))
    return created
  })
}

export async function updateSettings(testId: number, settings: Partial<TestSettings>): Promise<ActionResult<CourseTest>> {
  return run("courseTests.updateSettings", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    const body = parseInput(settingsInputSchema, settings)
    const test = await apiFetch(endpoints.teacherTests.detail(id), courseTestSchema, { method: "PATCH", body: json(body) })
    invalidateTest(test)
    return test
  })
}

export async function publishTest(testId: number): Promise<ActionResult<CourseTest>> {
  return run("courseTests.publishTest", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    const test = await apiFetch(endpoints.teacherTests.publish(id), courseTestSchema, { method: "POST" })
    invalidateTest(test)
    return test
  })
}

export async function unpublishTest(testId: number): Promise<ActionResult<CourseTest>> {
  return run("courseTests.unpublishTest", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    const test = await apiFetch(endpoints.teacherTests.unpublish(id), courseTestSchema, { method: "POST" })
    invalidateTest(test)
    return test
  })
}

export async function archiveTest(testId: number): Promise<ActionResult<null>> {
  return run("courseTests.archiveTest", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    await apiFetch(endpoints.teacherTests.archive(id), z.unknown(), { method: "POST" })
    updateTag(tags.test(id))
    return null
  })
}

export async function deleteTest(testId: number): Promise<ActionResult<null>> {
  return run("courseTests.deleteTest", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    await apiFetch(endpoints.teacherTests.detail(id), z.unknown(), { method: "DELETE" })
    updateTag(tags.test(id))
    return null
  })
}

// ---------------------------------------------------------------------------
// Questions

export async function addQuestion(testId: number, input: QuestionInput): Promise<ActionResult<TestQuestion>> {
  return run("courseTests.addQuestion", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    const body = parseInput(questionInputSchema, input)
    const question = await apiFetch(endpoints.teacherTests.questions(id), testQuestionSchema, { method: "POST", body: json(body) })
    updateTag(tags.test(id))
    return question
  })
}

export async function updateQuestion(questionId: number, input: QuestionInput): Promise<ActionResult<TestQuestion>> {
  return run("courseTests.updateQuestion", "/courses", async () => {
    const id = parseInput(positiveId, questionId)
    const body = parseInput(questionInputSchema, input)
    return apiFetch(endpoints.teacherTests.question(id), testQuestionSchema, { method: "PATCH", body: json(body) })
  })
}

export async function deleteQuestion(questionId: number): Promise<ActionResult<null>> {
  return run("courseTests.deleteQuestion", "/courses", async () => {
    const id = parseInput(positiveId, questionId)
    await apiFetch(endpoints.teacherTests.question(id), z.unknown(), { method: "DELETE" })
    return null
  })
}

export async function reorderQuestions(testId: number, questionIds: number[]): Promise<ActionResult<null>> {
  return run("courseTests.reorderQuestions", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    const ids = parseInput(z.array(positiveId).min(1), questionIds)
    await apiFetch(endpoints.teacherTests.questionsOrder(id), z.unknown(), { method: "PUT", body: json({ question_ids: ids }) })
    updateTag(tags.test(id))
    return null
  })
}

export async function importFromBank(testId: number, bankQuestionIds: number[]): Promise<ActionResult<TestQuestion[]>> {
  return run("courseTests.importFromBank", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    const ids = parseInput(z.array(positiveId).min(1).max(200), bankQuestionIds)
    const questions = await apiFetch(endpoints.teacherTests.fromBank(id), z.array(testQuestionSchema), { method: "POST", body: json({ bank_question_ids: ids }) })
    updateTag(tags.test(id))
    return questions
  })
}

export async function drawFromBank(testId: number, count: number, courseId?: number): Promise<ActionResult<TestQuestion[]>> {
  return run("courseTests.drawFromBank", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    const n = parseInput(z.number().int().min(1).max(200), count)
    const course = parseInput(positiveId.optional(), courseId)
    const questions = await apiFetch(endpoints.teacherTests.randomDraw(id), z.array(testQuestionSchema), { method: "POST", body: json({ count: n, course_id: course ?? null }) })
    updateTag(tags.test(id))
    return questions
  })
}

export async function previewExcel(testId: number, file: File): Promise<ActionResult<ExcelImportPreview>> {
  return run("courseTests.previewExcel", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    if (!(file instanceof Blob) || file.size === 0 || file.size > EXCEL_MAX_BYTES) throw new InvalidInput("file")
    const form = new FormData()
    form.append("file", file, file instanceof File ? file.name : "questions.xlsx")
    return apiFetch(endpoints.teacherTests.importExcel(id, true), excelImportPreviewSchema, { method: "POST", body: form, timeoutMs: 30_000 })
  })
}

export async function importExcel(testId: number, rows: QuestionInput[]): Promise<ActionResult<TestQuestion[]>> {
  return run("courseTests.importExcel", testPath(testId), async () => {
    const id = parseInput(positiveId, testId)
    const questions = parseInput(z.array(questionInputSchema).min(1).max(500), rows)
    const created = await apiFetch(endpoints.teacherTests.importExcel(id, false), z.array(testQuestionSchema), { method: "POST", body: json({ questions }), timeoutMs: 30_000 })
    updateTag(tags.test(id))
    return created
  })
}

// ---------------------------------------------------------------------------
// Grading

export async function gradeAnswer(answerId: number, points: number, feedback: string): Promise<ActionResult<GradeResult>> {
  return run("courseTests.gradeAnswer", "/grading", async () => {
    const input = parseInput(gradeInputSchema, { answerId, points, feedback })
    const result = await apiFetch(endpoints.teacherTests.gradeAnswer(input.answerId), gradeResultSchema, {
      method: "PUT",
      body: json({ points: input.points, feedback: input.feedback.trim() || null }),
    })
    updateTag(tags.grading)
    return result
  })
}
