/** Localized date-time for display ("الأحد 28/09 · 10:00 ص"); Latin digits like the designs. */
export function formatDateTime(iso: string | null, locale: string) {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const tag = `${locale}-u-nu-latn`
  const day = new Intl.DateTimeFormat(tag, { weekday: "long" }).format(date)
  const dayMonth = new Intl.DateTimeFormat(tag, { day: "2-digit", month: "2-digit" }).format(date)
  const time = new Intl.DateTimeFormat(tag, { hour: "numeric", minute: "2-digit" }).format(date)
  return `${day} ${dayMonth} · ${time}`
}
