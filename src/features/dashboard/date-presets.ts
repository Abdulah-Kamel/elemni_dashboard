export type RangePresetId = "7d" | "30d" | "term" | "all"
export type RangeFilters = { start?: string; end?: string }
export type RangePreset = { id: RangePresetId; start?: string; end?: string }

/** `YYYY-MM-DD` from a date's local calendar parts. */
export function toDateParam(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function daysBefore(today: Date, days: number) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - days)
}

/**
 * Start of the current Egyptian school term, used only as a date shortcut:
 * first term runs from September, second term from February (the summer
 * months stay attached to the second term).
 */
export function termStart(today: Date): Date {
  const month = today.getMonth()
  if (month >= 8) return new Date(today.getFullYear(), 8, 1)
  if (month === 0) return new Date(today.getFullYear() - 1, 8, 1)
  return new Date(today.getFullYear(), 1, 1)
}

/** Preset ranges ending today (inclusive). "all" carries no dates. */
export function rangePresets(today: Date): RangePreset[] {
  const end = toDateParam(today)
  return [
    { id: "7d", start: toDateParam(daysBefore(today, 6)), end },
    { id: "30d", start: toDateParam(daysBefore(today, 29)), end },
    { id: "term", start: toDateParam(termStart(today)), end },
    { id: "all" },
  ]
}

/** Which preset the URL range matches, or "custom". */
export function activeRange(
  filters: RangeFilters,
  presets: RangePreset[]
): RangePresetId | "custom" {
  if (!filters.start && !filters.end) return "all"
  const match = presets.find(
    (preset) =>
      preset.id !== "all" &&
      preset.start === filters.start &&
      preset.end === filters.end
  )
  return match?.id ?? "custom"
}

/** Relative dashboard URL for a range (no locale prefix). */
export function rangeHref(range: RangeFilters): string {
  const query = new URLSearchParams()
  if (range.start) query.set("start", range.start)
  if (range.end) query.set("end", range.end)
  const search = query.toString()
  return search ? `/dashboard?${search}` : "/dashboard"
}
