"use client"

import { useMemo, useState, type FormEvent } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getTeacherPaymentsAction } from "@/features/billing/actions"
import type {
  PaginatedTeacherPayments,
  TeacherPaymentLog,
} from "@/features/billing/schema"
import type { TeacherPaymentFilters } from "@/features/billing/queries"

type BillingViewProps = {
  data: PaginatedTeacherPayments
  filters: TeacherPaymentFilters
  locale: string
}

const PAGE_SIZE = 20

export function BillingView({ data, filters, locale }: BillingViewProps) {
  const t = useTranslations("billing")
  const activeLocale = useLocale()
  const displayLocale = locale || activeLocale
  const [activeFilters, setActiveFilters] = useState<TeacherPaymentFilters>(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      sortBy: filters.sortBy ?? "created_at",
      sortOrder: filters.sortOrder ?? "desc",
    })
  )
  const [page, setPage] = useState(() =>
    filters.skip && filters.limit
      ? Math.floor(filters.skip / filters.limit) + 1
      : 1
  )
  const requestFilters = useMemo(
    () => ({
      ...activeFilters,
      skip: Math.max(0, (page - 1) * PAGE_SIZE),
      limit: PAGE_SIZE,
    }),
    [activeFilters, page]
  )
  const requestKey = JSON.stringify(requestFilters)
  const [initialRequestKey] = useState(requestKey)
  const paymentsQuery = useQuery({
    queryKey: ["teacher-payments", requestFilters],
    queryFn: () => getTeacherPaymentsAction(requestFilters),
    initialData: initialRequestKey === requestKey ? data : undefined,
    placeholderData: keepPreviousData,
  })
  const displayed = paymentsQuery.data ?? data
  const currency = new Intl.NumberFormat(displayLocale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setActiveFilters((current) => ({
      ...current,
      startDate: readValue(formData, "start_date") || undefined,
      endDate: readValue(formData, "end_date") || undefined,
      minAmount: readValue(formData, "min_amount") || undefined,
      maxAmount: readValue(formData, "max_amount") || undefined,
      sortBy: readValue(formData, "sort_by") === "amount" ? "amount" : "created_at",
      sortOrder: readValue(formData, "sort_order") === "asc" ? "asc" : "desc",
    }))
    setPage(1)
  }

  function handleReset() {
    setActiveFilters({ sortBy: "created_at", sortOrder: "desc" })
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(displayed.total / displayed.limit))
  const from = displayed.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, displayed.total)

  return (
    <div className="flex flex-col gap-xl">
      <section
        className="grid overflow-hidden rounded-2xl border border-border bg-surface shadow-xs sm:grid-cols-3"
        aria-label={t("summary_title")}
      >
        <div className="min-w-0 p-5" data-testid="billing-pending-dues">
          <p className="text-label-md font-medium text-on-surface-muted">
            {t("pending_dues")}
          </p>
          <p className="mt-1 font-heading text-headline-sm font-semibold tabular-nums">
            {formatMoney(displayed.pending_dues, currency)}
          </p>
        </div>
        <div
          className="min-w-0 border-s border-border p-5"
          data-testid="billing-total-paid"
        >
          <p className="text-label-md font-medium text-on-surface-muted">
            {t("total_paid")}
          </p>
          <p className="mt-1 font-heading text-headline-sm font-semibold tabular-nums">
            {formatMoney(displayed.total_paid, currency)}
          </p>
        </div>
        <div
          className="min-w-0 border-s border-t border-border p-5 sm:border-t-0"
          data-testid="billing-filtered-sum"
        >
          <p className="text-label-md font-medium text-on-surface-muted">
            {t("filtered_sum")}
          </p>
          <p className="mt-1 font-heading text-headline-sm font-semibold text-primary tabular-nums">
            {formatMoney(displayed.total_paid_sum, currency)}
          </p>
        </div>
      </section>

      <Card className="overflow-hidden rounded-2xl border-border shadow-xs">
        <CardHeader className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="font-heading text-headline-sm font-semibold">
                {t("ledger.title")}
              </CardTitle>
              <p className="mt-1 text-body-lg text-on-surface-muted">
                {t("ledger.subtitle")}
              </p>
            </div>
            <Badge variant="secondary">
              {t("ledger.entries", { count: displayed.total })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-7"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="billing-start">{t("filters.start")}</Label>
              <Input
                id="billing-start"
                type="date"
                name="start_date"
                defaultValue={activeFilters.startDate ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="billing-end">{t("filters.end")}</Label>
              <Input
                id="billing-end"
                type="date"
                name="end_date"
                defaultValue={activeFilters.endDate ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="billing-min">{t("filters.min_amount")}</Label>
              <Input
                id="billing-min"
                type="number"
                name="min_amount"
                min="0"
                step="0.01"
                defaultValue={activeFilters.minAmount ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="billing-max">{t("filters.max_amount")}</Label>
              <Input
                id="billing-max"
                type="number"
                name="max_amount"
                min="0"
                step="0.01"
                defaultValue={activeFilters.maxAmount ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="billing-sort">{t("filters.sort")}</Label>
              <select
                id="billing-sort"
                name="sort_by"
                defaultValue={activeFilters.sortBy ?? "created_at"}
                className="h-9 rounded-lg border border-border bg-surface px-3 text-sm"
              >
                <option value="created_at">{t("filters.sort_created")}</option>
                <option value="amount">{t("filters.sort_amount")}</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="billing-order">{t("filters.order")}</Label>
              <select
                id="billing-order"
                name="sort_order"
                defaultValue={activeFilters.sortOrder ?? "desc"}
                className="h-9 rounded-lg border border-border bg-surface px-3 text-sm"
              >
                <option value="desc">{t("filters.desc")}</option>
                <option value="asc">{t("filters.asc")}</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm" className="flex-1">
                {t("filters.apply")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                {t("filters.reset")}
              </Button>
            </div>
          </form>

          {displayed.items.length > 0 ? (
            <Table className="min-w-[40rem]">
              <TableHeader className="bg-surface-muted">
                <TableRow>
                  <TableHead className="px-5 py-3">{t("ledger.amount")}</TableHead>
                  <TableHead className="px-5 py-3">{t("ledger.date")}</TableHead>
                  <TableHead className="px-5 py-3">{t("ledger.admin")}</TableHead>
                  <TableHead className="px-5 py-3">{t("ledger.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.items.map((item) => (
                  <PaymentRow
                    key={item.id}
                    item={item}
                    displayLocale={displayLocale}
                    currency={currency}
                    notAvailable={t("not_available")}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-8 text-center text-body-md text-on-surface-muted">
              {t("empty.title")}
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-md text-on-surface-muted">
              {t("ledger.showing", { from, to, total: displayed.total })}
            </p>
            <nav className="flex items-center gap-2" aria-label={t("ledger.pagination")}>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                {t("ledger.previous")}
              </Button>
              <span className="min-w-16 text-center text-body-md tabular-nums">
                {page} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                {t("ledger.next")}
              </Button>
            </nav>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PaymentRow({
  item,
  displayLocale,
  currency,
  notAvailable,
}: {
  item: TeacherPaymentLog
  displayLocale: string
  currency: Intl.NumberFormat
  notAvailable: string
}) {
  return (
    <TableRow>
      <TableCell className="px-5 py-3 font-semibold text-primary tabular-nums" dir="ltr">
        {currency.format(item.amount)}
      </TableCell>
      <TableCell className="px-5 py-3 tabular-nums">
        {new Intl.DateTimeFormat(displayLocale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(item.created_at))}
      </TableCell>
      <TableCell className="px-5 py-3">
        {item.admin_name ?? notAvailable}
      </TableCell>
      <TableCell className="px-5 py-3 text-on-surface-muted">
        {item.note ?? notAvailable}
      </TableCell>
    </TableRow>
  )
}

function readValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function formatMoney(value: number | null, currency: Intl.NumberFormat) {
  return value == null ? "—" : currency.format(value)
}
