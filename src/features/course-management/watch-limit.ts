export function parseWatchLimit(input: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = input.trim()
  if (trimmed === "") return { ok: true, value: null }
  if (!/^\d+$/.test(trimmed)) return { ok: false }
  const value = Number(trimmed)
  return Number.isSafeInteger(value) && value >= 1 ? { ok: true, value } : { ok: false }
}
