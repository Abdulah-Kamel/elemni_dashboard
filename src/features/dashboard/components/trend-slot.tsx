/**
 * ─── TREND CHART SLOT ────────────────────────────────────────────────────
 * Revenue / subscriptions over time. There is no time-series endpoint yet,
 * so the loader always passes `null` and this renders nothing — never an
 * empty or sample chart. Wire it to the proposed
 * `GET /api/v1/teachers/me/analytics/timeseries` once the backend ships it.
 * ─────────────────────────────────────────────────────────────────────────
 */
export type TrendPoint = {
  /** Bucket start date, `YYYY-MM-DD`. */
  period_start: string
  /** Teacher earnings for the bucket, as returned by the API. */
  earnings: number
  subscriptions: number
}

export function TrendSlot({ series }: { series: TrendPoint[] | null }) {
  if (!series || series.length === 0) return null
  // Intentionally unimplemented until real data exists (see the note above).
  return null
}
