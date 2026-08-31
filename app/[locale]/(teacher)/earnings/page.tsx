import { setRequestLocale } from "next-intl/server"
import { Placeholder } from "@/features/shell/components/placeholder"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import {
  getTeacherUsage,
  type TeacherUsageFilters,
} from "@/features/earnings/queries"
import { EarningsView } from "@/features/earnings/components/earnings-view"
import type { ApiError } from "@/lib/api/errors"

export const dynamic = "force-dynamic"

export default async function EarningsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await verifySession()
  if (!user) {
    return redirectToAuth(locale, `/${locale}/earnings`)
  }

  const query = await searchParams
  const filters = normalizeFilters(query)

  let data
  try {
    data = await getTeacherUsage(filters)
  } catch (err) {
    if ((err as { type?: string }).type === "Unauthorized") {
      return redirectToAuth(locale, `/${locale}/earnings`)
    }
    return <Placeholder state="error" error={toPageError(err)} />
  }

  return <EarningsView data={data} filters={filters} locale={locale} />
}

function normalizeFilters(
  query: Record<string, string | string[] | undefined>
): TeacherUsageFilters {
  const startDate = normalizeDate(query.start_date)
  const endDate = normalizeDate(query.end_date)
  const minCost = normalizeMoney(query.min_cost)
  const maxCost = normalizeMoney(query.max_cost)
  const sortBy = normalizeSort(query.sort_by)
  const sortOrder = normalizeOrder(query.sort_order)
  const limit = normalizeLimit(query.limit)
  const skip = limit === "all" ? 0 : normalizeInteger(query.skip)

  return {
    startDate,
    endDate,
    minCost,
    maxCost,
    sortBy,
    sortOrder,
    skip,
    limit,
  }
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeDate(value: string | string[] | undefined) {
  const candidate = first(value)
  return candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)
    ? candidate
    : undefined
}

function normalizeMoney(value: string | string[] | undefined) {
  const candidate = first(value)?.trim()
  return candidate && /^(?:\d+)(?:\.\d{1,2})?$/.test(candidate)
    ? candidate
    : undefined
}

function normalizeInteger(value: string | string[] | undefined) {
  const candidate = Number(first(value))
  return Number.isInteger(candidate) && candidate >= 0 ? candidate : undefined
}

function normalizeLimit(value: string | string[] | undefined) {
  if (first(value) === "all") return "all" as const
  const candidate = normalizeInteger(value)
  return candidate && [10, 25, 50, 100].includes(candidate) ? candidate : 10
}

function normalizeSort(
  value: string | string[] | undefined
): TeacherUsageFilters["sortBy"] {
  const candidate = first(value)
  return candidate === "cost_amount" ||
    candidate === "bandwidth_bytes" ||
    candidate === "storage_bytes"
    ? candidate
    : "date"
}

function normalizeOrder(
  value: string | string[] | undefined
): TeacherUsageFilters["sortOrder"] {
  return first(value) === "asc" ? "asc" : "desc"
}

function toPageError(err: unknown): ApiError {
  const error = err as Error & {
    type?: ApiError["type"]
    status?: number
  }

  return {
    type: error.type ?? "Upstream",
    status: error.status ?? 0,
    message: error.message ?? "Error",
  } as ApiError
}
