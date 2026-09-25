import { describe, expect, it } from "vitest"
import type { TestQuestion } from "../../../types"
import { announcementFor, buildPreviewAttempt, formatClock, isAnswered, isCorrect, normalizeShortAnswer, scorePreview, wordCount } from "../preview-scoring"

function q(id: number, type: TestQuestion["type"], patch: Partial<TestQuestion> = {}): TestQuestion {
  return { id, position: id, type, text: `q${id}`, code_snippet: null, image_url: null, points: 2, options: [], answer_key: {}, explanation: null, shuffle_options: false, topic_ref: null, bank_question_id: null, ...patch }
}

const opts = (...values: string[]) => values.map((text, index) => ({ id: String.fromCharCode(97 + index), text }))

const single = q(1, "single", { options: opts("1", "2", "3"), answer_key: { option_id: "b" } })
const tf = q(2, "true_false", { options: opts("صح", "خطأ"), answer_key: { option_id: "a" }, points: 1 })
const multi = q(3, "multi", { options: opts("int", "float", "str"), answer_key: { option_ids: ["a", "b"] } })
const ordering = q(4, "ordering", { options: opts("x", "y", "z"), answer_key: { option_ids: ["a", "b", "c"] } })
const matching = q(5, "matching", { options: opts("int", "str"), answer_key: { matches: { a: "r1", b: "r2" }, right_options: [{ id: "r1", text: "عدد" }, { id: "r2", text: "نص" }] } })
const short = q(6, "short_answer", { answer_key: { accepted: ["إجابة", "Print"], case_sensitive: false } })
const essay = q(7, "essay", { points: 4 })

describe("normalizeShortAnswer", () => {
  it("normalizes spaces, hamza, taa marbuta, alef maqsura and digits", () => {
    expect(normalizeShortAnswer("  أحمد   إلى ")).toBe("احمد الي")
    expect(normalizeShortAnswer("مدرسة")).toBe(normalizeShortAnswer("مدرسه"))
    expect(normalizeShortAnswer("٤٢ و ۷")).toBe("42 و 7")
    expect(normalizeShortAnswer("PRINT")).toBe("print")
    expect(normalizeShortAnswer("PRINT", true)).toBe("PRINT")
  })
})

describe("isCorrect", () => {
  it("scores each auto-graded type all-or-nothing", () => {
    expect(isCorrect(single, "b")).toBe(true)
    expect(isCorrect(single, "a")).toBe(false)
    expect(isCorrect(tf, "a")).toBe(true)
    expect(isCorrect(multi, ["b", "a"])).toBe(true)
    expect(isCorrect(multi, ["a"])).toBe(false)
    expect(isCorrect(ordering, ["a", "b", "c"])).toBe(true)
    expect(isCorrect(ordering, ["b", "a", "c"])).toBe(false)
    expect(isCorrect(matching, { a: "r1", b: "r2" })).toBe(true)
    expect(isCorrect(matching, { a: "r2", b: "r1" })).toBe(false)
    expect(isCorrect(short, " اجابة ")).toBe(true)
    expect(isCorrect(short, "print")).toBe(true)
    expect(isCorrect(short, "echo")).toBe(false)
  })

  it("respects case sensitivity", () => {
    const strict = q(8, "short_answer", { answer_key: { accepted: ["Print"], case_sensitive: true } })
    expect(isCorrect(strict, "print")).toBe(false)
    expect(isCorrect(strict, "Print")).toBe(true)
  })

  it("essays are never auto-graded; blanks are not correct", () => {
    expect(isCorrect(essay, "نص")).toBeNull()
    expect(isCorrect(single, undefined)).toBe(false)
    expect(isAnswered(matching, { a: "" })).toBe(false)
  })
})

describe("scorePreview", () => {
  it("computes percent and pass for auto-graded tests", () => {
    const result = scorePreview([single, tf, multi], { 1: "b", 2: "b" }, 50)
    expect(result).toMatchObject({ maxScore: 5, autoScore: 2, correct: 1, wrong: 1, blank: 1, percent: 40, passed: false })
  })

  it("marks the result pending while essays await grading", () => {
    const result = scorePreview([single, essay], { 1: "b", 7: "إجابة" }, 50)
    expect(result).toMatchObject({ autoScore: 2, autoMax: 2, pendingEssays: 1, pendingPoints: 4, percent: null, passed: null })
  })

  it("counts an unanswered essay as blank", () => {
    expect(scorePreview([essay], {}, 50)).toMatchObject({ blank: 1, pendingEssays: 0, percent: 0, passed: false })
  })
})

describe("buildPreviewAttempt", () => {
  const seeded = () => {
    let seed = 7
    return () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
  }

  it("keeps order without shuffling and always shuffles ordering items", () => {
    const attempt = buildPreviewAttempt([single, ordering, tf], { shuffle_questions: false, random_pool_size: null }, seeded())
    expect(attempt.map((item) => item.id)).toEqual([1, 2, 4])
    expect(attempt.find((item) => item.id === 1)!.displayOptions).toEqual(single.options)
    expect(new Set(attempt.find((item) => item.id === 4)!.displayOptions.map((option) => option.id))).toEqual(new Set(["a", "b", "c"]))
  })

  it("draws the random pool size", () => {
    const attempt = buildPreviewAttempt([single, tf, multi, ordering], { shuffle_questions: true, random_pool_size: 2 }, seeded())
    expect(attempt).toHaveLength(2)
  })
})

describe("timer helpers", () => {
  it("announces only when crossing 5, 2 and 1 minutes", () => {
    expect(announcementFor(301, 300)).toBe(5)
    expect(announcementFor(300, 299)).toBeNull()
    expect(announcementFor(121, 120)).toBe(2)
    expect(announcementFor(61, 60)).toBe(1)
    expect(announcementFor(59, 58)).toBeNull()
  })

  it("formats the clock and counts words", () => {
    expect(formatClock(768)).toBe("12:48")
    expect(formatClock(-4)).toBe("00:00")
    expect(wordCount("  one two\nthree ")).toBe(3)
    expect(wordCount("")).toBe(0)
  })
})
