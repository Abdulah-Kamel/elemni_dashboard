// Local scoring for the teacher's "preview as student" flow only. Nothing is
// saved; the backend owns real scoring. Mirrors spec §4.

import type { Option, TestQuestion, TestSettings } from "../../types"
import { isAutoGraded, key } from "./builder-model"

export type PreviewResponse = string | string[] | Record<string, string> | undefined
export type PreviewResponses = Record<number, PreviewResponse>

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"

export function normalizeShortAnswer(value: string, caseSensitive = false) {
  let text = value.trim().replace(/\s+/g, " ")
  text = text.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
  text = text.replace(/[٠-٩۰-۹]/g, (digit) => String(Math.max(ARABIC_DIGITS.indexOf(digit), PERSIAN_DIGITS.indexOf(digit))))
  return caseSensitive ? text : text.toLowerCase()
}

export function isAnswered(question: TestQuestion, response: PreviewResponse) {
  if (response === undefined) return false
  if (typeof response === "string") return response.trim() !== ""
  if (Array.isArray(response)) return response.length > 0
  return Object.values(response).some(Boolean)
}

function sameSet(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false
  const set = new Set(b)
  return a.every((item) => set.has(item))
}

/** true/false for auto-graded questions; null for essays (teacher grades) and blanks are false. */
export function isCorrect(question: TestQuestion, response: PreviewResponse): boolean | null {
  if (!isAutoGraded(question.type)) return null
  if (!isAnswered(question, response)) return false
  const answer = key(question)
  switch (question.type) {
    case "single":
    case "true_false":
      return typeof response === "string" && response === answer.option_id
    case "multi":
      return Array.isArray(response) && sameSet(response, answer.option_ids ?? [])
    case "ordering": {
      const order = answer.option_ids ?? []
      return Array.isArray(response) && response.length === order.length && response.every((id, index) => id === order[index])
    }
    case "matching": {
      if (!response || typeof response !== "object" || Array.isArray(response)) return false
      const matches = answer.matches ?? {}
      return question.options.every((option) => response[option.id] === matches[option.id])
    }
    case "short_answer": {
      if (typeof response !== "string") return false
      const given = normalizeShortAnswer(response, answer.case_sensitive)
      return (answer.accepted ?? []).some((accepted) => normalizeShortAnswer(accepted, answer.case_sensitive) === given)
    }
    default:
      return null
  }
}

export type PreviewResult = {
  maxScore: number
  autoScore: number
  autoMax: number
  pendingEssays: number
  pendingPoints: number
  correct: number
  wrong: number
  blank: number
  /** null while essays await grading. */
  percent: number | null
  passed: boolean | null
}

export function scorePreview(questions: readonly TestQuestion[], responses: PreviewResponses, passPercent: number): PreviewResult {
  let autoScore = 0
  let autoMax = 0
  let pendingEssays = 0
  let pendingPoints = 0
  let correct = 0
  let wrong = 0
  let blank = 0
  for (const question of questions) {
    const response = responses[question.id]
    const answered = isAnswered(question, response)
    if (!isAutoGraded(question.type)) {
      if (answered) {
        pendingEssays += 1
        pendingPoints += question.points
      } else blank += 1
      continue
    }
    autoMax += question.points
    if (!answered) blank += 1
    else if (isCorrect(question, response)) {
      correct += 1
      autoScore += question.points
    } else wrong += 1
  }
  const maxScore = questions.reduce((sum, question) => sum + question.points, 0)
  const percent = pendingEssays > 0 || maxScore === 0 ? null : Math.round((autoScore / maxScore) * 100)
  return { maxScore, autoScore, autoMax, pendingEssays, pendingPoints, correct, wrong, blank, percent, passed: percent === null ? null : percent >= passPercent }
}

/** Deterministic-by-seed shuffle so previews can be tested. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[next[index], next[swap]] = [next[swap], next[index]]
  }
  return next
}

/** Timer announcements happen only when crossing these thresholds (seconds). */
export const ANNOUNCE_AT = [300, 120, 60] as const

export function announcementFor(previousSeconds: number, seconds: number): number | null {
  for (const threshold of ANNOUNCE_AT) if (previousSeconds > threshold && seconds <= threshold) return threshold / 60
  return null
}

export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
}

export function wordCount(text: string) {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

/** Question as laid out for the student, with option order already decided. */
export type PreviewQuestion = TestQuestion & { displayOptions: Option[]; displayRight: Option[] }

/**
 * Lay out one attempt like the student would get it: optional random pool,
 * optional question shuffle, option shuffle (ordering items are always
 * shuffled so the correct order is not given away).
 */
export function buildPreviewAttempt(questions: readonly TestQuestion[], settings: Pick<TestSettings, "shuffle_questions" | "random_pool_size">, random: () => number = Math.random): PreviewQuestion[] {
  let picked = [...questions].sort((a, b) => a.position - b.position)
  if (settings.random_pool_size !== null && settings.random_pool_size < picked.length) {
    const chosen = new Set(shuffle(picked, random).slice(0, settings.random_pool_size).map((question) => question.id))
    picked = picked.filter((question) => chosen.has(question.id))
  }
  if (settings.shuffle_questions) picked = shuffle(picked, random)
  return picked.map((question) => {
    const right = key(question).right_options ?? []
    const shuffleOptions = question.type === "ordering" || (question.shuffle_options && question.type !== "true_false")
    return {
      ...question,
      displayOptions: shuffleOptions ? shuffle(question.options, random) : [...question.options],
      displayRight: question.type === "matching" && question.shuffle_options ? shuffle(right, random) : [...right],
    }
  })
}
