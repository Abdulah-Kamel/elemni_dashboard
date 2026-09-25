// Pure builder logic: type defaults, answer-key editing, reordering, client-side
// validation (a UX mirror of the server's publish rules — the API is
// authoritative) and summary numbers. No React, no I/O.

import type { AnswerKey, Option, QuestionInput, QuestionType, TestQuestion, TestSettings } from "../../types"

export const QUESTION_TYPES: readonly QuestionType[] = ["single", "multi", "true_false", "short_answer", "essay", "ordering", "matching"]

/** A question being edited. `local_key` stays stable when a local draft receives its server id. */
export type DraftQuestion = TestQuestion & { save_to_bank?: boolean; local_key?: number }

export function stableKey(question: DraftQuestion) {
  return question.local_key ?? question.id
}

export type IdFactory = () => string

let sequence = 0
export const makeId: IdFactory = () => `o${Date.now().toString(36)}${(sequence++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function isAutoGraded(type: QuestionType) {
  return type !== "essay"
}

// ---------------------------------------------------------------------------
// Answer-key views (AnswerKey is a loose union; these read it per type)

export type RubricRow = { criterion: string; points: number }

type LooseKey = {
  option_id?: string
  option_ids?: string[]
  accepted?: string[]
  case_sensitive?: boolean
  matches?: Record<string, string>
  right_options?: Option[]
  model_answer?: string
  rubric?: RubricRow[]
  word_limit?: number | null
}

export function key(question: Pick<TestQuestion, "answer_key">): LooseKey {
  return (question.answer_key ?? {}) as LooseKey
}

function withKey<Q extends Pick<TestQuestion, "answer_key">>(question: Q, patch: LooseKey): Q {
  return { ...question, answer_key: { ...key(question), ...patch } as AnswerKey }
}

// ---------------------------------------------------------------------------
// Type defaults / switching

export type TypeLabels = { trueLabel: string; falseLabel: string }

function blankOptions(count: number, newId: IdFactory): Option[] {
  return Array.from({ length: count }, () => ({ id: newId(), text: "" }))
}

export function defaultsForType(type: QuestionType, labels: TypeLabels, newId: IdFactory = makeId): Pick<TestQuestion, "options" | "answer_key" | "shuffle_options"> {
  switch (type) {
    case "single":
      return { options: blankOptions(4, newId), answer_key: {}, shuffle_options: true }
    case "multi":
      return { options: blankOptions(4, newId), answer_key: { option_ids: [] }, shuffle_options: true }
    case "true_false":
      return { options: [{ id: newId(), text: labels.trueLabel }, { id: newId(), text: labels.falseLabel }], answer_key: {}, shuffle_options: false }
    case "short_answer":
      return { options: [], answer_key: { accepted: [], case_sensitive: false }, shuffle_options: false }
    case "essay":
      return { options: [], answer_key: { model_answer: "", rubric: [], word_limit: null }, shuffle_options: false }
    case "ordering": {
      const options = blankOptions(3, newId)
      return { options, answer_key: { option_ids: options.map((option) => option.id) }, shuffle_options: false }
    }
    case "matching":
      return { options: blankOptions(3, newId), answer_key: { matches: {}, right_options: blankOptions(3, newId) }, shuffle_options: false }
  }
}

export function newQuestion(type: QuestionType, position: number, id: number, labels: TypeLabels, newId: IdFactory = makeId): DraftQuestion {
  return {
    id,
    position,
    type,
    text: "",
    code_snippet: null,
    image_url: null,
    points: 1,
    explanation: null,
    topic_ref: null,
    bank_question_id: null,
    ...defaultsForType(type, labels, newId),
  }
}

const LIST_TYPES: readonly QuestionType[] = ["single", "multi", "ordering"]

/** Switch a question's type, keeping everything that still makes sense. */
export function switchQuestionType<Q extends TestQuestion>(question: Q, type: QuestionType, labels: TypeLabels, newId: IdFactory = makeId): Q {
  if (question.type === type) return question
  const base = { ...question, type }
  if (LIST_TYPES.includes(question.type) && LIST_TYPES.includes(type)) {
    const options = question.options.length >= 2 ? question.options : [...question.options, ...blankOptions(2 - question.options.length, newId)]
    const current = key(question)
    const ids = new Set(options.map((option) => option.id))
    let answer_key: AnswerKey
    if (type === "ordering") answer_key = { option_ids: options.map((option) => option.id) }
    else if (type === "multi") answer_key = { option_ids: question.type === "single" && current.option_id && ids.has(current.option_id) ? [current.option_id] : [] }
    else {
      const first = question.type === "multi" ? current.option_ids?.find((id) => ids.has(id)) : undefined
      answer_key = first ? { option_id: first } : {}
    }
    return { ...base, options, answer_key, shuffle_options: type === "ordering" ? false : question.shuffle_options }
  }
  return { ...base, ...defaultsForType(type, labels, newId) }
}

// ---------------------------------------------------------------------------
// Reorder

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length || to < 0 || to >= items.length) return [...items]
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

// ---------------------------------------------------------------------------
// Option editing (single / multi / true_false / ordering / matching-left)

export const MIN_OPTIONS = 2

function syncOrdering<Q extends TestQuestion>(question: Q): Q {
  return question.type === "ordering" ? withKey(question, { option_ids: question.options.map((option) => option.id) }) : question
}

export function addOption<Q extends TestQuestion>(question: Q, newId: IdFactory = makeId): Q {
  if (question.type === "true_false") return question
  return syncOrdering({ ...question, options: [...question.options, { id: newId(), text: "" }] })
}

export function removeOption<Q extends TestQuestion>(question: Q, optionId: string): Q {
  if (question.options.length <= MIN_OPTIONS || question.type === "true_false") return question
  const next = { ...question, options: question.options.filter((option) => option.id !== optionId) }
  const current = key(question)
  if (question.type === "single" && current.option_id === optionId) return { ...next, answer_key: {} }
  if (question.type === "multi") return withKey(next, { option_ids: (current.option_ids ?? []).filter((id) => id !== optionId) })
  if (question.type === "matching") {
    const matches = { ...(current.matches ?? {}) }
    delete matches[optionId]
    return withKey(next, { matches })
  }
  return syncOrdering(next)
}

export function setOptionText<Q extends TestQuestion>(question: Q, optionId: string, text: string): Q {
  return { ...question, options: question.options.map((option) => (option.id === optionId ? { ...option, text } : option)) }
}

export function moveOption<Q extends TestQuestion>(question: Q, from: number, to: number): Q {
  return syncOrdering({ ...question, options: moveItem(question.options, from, to) })
}

export function setCorrectOption<Q extends TestQuestion>(question: Q, optionId: string): Q {
  return { ...question, answer_key: { option_id: optionId } }
}

export function toggleCorrectOption<Q extends TestQuestion>(question: Q, optionId: string): Q {
  const ids = key(question).option_ids ?? []
  return withKey(question, { option_ids: ids.includes(optionId) ? ids.filter((id) => id !== optionId) : [...ids, optionId] })
}

export function isCorrectOption(question: TestQuestion, optionId: string) {
  const current = key(question)
  if (question.type === "multi") return (current.option_ids ?? []).includes(optionId)
  return current.option_id === optionId
}

// ---------------------------------------------------------------------------
// Matching (options = left side; right_options + matches in the key)

export function rightOptions(question: TestQuestion): Option[] {
  return key(question).right_options ?? []
}

export function addMatchingPair<Q extends TestQuestion>(question: Q, newId: IdFactory = makeId): Q {
  const left = { id: newId(), text: "" }
  const right = { id: newId(), text: "" }
  const current = key(question)
  return withKey({ ...question, options: [...question.options, left] }, {
    right_options: [...(current.right_options ?? []), right],
    matches: { ...(current.matches ?? {}), [left.id]: right.id },
  })
}

export function addRightOption<Q extends TestQuestion>(question: Q, newId: IdFactory = makeId): Q {
  return withKey(question, { right_options: [...rightOptions(question), { id: newId(), text: "" }] })
}

export function removeRightOption<Q extends TestQuestion>(question: Q, rightId: string): Q {
  const rights = rightOptions(question)
  if (rights.length <= MIN_OPTIONS) return question
  const matches = Object.fromEntries(Object.entries(key(question).matches ?? {}).filter(([, value]) => value !== rightId))
  return withKey(question, { right_options: rights.filter((option) => option.id !== rightId), matches })
}

export function setRightText<Q extends TestQuestion>(question: Q, rightId: string, text: string): Q {
  return withKey(question, { right_options: rightOptions(question).map((option) => (option.id === rightId ? { ...option, text } : option)) })
}

export function setMatch<Q extends TestQuestion>(question: Q, leftId: string, rightId: string | null): Q {
  const matches = { ...(key(question).matches ?? {}) }
  if (rightId) matches[leftId] = rightId
  else delete matches[leftId]
  return withKey(question, { matches })
}

// ---------------------------------------------------------------------------
// Short answer

export function addAcceptedAnswer<Q extends TestQuestion>(question: Q, value: string): Q {
  const text = value.trim().replace(/\s+/g, " ")
  const accepted = key(question).accepted ?? []
  if (!text || accepted.includes(text)) return question
  return withKey(question, { accepted: [...accepted, text] })
}

export function removeAcceptedAnswer<Q extends TestQuestion>(question: Q, value: string): Q {
  return withKey(question, { accepted: (key(question).accepted ?? []).filter((item) => item !== value) })
}

export function setCaseSensitive<Q extends TestQuestion>(question: Q, value: boolean): Q {
  return withKey(question, { case_sensitive: value })
}

// ---------------------------------------------------------------------------
// Essay

export function setEssayKey<Q extends TestQuestion>(question: Q, patch: { model_answer?: string; rubric?: RubricRow[]; word_limit?: number | null }): Q {
  return withKey(question, patch)
}

export function rubricTotal(question: TestQuestion) {
  return (key(question).rubric ?? []).reduce((sum, row) => sum + (Number.isFinite(row.points) ? row.points : 0), 0)
}

// ---------------------------------------------------------------------------
// Validation

export type IssueCode =
  | "text_required"
  | "points_invalid"
  | "options_min"
  | "option_text_required"
  | "option_duplicate"
  | "correct_missing"
  | "multi_correct_missing"
  | "ordering_invalid"
  | "matching_right_min"
  | "right_text_required"
  | "matching_incomplete"
  | "matching_duplicate"
  | "accepted_missing"
  | "rubric_criterion_required"
  | "rubric_points_invalid"
  | "word_limit_invalid"
  | "no_questions"
  | "title_required"
  | "pass_percent_range"
  | "window_order"
  | "random_pool_range"
  | "time_limit_invalid"
  | "max_attempts_invalid"
  | "cooldown_invalid"
  | "parent_item_required"
  | "prerequisite_tests_required"

export type SettingsField = keyof TestSettings

export type Issue = {
  code: IssueCode
  /** Question id (for question issues). */
  questionId?: number
  /** 1-based question number (for question issues). */
  number?: number
  /** Settings fields the issue is about (for settings issues). */
  fields?: SettingsField[]
}

function isPositiveInt(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 1
}

export function validateQuestion(question: TestQuestion): IssueCode[] {
  const issues: IssueCode[] = []
  if (!question.text.trim()) issues.push("text_required")
  if (!isPositiveInt(question.points)) issues.push("points_invalid")
  const current = key(question)
  const ids = question.options.map((option) => option.id)
  const idSet = new Set(ids)
  const needsOptions = question.type === "single" || question.type === "multi" || question.type === "true_false" || question.type === "ordering" || question.type === "matching"
  if (needsOptions) {
    if (question.options.length < MIN_OPTIONS) issues.push("options_min")
    if (question.options.some((option) => !option.text.trim())) issues.push("option_text_required")
    if (idSet.size !== ids.length) issues.push("option_duplicate")
  }
  switch (question.type) {
    case "single":
    case "true_false":
      if (!current.option_id || !idSet.has(current.option_id)) issues.push("correct_missing")
      break
    case "multi": {
      const chosen = (current.option_ids ?? []).filter((id) => idSet.has(id))
      if (chosen.length === 0) issues.push("multi_correct_missing")
      break
    }
    case "ordering": {
      const order = current.option_ids ?? []
      const valid = order.length === ids.length && new Set(order).size === order.length && order.every((id) => idSet.has(id))
      if (!valid) issues.push("ordering_invalid")
      break
    }
    case "matching": {
      const rights = current.right_options ?? []
      const rightIds = new Set(rights.map((option) => option.id))
      const matches = current.matches ?? {}
      if (rights.length < MIN_OPTIONS) issues.push("matching_right_min")
      if (rights.some((option) => !option.text.trim())) issues.push("right_text_required")
      const used = question.options.map((option) => matches[option.id]).filter((id): id is string => Boolean(id && rightIds.has(id)))
      if (used.length !== question.options.length) issues.push("matching_incomplete")
      else if (new Set(used).size !== used.length) issues.push("matching_duplicate")
      break
    }
    case "short_answer":
      if (!(current.accepted ?? []).some((answer) => answer.trim())) issues.push("accepted_missing")
      break
    case "essay": {
      const rubric = current.rubric ?? []
      if (rubric.some((row) => !row.criterion.trim())) issues.push("rubric_criterion_required")
      if (rubric.some((row) => !Number.isInteger(row.points) || row.points < 0)) issues.push("rubric_points_invalid")
      if (current.word_limit !== null && current.word_limit !== undefined && !isPositiveInt(current.word_limit)) issues.push("word_limit_invalid")
      break
    }
  }
  return issues
}

export function validateSettings(settings: TestSettings, questionCount: number): Issue[] {
  const issues: Issue[] = []
  if (!settings.title.trim()) issues.push({ code: "title_required", fields: ["title"] })
  if (!Number.isInteger(settings.pass_percent) || settings.pass_percent < 1 || settings.pass_percent > 100) issues.push({ code: "pass_percent_range", fields: ["pass_percent"] })
  if (settings.time_limit_minutes !== null && !isPositiveInt(settings.time_limit_minutes)) issues.push({ code: "time_limit_invalid", fields: ["time_limit_minutes"] })
  if (settings.max_attempts !== null && !isPositiveInt(settings.max_attempts)) issues.push({ code: "max_attempts_invalid", fields: ["max_attempts"] })
  if (!Number.isInteger(settings.cooldown_minutes) || settings.cooldown_minutes < 0) issues.push({ code: "cooldown_invalid", fields: ["cooldown_minutes"] })
  if (settings.opens_at && settings.closes_at && new Date(settings.closes_at).getTime() <= new Date(settings.opens_at).getTime()) issues.push({ code: "window_order", fields: ["opens_at", "closes_at"] })
  if (settings.random_pool_size !== null && (!isPositiveInt(settings.random_pool_size) || settings.random_pool_size > questionCount)) issues.push({ code: "random_pool_range", fields: ["random_pool_size"] })
  if (settings.placement === "inside_item" && settings.parent_item_id === null) issues.push({ code: "parent_item_required", fields: ["placement", "parent_item_id"] })
  if (settings.prerequisite === "pass_tests" && settings.prerequisite_ids.length === 0) issues.push({ code: "prerequisite_tests_required", fields: ["prerequisite", "prerequisite_ids"] })
  return issues
}

export function validateTest(settings: TestSettings, questions: readonly TestQuestion[]): Issue[] {
  const issues: Issue[] = []
  if (questions.length === 0) issues.push({ code: "no_questions" })
  questions.forEach((question, index) => {
    for (const code of validateQuestion(question)) issues.push({ code, questionId: question.id, number: index + 1 })
  })
  return [...issues, ...validateSettings(settings, questions.length)]
}

// ---------------------------------------------------------------------------
// Persistence helpers

/** The API rejects questions without text or with bad points; hold those locally. */
export function isPersistable(question: TestQuestion) {
  const ids = question.options.map((option) => option.id)
  return Boolean(question.text.trim()) && isPositiveInt(question.points) && new Set(ids).size === ids.length
}

export function toQuestionInput(question: DraftQuestion, position: number): QuestionInput {
  return {
    position,
    type: question.type,
    text: question.text,
    code_snippet: question.code_snippet?.trim() ? question.code_snippet : null,
    image_url: question.image_url?.trim() ? question.image_url.trim() : null,
    points: question.points,
    options: question.options,
    answer_key: question.answer_key,
    explanation: question.explanation?.trim() ? question.explanation : null,
    shuffle_options: question.shuffle_options,
    topic_ref: question.topic_ref,
    ...(question.save_to_bank && !question.bank_question_id ? { save_to_bank: true } : {}),
  }
}

/** Split a dirty settings patch into what can be sent now and what must wait until it is valid. */
export function splitSettingsPatch(patch: Partial<TestSettings>, settings: TestSettings, questionCount: number) {
  const blocked = new Set<SettingsField>()
  for (const issue of validateSettings(settings, questionCount)) for (const field of issue.fields ?? []) blocked.add(field)
  const send: Partial<TestSettings> = {}
  const held: Partial<TestSettings> = {}
  for (const field of Object.keys(patch) as SettingsField[]) {
    const target = blocked.has(field) ? held : send
    ;(target as Record<string, unknown>)[field] = settings[field]
  }
  return { send, held }
}

export function pickSettings(test: TestSettings): TestSettings {
  return {
    lesson_id: test.lesson_id,
    position: test.position,
    placement: test.placement,
    parent_item_id: test.parent_item_id,
    title: test.title,
    description: test.description,
    time_limit_minutes: test.time_limit_minutes,
    max_attempts: test.max_attempts,
    grading_policy: test.grading_policy,
    cooldown_minutes: test.cooldown_minutes,
    pass_percent: test.pass_percent,
    complete_item_on_pass_only: test.complete_item_on_pass_only,
    notify_teacher_on_attempts_exhausted: test.notify_teacher_on_attempts_exhausted,
    prerequisite: test.prerequisite,
    prerequisite_ids: test.prerequisite_ids,
    opens_at: test.opens_at,
    closes_at: test.closes_at,
    shuffle_questions: test.shuffle_questions,
    allow_back_navigation: test.allow_back_navigation,
    random_pool_size: test.random_pool_size,
    show_correct_answers: test.show_correct_answers,
    show_score_immediately: test.show_score_immediately,
  }
}

// ---------------------------------------------------------------------------
// Summary

export function summarize(questions: readonly Pick<TestQuestion, "type" | "points">[]) {
  const points = (question: Pick<TestQuestion, "points">) => (Number.isFinite(question.points) ? question.points : 0)
  const auto = questions.filter((question) => isAutoGraded(question.type))
  const manual = questions.filter((question) => !isAutoGraded(question.type))
  const autoPoints = auto.reduce((sum, question) => sum + points(question), 0)
  const manualPoints = manual.reduce((sum, question) => sum + points(question), 0)
  return { count: questions.length, totalPoints: autoPoints + manualPoints, autoCount: auto.length, autoPoints, manualCount: manual.length, manualPoints }
}

/** Points needed to pass, e.g. 60% of 20 → 12. */
export function passPoints(totalPoints: number, passPercent: number) {
  return Math.ceil((totalPoints * passPercent) / 100)
}

// ---------------------------------------------------------------------------
// Date-time: store UTC ISO, edit in local time via <input type="datetime-local">

export function isoToLocalInput(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function localInputToIso(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function isFuture(iso: string | null, now = Date.now()) {
  return Boolean(iso && new Date(iso).getTime() > now)
}
