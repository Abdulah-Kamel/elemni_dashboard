import { describe, expect, it } from "vitest"
import type { TestQuestion, TestSettings } from "../../../types"
import {
  addAcceptedAnswer,
  addMatchingPair,
  addOption,
  addRightOption,
  defaultsForType,
  isPersistable,
  isoToLocalInput,
  key,
  localInputToIso,
  moveItem,
  moveOption,
  newQuestion,
  passPoints,
  removeOption,
  removeRightOption,
  setCorrectOption,
  setEssayKey,
  setMatch,
  setOptionText,
  setRightText,
  splitSettingsPatch,
  summarize,
  switchQuestionType,
  toQuestionInput,
  toggleCorrectOption,
  validateQuestion,
  validateSettings,
  validateTest,
  type IdFactory,
} from "../builder-model"

const labels = { trueLabel: "صح", falseLabel: "خطأ" }

function ids(): IdFactory {
  let next = 0
  return () => `id${++next}`
}

function question(type: TestQuestion["type"], patch: Partial<TestQuestion> = {}): TestQuestion {
  return { ...newQuestion(type, 0, 1, labels, ids()), text: "سؤال", ...patch }
}

function fillOptions<Q extends TestQuestion>(q: Q): Q {
  return q.options.reduce((current, option, index) => setOptionText(current, option.id, `خيار ${index + 1}`), q)
}

const settings: TestSettings = {
  lesson_id: 1,
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
}

describe("type defaults", () => {
  it("true/false gets صح / خطأ options, not placeholders", () => {
    const defaults = defaultsForType("true_false", labels, ids())
    expect(defaults.options.map((option) => option.text)).toEqual(["صح", "خطأ"])
    expect(defaults.answer_key).toEqual({})
  })

  it("ordering starts with the correct order equal to the option order", () => {
    const defaults = defaultsForType("ordering", labels, ids())
    expect(defaults.options).toHaveLength(3)
    expect(key(defaults).option_ids).toEqual(defaults.options.map((option) => option.id))
  })

  it("matching starts with left items, right options and an empty match map", () => {
    const defaults = defaultsForType("matching", labels, ids())
    expect(defaults.options).toHaveLength(3)
    expect(key(defaults).right_options).toHaveLength(3)
    expect(key(defaults).matches).toEqual({})
  })

  it("short answer and essay have no options", () => {
    expect(defaultsForType("short_answer", labels, ids())).toMatchObject({ options: [], answer_key: { accepted: [], case_sensitive: false } })
    expect(defaultsForType("essay", labels, ids())).toMatchObject({ options: [], answer_key: { model_answer: "", rubric: [], word_limit: null } })
  })
})

describe("switching type", () => {
  it("keeps text, points, explanation and topic", () => {
    const source = question("single", { points: 3, explanation: "شرح", topic_ref: 9 })
    const switched = switchQuestionType(source, "essay", labels, ids())
    expect(switched).toMatchObject({ type: "essay", text: "سؤال", points: 3, explanation: "شرح", topic_ref: 9, options: [] })
  })

  it("single → true_false rebuilds صح / خطأ", () => {
    const switched = switchQuestionType(fillOptions(question("single")), "true_false", labels, ids())
    expect(switched.options.map((option) => option.text)).toEqual(["صح", "خطأ"])
    expect(switched.answer_key).toEqual({})
  })

  it("single ↔ multi keeps options and carries the correct answer", () => {
    const single = setCorrectOption(fillOptions(question("single")), "id2")
    const multi = switchQuestionType(single, "multi", labels, ids())
    expect(multi.options).toEqual(single.options)
    expect(key(multi).option_ids).toEqual(["id2"])
    const back = switchQuestionType(toggleCorrectOption(multi, "id4"), "single", labels, ids())
    expect(key(back).option_id).toBe("id2")
  })

  it("multi → ordering uses the options as the correct order", () => {
    const multi = fillOptions(question("multi"))
    const ordering = switchQuestionType(multi, "ordering", labels, ids())
    expect(key(ordering).option_ids).toEqual(multi.options.map((option) => option.id))
    expect(validateQuestion(ordering)).toEqual([])
  })

  it("true_false → single starts from blank options", () => {
    const single = switchQuestionType(question("true_false"), "single", labels, ids())
    expect(single.options).toHaveLength(4)
    expect(single.options.every((option) => option.text === "")).toBe(true)
  })
})

