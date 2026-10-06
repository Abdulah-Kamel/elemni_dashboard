export const MAX_WATCH_LIMIT = 1000

export function parseWatchLimit(input: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = input.trim()
  if (trimmed === "") return { ok: true, value: null }
  if (!/^\d+$/.test(trimmed)) return { ok: false }
  const value = Number(trimmed)
  return value >= 1 && value <= MAX_WATCH_LIMIT ? { ok: true, value } : { ok: false }
}
