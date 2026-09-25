import { beforeEach, describe, expect, it } from "vitest"
import { demoCourseTestsClient as client, parseCsv, previewRows, publishIssues, resetDemoCourseTests } from "./demo-client"
import type { ActionResult, QuestionInput } from "./types"

// Node >= 22 shadows jsdom's localStorage with an undefined experimental stub;
// install a minimal in-memory Storage so the real persistence path is exercised.
if (typeof window !== "undefined" && !window.localStorage) {
  const data = new Map<string, string>()
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, String(value)),
      removeItem: (key: string) => void data.delete(key),
      clear: () => data.clear(),
      get length() {
        return data.size
      },
      key: (index: number) => [...data.keys()][index] ?? null,
    },
    configurable: true,
  })
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(`expected ok, got: ${result.error}`)
  return result.data
}

const question = (overrides: Partial<QuestionInput> = {}): QuestionInput => ({
  position: 0,
  type: "single",
  text: "سؤال",
  code_snippet: null,
  image_url: null,
  points: 2,
  options: [
    { id: "a", text: "أ" },
    { id: "b", text: "ب" },
  ],
  answer_key: { option_id: "a" },
  explanation: null,
  shuffle_options: false,
  topic_ref: null,
  ...overrides,
})

beforeEach(() => {
  resetDemoCourseTests()
  window.localStorage.clear()
})

describe("demo client: course scoping and seed", () => {
  it("seeds demo tests only for the course that is listed, and never touches other courses", async () => {
    const first = unwrap(await client.listTests(12))
    expect(first.length).toBeGreaterThan(0)
    expect(first.every((row) => row.course_id === 12)).toBe(true)

    const created = unwrap(await client.createTest(99, { title: "اختبار كورس آخر" }))
    const other = unwrap(await client.listTests(99))
    // Course 99 gets its own seed plus the created test; course 12 is unchanged.
    expect(other.some((row) => row.id === created.id)).toBe(true)
    expect(other.every((row) => row.course_id === 99)).toBe(true)
    expect(unwrap(await client.listTests(12)).map((row) => row.id)).toEqual(first.map((row) => row.id))
  })

  it("seeds a course only once", async () => {
    const a = unwrap(await client.listTests(5))
    const b = unwrap(await client.listTests(5))
    expect(b).toHaveLength(a.length)
  })
})

