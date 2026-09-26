/**
 * Search normalization and ranking for the command palette. Pure functions so
 * they can be unit tested without rendering.
 */

const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g

/**
 * Case-insensitive, diacritic-insensitive form of a string. Arabic letter
 * variants users type interchangeably are folded: أ إ آ ٱ → ا, ة → ه, ى → ي.
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(ARABIC_MARKS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0
  for (const ch of haystack) {
    if (ch === needle[i]) i++
    if (i === needle.length) return true
  }
  return needle.length === 0
}

/**
 * Relevance of `query` for an item. 0 means no match; higher is better.
 * Label hits outrank keyword hits; a loose in-order letter match is the
 * weakest signal.
 */
export function matchScore(query: string, label: string, keywords = ""): number {
  const q = normalizeSearch(query)
  if (!q) return 1

  const l = normalizeSearch(label)
  if (l === q) return 100
  if (l.startsWith(q)) return 80
  if (l.split(" ").some((word) => word.startsWith(q))) return 60
  if (l.includes(q)) return 50

  const haystack = `${l} ${normalizeSearch(keywords)}`
  const tokens = q.split(" ")
  if (tokens.every((token) => haystack.includes(token))) return 30

  // Abbreviations: letters in order inside one word, starting at its first
  // letter ("crs" → "courses"), so short queries don't match everything.
  const compact = q.replace(/ /g, "")
  const words = l.split(" ")
  if (compact.length > 1 && words.some((word) => word[0] === compact[0] && isSubsequence(compact, word))) {
    return 10
  }
  return 0
}

/** Items that match, best first; ties keep their configured order. */
export function rankItems<T extends { label: string; keywords?: string }>(
  items: readonly T[],
  query: string
): T[] {
  return items
    .map((item, index) => ({ item, index, score: matchScore(query, item.label, item.keywords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item)
}
