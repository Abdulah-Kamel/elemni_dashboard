// Pure display helpers for the tests tab and grading screen. Nothing here is a
// business rule: values come from the API; these only decide how to show them.

import type { CourseTestRow, GradingQueueItem } from "./types"

export type DisplayStatus = "published" | "scheduled" | "draft" | "archived"

/** Spec §2: "scheduled" = published + opens_at in the future. */
export function displayStatus(test: Pick<CourseTestRow, "status" | "opens_at">, now = Date.now()): DisplayStatus {
  if (test.status === "published" && test.opens_at && new Date(test.opens_at).getTime() > now) return "scheduled"
  return test.status
}

export function wordCount(text: string | null | undefined): number {
  if (!text) return 0
  const words = text.trim().split(/\s+/u).filter(Boolean)
  return words.length
}

/**
 * Stable anonymous labels: each student gets a number by first appearance in
 * the full queue (oldest first). Grading only changes an item's status, never
 * its submission time, so numbers don't shift as items are graded.
 */
export function buildPseudonyms(items: Pick<GradingQueueItem, "student" | "submitted_at" | "answer_id">[]): Map<number, number> {
  const ordered = [...items].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at) || a.answer_id - b.answer_id)
  const map = new Map<number, number>()
  for (const item of ordered) if (!map.has(item.student.id)) map.set(item.student.id, map.size + 1)
  return map
}

/** Oldest submission first, stable by answer id. */
export function sortQueue<T extends Pick<GradingQueueItem, "submitted_at" | "answer_id">>(items: T[]): T[] {
  return [...items].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at) || a.answer_id - b.answer_id)
}

/**
 * Preview of the attempt total if the teacher saves `points` now. The API
 * returns the authoritative GradeResult on save; this mirrors spec §4
 * (percent = round(total / max * 100), passed = percent ≥ the test's pass %).
 */
export function previewTotal(item: Pick<GradingQueueItem, "score_rest" | "max_score" | "test">, points: number) {
  const score = item.score_rest + points
  const percent = item.max_score > 0 ? Math.round((score / item.max_score) * 100) : 0
  return { score, max: item.max_score, percent, passed: percent >= item.test.pass_percent }
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
]

export function relativeTime(iso: string, locale: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit)
  }
  return formatter.format(0, "minute")
}

export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens Arabic text correctly. */
export function toCsv(rows: string[][]): string {
  const escape = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
  return "\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n") + "\r\n"
}

// Brand amber/emerald are too light for body text on light surfaces; mixing
// with the foreground token keeps AA contrast in both light and dark themes.
export const WARNING_TEXT = "text-[color-mix(in_oklch,var(--color-warning),var(--color-foreground)_45%)]"
export const SUCCESS_TEXT = "text-[color-mix(in_oklch,var(--color-success),var(--color-foreground)_45%)]"
export const ERROR_TEXT = "text-[color-mix(in_oklch,var(--color-error),var(--color-foreground)_25%)]"