describe("demo client: publish validation", () => {
  it("refuses to publish a test without questions", async () => {
    const { id } = unwrap(await client.createTest(1))
    const result = await client.publishTest(id)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues?.map((issue) => issue.code)).toContain("no_questions")
  })

  it("requires an answer key for every auto-graded type", () => {
    const base = { title: "t", pass_percent: 60, opens_at: null, closes_at: null, random_pool_size: null }
    const q = (partial: Partial<QuestionInput>, id: number) => ({ ...question(partial), id, bank_question_id: null })
    const issues = publishIssues({
      ...base,
      questions: [
        q({ type: "single", answer_key: {} }, 1),
        q({ type: "multi", answer_key: { option_ids: [] } }, 2),
        q({ type: "ordering", answer_key: { option_ids: ["a"] } }, 3),
        q({ type: "matching", answer_key: { matches: { a: "x" }, right_options: [{ id: "x", text: "1" }] } }, 4),
        q({ type: "short_answer", options: [], answer_key: { accepted: ["  "] } }, 5),
        q({ type: "true_false", answer_key: { option_id: "zzz" } }, 6),
        q({ type: "essay", options: [], answer_key: {} }, 7),
      ],
    })
    const missing = issues.filter((issue) => issue.code === "missing_answer_key").map((issue) => issue.question_id)
    expect(missing).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("accepts complete keys, including ordering covering all options and full matching", () => {
    const issues = publishIssues({
      title: "t",
      pass_percent: 60,
      opens_at: null,
      closes_at: null,
      random_pool_size: null,
      questions: [
        { ...question({ type: "ordering", answer_key: { option_ids: ["b", "a"] } }), id: 1, bank_question_id: null },
        { ...question({ type: "matching", answer_key: { matches: { a: "x", b: "y" }, right_options: [{ id: "x", text: "1" }, { id: "y", text: "2" }] } }), id: 2, bank_question_id: null },
      ],
    })
    expect(issues).toEqual([])
  })

  it("validates pass %, the availability window and the random pool size", () => {
    const questions = [{ ...question(), id: 1, bank_question_id: null }]
    const codes = (overrides: object) =>
      publishIssues({ title: "t", pass_percent: 60, opens_at: null, closes_at: null, random_pool_size: null, questions, ...overrides }).map((issue) => issue.code)
    expect(codes({ pass_percent: 0 })).toContain("invalid_pass_percent")
    expect(codes({ pass_percent: 101 })).toContain("invalid_pass_percent")
    expect(codes({ opens_at: "2026-10-02T10:00:00Z", closes_at: "2026-10-01T10:00:00Z" })).toContain("invalid_window")
    expect(codes({ random_pool_size: 2 })).toContain("invalid_random_pool")
    expect(codes({})).toEqual([])
  })

  it("publishes once valid and derives question count and points", async () => {
    const { id } = unwrap(await client.createTest(1))
    unwrap(await client.addQuestion(id, question()))
    unwrap(await client.addQuestion(id, question({ type: "essay", options: [], answer_key: {}, points: 3 })))
    const published = unwrap(await client.publishTest(id))
    expect(published.status).toBe("published")
    expect(published.question_count).toBe(2)
    expect(published.total_points).toBe(5)
  })

  it("only deletes drafts", async () => {
    const rows = unwrap(await client.listTests(3))
    const published = rows.find((row) => row.status === "published")!
    expect((await client.deleteTest(published.id)).ok).toBe(false)
    const draft = rows.find((row) => row.status === "draft")!
    expect((await client.deleteTest(draft.id)).ok).toBe(true)
  })
})

describe("demo client: stats are computed from data", () => {
  it("counts statuses and pending essays, and averages graded attempts", async () => {
    const rows = unwrap(await client.listTests(7))
    const stats = unwrap(await client.getStats(7))
    expect(stats.draft_tests).toBe(rows.filter((row) => row.status === "draft").length)
    expect(stats.scheduled_tests).toBe(1)
    const pending = unwrap(await client.getGradingQueue({ status: "pending" }))
    expect(stats.pending_grading).toBe(pending.length)
    expect(unwrap(await client.getPendingGradingCount())).toBe(pending.length)
    // Only the fully graded seed attempt counts toward averages.
    expect(stats.average_score).not.toBeNull()

    unwrap(await client.createTest(7))
    const after = unwrap(await client.getStats(7))
    expect(after.draft_tests).toBe(stats.draft_tests + 1)
  })

  it("changes as answers are graded (no constants)", async () => {
    unwrap(await client.listTests(8))
    const before = unwrap(await client.getStats(8))
    const pending = unwrap(await client.getGradingQueue({ status: "pending" })).filter((item) => item.test.course_id === 8)
    for (const item of pending) unwrap(await client.gradeAnswer(item.answer_id, 0, ""))
    const after = unwrap(await client.getStats(8))
    expect(after.pending_grading).toBe(0)
    expect(after.average_score).not.toBe(before.average_score)
    expect(after.pass_rate).not.toBeNull()
  })
})

describe("demo client: grading", () => {
  it("keeps graded items, uses the test's pass %, and finalises the attempt after its last essay", async () => {
    unwrap(await client.listTests(4))
    const queue = unwrap(await client.getGradingQueue())
    const pending = queue.filter((item) => item.status === "pending")
    // One seeded attempt has two pending essays.
    const twoEssays = pending.find((item) => item.remaining_essays_in_attempt === 1)!
    expect(twoEssays).toBeDefined()
    const sibling = pending.find((item) => item.attempt_id === twoEssays.attempt_id && item.answer_id !== twoEssays.answer_id)!

    const first = unwrap(await client.gradeAnswer(twoEssays.answer_id, 4, "جيد"))
    expect(first.attempt_status).toBe("pending_grading")
    expect(first.percent).toBeNull()

    const refreshed = unwrap(await client.getGradingQueue())
    const graded = refreshed.find((item) => item.answer_id === twoEssays.answer_id)!
    expect(graded.status).toBe("graded")
    expect(graded.points_awarded).toBe(4)
    expect(graded.feedback).toBe("جيد")
    const siblingNow = refreshed.find((item) => item.answer_id === sibling.answer_id)!
    expect(siblingNow.score_rest).toBe(sibling.score_rest + 4)
    expect(siblingNow.remaining_essays_in_attempt).toBe(0)

    const final = unwrap(await client.gradeAnswer(sibling.answer_id, 5, ""))
    const expectedTotal = siblingNow.score_rest + 5
    expect(final.attempt_status).toBe("graded")
    expect(final.score_total).toBe(expectedTotal)
    expect(final.percent).toBe(Math.round((expectedTotal / final.max_score) * 100))
    expect(final.passed).toBe(final.percent! >= sibling.test.pass_percent)
    expect(unwrap(await client.getGradingQueue({ status: "graded" })).some((item) => item.answer_id === sibling.answer_id)).toBe(true)
  })

  it("uses the test's pass percent, not a fixed 60%", async () => {
    unwrap(await client.listTests(6))
    const item = unwrap(await client.getGradingQueue({ status: "pending" })).find((entry) => entry.remaining_essays_in_attempt === 0)!
    // Raise the pass mark so the same score now fails.
    unwrap(await client.updateSettings(item.test.id, { pass_percent: 100 }))
    const result = unwrap(await client.gradeAnswer(item.answer_id, 0, ""))
    expect(result.attempt_status).toBe("graded")
    expect(result.passed).toBe(false)
  })

  it("rejects out-of-range scores", async () => {
    unwrap(await client.listTests(9))
    const item = unwrap(await client.getGradingQueue({ status: "pending" }))[0]
    expect((await client.gradeAnswer(item.answer_id, item.question.points + 1, "")).ok).toBe(false)
    expect((await client.gradeAnswer(item.answer_id, -1, "")).ok).toBe(false)
  })

  it("returns the queue oldest first", async () => {
    unwrap(await client.listTests(10))
    const queue = unwrap(await client.getGradingQueue())
    const times = queue.map((item) => item.submitted_at)
    expect([...times].sort()).toEqual(times)
  })
})

describe("demo client: Excel/CSV import preview", () => {
  it("reports per-row errors and keeps valid rows", () => {
    const csv = [
      "النوع,نص السؤال,الدرجة,أ,ب,ج,د,الإجابة,الشرح",
      "اختيار من متعدد,ما ناتج 2+3؟,2,4,5,,,ب,",
      "صح أو خطأ,الشمس نجم,1,,,,,صح,",
      "نوع غريب,سؤال,1,,,,,,",
      'اختيار من متعدد,"سؤال, بفاصلة",0,أ,ب,,,هـ,',
      "إجابة قصيرة,عاصمة مصر؟,2,,,,,القاهرة|cairo,",
    ].join("\n")
    const preview = previewRows(parseCsv(csv))
    expect(preview.valid.map((row) => row.type)).toEqual(["single", "true_false", "short_answer"])
    expect(preview.valid[0].answer_key).toEqual({ option_id: "b" })
    expect(preview.errors.map((error) => error.row)).toEqual([4, 5])
    expect(preview.errors[1].errors.length).toBe(2)
  })

  it("parses a File through the client", async () => {
    const { id } = unwrap(await client.createTest(2))
    const file = new File(["﻿type,text,points,a,b,c,d,correct\nsingle,Q?,1,x,y,,,a\n"], "q.csv", { type: "text/csv" })
    const preview = unwrap(await client.previewExcel(id, file))
    expect(preview.valid).toHaveLength(1)
    const added = unwrap(await client.importExcel(id, preview.valid))
    expect(added).toHaveLength(1)
    expect(unwrap(await client.getTest(id)).question_count).toBe(1)
  })
})