describe("option editing", () => {
  it("adds and removes options, never below two", () => {
    let q = question("single")
    q = addOption(q, () => "extra")
    expect(q.options).toHaveLength(5)
    q = removeOption(removeOption(removeOption(q, "extra"), q.options[0].id), q.options[1].id)
    expect(q.options).toHaveLength(2)
    expect(removeOption(q, q.options[0].id).options).toHaveLength(2)
  })

  it("removing the correct option clears the key", () => {
    const q = setCorrectOption(question("single"), "id1")
    expect(key(removeOption(q, "id1")).option_id).toBeUndefined()
    const multi = toggleCorrectOption(toggleCorrectOption(question("multi"), "id1"), "id2")
    expect(key(removeOption(multi, "id1")).option_ids).toEqual(["id2"])
  })

  it("true/false options cannot be added or removed", () => {
    const q = question("true_false")
    expect(addOption(q)).toBe(q)
    expect(removeOption(q, q.options[0].id)).toBe(q)
  })

  it("ordering keeps option_ids in sync when adding, moving and removing", () => {
    let q = fillOptions(question("ordering"))
    q = moveOption(q, 2, 0)
    expect(key(q).option_ids).toEqual(q.options.map((option) => option.id))
    q = addOption(q, () => "new")
    expect(key(q).option_ids?.at(-1)).toBe("new")
    q = removeOption(q, "new")
    expect(key(q).option_ids).toEqual(q.options.map((option) => option.id))
  })
})

describe("reorder", () => {
  it("moves an item and ignores out-of-range moves", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"])
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"])
    expect(moveItem(["a", "b"], 0, 5)).toEqual(["a", "b"])
    expect(moveItem(["a", "b"], -1, 0)).toEqual(["a", "b"])
  })
})

describe("validateQuestion — every type is authorable", () => {
  it("single needs text, option texts and a correct answer", () => {
    const blank = question("single", { text: "" })
    expect(validateQuestion(blank)).toEqual(expect.arrayContaining(["text_required", "option_text_required", "correct_missing"]))
    expect(validateQuestion(setCorrectOption(fillOptions(question("single")), "id1"))).toEqual([])
  })

  it("points must be a positive integer", () => {
    expect(validateQuestion(question("essay", { points: 0 }))).toContain("points_invalid")
    expect(validateQuestion(question("essay", { points: 1.5 }))).toContain("points_invalid")
    expect(validateQuestion(question("essay", { points: Number.NaN }))).toContain("points_invalid")
  })

  it("true/false needs a correct answer", () => {
    const q = question("true_false")
    expect(validateQuestion(q)).toEqual(["correct_missing"])
    expect(validateQuestion(setCorrectOption(q, q.options[1].id))).toEqual([])
  })

  it("multi needs at least one correct answer", () => {
    const q = fillOptions(question("multi"))
    expect(validateQuestion(q)).toEqual(["multi_correct_missing"])
    expect(validateQuestion(toggleCorrectOption(toggleCorrectOption(q, "id1"), "id3"))).toEqual([])
  })

  it("ordering is valid once items have text", () => {
    const q = question("ordering")
    expect(validateQuestion(q)).toEqual(["option_text_required"])
    expect(validateQuestion(fillOptions(q))).toEqual([])
    expect(validateQuestion({ ...fillOptions(q), answer_key: { option_ids: ["id1"] } })).toEqual(["ordering_invalid"])
  })

  it("matching needs every item matched to a distinct option", () => {
    let q = fillOptions(question("matching"))
    const rights = key(q).right_options!
    q = rights.reduce((current, option, index) => setRightText(current, option.id, `وصف ${index + 1}`), q)
    expect(validateQuestion(q)).toEqual(["matching_incomplete"])
    q = q.options.reduce((current, option, index) => setMatch(current, option.id, rights[index].id), q)
    expect(validateQuestion(q)).toEqual([])
    expect(validateQuestion(setMatch(q, q.options[1].id, rights[0].id))).toEqual(["matching_duplicate"])
    expect(validateQuestion(setMatch(q, q.options[1].id, null))).toEqual(["matching_incomplete"])
  })

  it("matching pairs and extra options can be added and removed", () => {
    let q = question("matching")
    let n = 0
    q = addMatchingPair(q, () => `pair${++n}`)
    expect(q.options).toHaveLength(4)
    const newLeft = q.options.at(-1)!
    expect(key(q).matches?.[newLeft.id]).toBe(key(q).right_options?.at(-1)?.id)
    q = addRightOption(q, () => "distractor")
    expect(key(q).right_options).toHaveLength(5)
    const matchedRight = key(q).matches![newLeft.id]
    q = removeRightOption(q, matchedRight)
    expect(key(q).matches?.[newLeft.id]).toBeUndefined()
    q = removeOption(q, newLeft.id)
    expect(q.options).toHaveLength(3)
  })

  it("short answer needs an accepted answer; duplicates are ignored", () => {
    const q = question("short_answer")
    expect(validateQuestion(q)).toEqual(["accepted_missing"])
    const withAnswer = addAcceptedAnswer(addAcceptedAnswer(q, "  print  "), "print")
    expect(key(withAnswer).accepted).toEqual(["print"])
    expect(validateQuestion(withAnswer)).toEqual([])
  })

  it("essay is valid without a rubric but rubric rows must be complete", () => {
    const q = question("essay")
    expect(validateQuestion(q)).toEqual([])
    expect(validateQuestion(setEssayKey(q, { rubric: [{ criterion: "", points: 1 }] }))).toEqual(["rubric_criterion_required"])
    expect(validateQuestion(setEssayKey(q, { rubric: [{ criterion: "دقة", points: -1 }] }))).toEqual(["rubric_points_invalid"])
    expect(validateQuestion(setEssayKey(q, { word_limit: 0 }))).toEqual(["word_limit_invalid"])
  })
})

