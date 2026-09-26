export type RelativeParts = {
  value: number
  unit: Intl.RelativeTimeFormatUnit
}

const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["minute", 60],
  ["hour", 60 * 60],
  ["day", 60 * 60 * 24],
  ["week", 60 * 60 * 24 * 7],
  ["month", 60 * 60 * 24 * 30],
  ["year", 60 * 60 * 24 * 365],
]

/** Largest whole unit between `date` and `now`; negative values are in the past. */
export function relativeParts(date: Date, now: Date): RelativeParts {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return { value: 0, unit: "minute" }
  let chosen = steps[0]
  for (const step of steps) {
    if (abs >= step[1]) chosen = step
  }
  const [unit, size] = chosen
  return { value: Math.trunc(seconds / size), unit }
}

export function formatRelative(date: Date, now: Date, locale: string) {
  const { value, unit } = relativeParts(date, now)
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(value, unit)
}
