// Display-only formatting. Amounts arrive from the API as decimal strings and
// are rendered as-is in the locale's currency format — never summed or derived.

export function formatMoney(locale: string, amount: string | number, currency: string) {
  const value = typeof amount === "number" ? amount : Number(amount)
  if (!Number.isFinite(value)) return String(amount)
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value)
  } catch {
    return `${amount} ${currency}`
  }
}

export function formatDate(locale: string, iso: string, style: "medium" | "long" = "medium") {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(date)
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
]

/** "3 hours ago" / "منذ ٣ ساعات". `now` is injectable for tests. */
export function formatRelative(locale: string, iso: string, now: number = Date.now()) {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return iso
  const seconds = Math.round((time - now) / 1000)
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.trunc(seconds / size), unit)
  }
  return format.format(0, "minute")
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}
