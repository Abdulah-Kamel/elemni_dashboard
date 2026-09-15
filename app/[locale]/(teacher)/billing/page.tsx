import { setRequestLocale } from "next-intl/server"
import { Placeholder } from "@/features/shell/components/placeholder"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import {
  getTeacherPayments,
  type TeacherPaymentFilters,
} from "@/features/billing/queries"
import { BillingView } from "@/features/billing/components/billing-view"
import type { ApiError } from "@/lib/api/errors"

export const dynamic = "force-dynamic"

export default async function BillingPage({
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
    return redirectToAuth(locale, `/${locale}/billing`)
  }

  const query = await searchParams
  const filters = normalizeFilters(query)

  let data
  try {
    data = await getTeacherPayments(filters)
  } catch (err) {
    if ((err as { type?: string }).type === "Unauthorized") {
      return redirectToAuth(locale, `/${locale}/billing`)
    }
    return <Placeholder state="error" error={toPageError(err)} />
  }

  return <BillingView data={data} filters={filters} locale={locale} />
}

function normalizeFilters(
  query: Record<string, string | string[] | undefined>
): TeacherPaymentFilters {
  const startDate = normalizeDate(query.start_date)
  const endDate = normalizeDate(query.end_date)
  const minAmount = normalizeMoney(query.min_amount)
  const maxAmount = normalizeMoney(query.max_amount)
  const sortBy = normalizeSort(query.sort_by)
  const sortOrder = normalizeOrder(query.sort_order)
  const limit = normalizeLimit(query.limit)
  const skip = normalizeInteger(query.skip)

  return {
    startDate,
    endDate,
    minAmount,
    maxAmount,
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
  const candidate = normalizeInteger(value)
  return candidate && candidate >= 1 && candidate <= 100 ? candidate : 20
}

function normalizeSort(
  value: string | string[] | undefined
): TeacherPaymentFilters["sortBy"] {
  return first(value) === "amount" ? "amount" : "created_at"
}

function normalizeOrder(
  value: string | string[] | undefined
): TeacherPaymentFilters["sortOrder"] {
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