describe("validateSettings / validateTest", () => {
  it("accepts valid settings", () => {
    expect(validateSettings(settings, 5)).toEqual([])
  })

  it("flags window order, pass %, random pool and required pickers", () => {
    const codes = validateSettings(
      {
        ...settings,
        title: " ",
        pass_percent: 0,
        opens_at: "2026-10-01T10:00:00.000Z",
        closes_at: "2026-10-01T09:00:00.000Z",
        random_pool_size: 6,
        placement: "inside_item",
        prerequisite: "pass_tests",
        time_limit_minutes: 0,
        max_attempts: 0,
      },
      5,
    ).map((issue) => issue.code)
    expect(codes).toEqual(expect.arrayContaining(["title_required", "pass_percent_range", "window_order", "random_pool_range", "parent_item_required", "prerequisite_tests_required", "time_limit_invalid", "max_attempts_invalid"]))
  })

  it("requires at least one question and numbers question issues", () => {
    expect(validateTest(settings, []).map((issue) => issue.code)).toEqual(["no_questions"])
    const issues = validateTest(settings, [setCorrectOption(fillOptions(question("single", { id: 7 })), "id1"), question("short_answer", { id: 8 })])
    expect(issues).toEqual([{ code: "accepted_missing", questionId: 8, number: 2 }])
  })
})

describe("persistence helpers", () => {
  it("holds questions the API would reject", () => {
    expect(isPersistable(question("single", { text: "" }))).toBe(false)
    expect(isPersistable(question("single", { points: 0 }))).toBe(false)
    expect(isPersistable(question("single"))).toBe(true)
  })

  it("builds question input with normalized empties and save_to_bank only when needed", () => {
    const input = toQuestionInput({ ...question("essay"), code_snippet: "  ", image_url: " ", explanation: "", save_to_bank: true }, 4)
    expect(input).toMatchObject({ position: 4, code_snippet: null, image_url: null, explanation: null, save_to_bank: true })
    expect(toQuestionInput({ ...question("essay"), save_to_bank: true, bank_question_id: 3 }, 0)).not.toHaveProperty("save_to_bank")
  })

  it("splits dirty settings into sendable and held fields", () => {
    const current = { ...settings, pass_percent: 70, opens_at: "2026-10-02T10:00:00.000Z", closes_at: "2026-10-01T10:00:00.000Z" }
    const { send, held } = splitSettingsPatch({ pass_percent: 70, closes_at: current.closes_at }, current, 5)
    expect(send).toEqual({ pass_percent: 70 })
    expect(held).toEqual({ closes_at: current.closes_at })
  })
})

describe("summary and dates", () => {
  it("summarizes auto and manual questions", () => {
    expect(summarize([{ type: "single", points: 2 }, { type: "essay", points: 4 }, { type: "matching", points: 3 }])).toEqual({ count: 3, totalPoints: 9, autoCount: 2, autoPoints: 5, manualCount: 1, manualPoints: 4 })
  })

  it("computes pass points like the design (60% of 20 → 12)", () => {
    expect(passPoints(20, 60)).toBe(12)
    expect(passPoints(7, 50)).toBe(4)
  })

  it("round-trips local datetime input and UTC ISO", () => {
    const iso = "2026-09-28T07:00:00.000Z"
    expect(localInputToIso(isoToLocalInput(iso))).toBe(iso)
    expect(localInputToIso("")).toBeNull()
    expect(isoToLocalInput(null)).toBe("")
  })
})
