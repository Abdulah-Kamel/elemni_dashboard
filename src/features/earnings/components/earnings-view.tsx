"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CircleDollarSign,
  Database,
  ReceiptText,
  WalletCards,
  Wallet,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { StatTile } from "@/components/ui/stat-tile"
import { SortHeader, ariaSort } from "@/components/ui/sort-header"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getTeacherUsageAction } from "@/features/earnings/actions"
import { DateRangeFilterForm } from "@/features/analytics/components/date-range-filter-form"
import type {
  PaginatedTeacherUsageLogs,
  TeacherUsageLog,
} from "@/features/earnings/schema"
import type { TeacherUsageFilters } from "@/features/earnings/queries"
import {
  EarningsPageSizeSelect,
  type EarningsPageSize,
} from "./earnings-page-size-select"
import {
  EarningsCostChart,
  type EarningsChartPoint,
} from "./earnings-cost-chart"
import { cn } from "@/lib/utils"

type EarningsViewProps = {
  data: PaginatedTeacherUsageLogs
  filters: TeacherUsageFilters
  locale: string
}

type EarningsTranslator = ReturnType<typeof useTranslations>

type LedgerSortKey = NonNullable<TeacherUsageFilters["sortBy"]>

type EarningsClientFilters = {
  startDate?: string
  endDate?: string
  minCost?: string
  maxCost?: string
  sortBy: NonNullable<TeacherUsageFilters["sortBy"]>
  sortOrder: NonNullable<TeacherUsageFilters["sortOrder"]>
}

export function EarningsView({ data, filters, locale }: EarningsViewProps) {
  const t = useTranslations("earnings")
  const tw = useTranslations("teacherWorkspace.usage")
  const initialPageSize = resolvePageSize(filters.limit)
  const [activeFilters, setActiveFilters] = useState<EarningsClientFilters>(
    () => createInitialFilters(filters)
  )
  const [pageSize, setPageSize] = useState<EarningsPageSize>(initialPageSize)
  const [page, setPage] = useState(() => getPageNumber(data))
  const [filterFormKey, setFilterFormKey] = useState(0)
  const requestFilters = useMemo(
    () => ({
      ...activeFilters,
      skip: pageSize === "all" ? 0 : Math.max(0, (page - 1) * pageSize),
      limit: pageSize,
    }),
    [activeFilters, page, pageSize]
  )
  const requestKey = JSON.stringify(requestFilters)
  const urlQuery = toUrlQuery(requestFilters)
  useEffect(() => {
    // Keep the address bar shareable; the server page parses the same params.
    const url = `${window.location.pathname}${urlQuery ? `?${urlQuery}` : ""}`
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", url)
    }
  }, [urlQuery])
  const [initialRequestKey] = useState(requestKey)
  const usageQuery = useQuery({
    queryKey: ["teacher-usage", requestFilters],
    queryFn: () => getTeacherUsageAction(requestFilters),
    initialData: initialRequestKey === requestKey ? data : undefined,
    placeholderData: keepPreviousData,
  })
  const displayedData = usageQuery.data ?? data
  const isLoadingData = usageQuery.isPending || usageQuery.isFetching
  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const pageCount = Math.max(
    1,
    Math.ceil(displayedData.total / displayedData.limit)
  )
  const chartItems = [...displayedData.items]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-12)
  const chartData: EarningsChartPoint[] = chartItems.map((item) => ({
    date: item.date,
    label: formatShortDate(item.date, locale),
    cost: item.cost_amount,
  }))

  function handleDateRangeApply(range: { start?: string; end?: string }) {
    setActiveFilters((current) => ({
      ...current,
      startDate: range.start,
      endDate: range.end,
    }))
    setPage(1)
  }

  function handleDateRangeReset() {
    setActiveFilters((current) => ({
      ...current,
      startDate: undefined,
      endDate: undefined,
    }))
    setPage(1)
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    setActiveFilters((current) => ({
      ...current,
      minCost: normalizeMoneyInput(readFormValue(formData, "min_cost")),
      maxCost: normalizeMoneyInput(readFormValue(formData, "max_cost")),
    }))
    setPage(1)
  }

  // Server-side sort: the ledger is paginated by the API, so sorting a page
  // locally would be misleading. A new column starts with the largest/newest.
  function handleSort(column: LedgerSortKey) {
    setActiveFilters((current) => ({
      ...current,
      sortBy: column,
      sortOrder:
        current.sortBy === column
          ? current.sortOrder === "desc"
            ? "asc"
            : "desc"
          : "desc",
    }))
    setPage(1)
  }

  const ledgerSort = {
    key: activeFilters.sortBy,
    direction: activeFilters.sortOrder,
  }
  const hasFilters = Boolean(
    activeFilters.startDate ||
      activeFilters.endDate ||
      activeFilters.minCost ||
      activeFilters.maxCost
  )

  function handleFilterReset() {
    setActiveFilters(createResetFilters())
    setPage(1)
    setFilterFormKey((key) => key + 1)
  }

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-md font-bold text-on-surface">
          {tw("title")}
        </h1>
        <p className="text-sm text-on-surface-muted">{t("subtitle")}</p>
      </header>

      <section
        className="grid grid-cols-2 gap-3 xl:grid-cols-5"
        aria-labelledby="earnings-summary-title"
      >
        <h2 id="earnings-summary-title" className="sr-only">
          {t("summary_title")}
        </h2>
        <StatTile
          label={t("pending_dues")}
          value={formatCurrency(displayedData.summary.pending_dues, currency)}
          hint={tw("balance_hint")}
          icon={Wallet}
          tone="primary"
          className="col-span-2 xl:col-span-1"
        />
        <StatTile
          label={t("summary.filtered_cost")}
          value={
            isLoadingData ? (
              <TileSkeleton />
            ) : (
              formatCurrency(displayedData.summary.total_cost, currency)
            )
          }
          hint={tw("period_hint")}
          icon={CircleDollarSign}
        />
        <StatTile
          label={t("summary.bandwidth_cost")}
          value={
            isLoadingData ? (
              <TileSkeleton />
            ) : (
              formatCurrency(displayedData.summary.total_bandwidth_cost, currency)
            )
          }
          hint={tw("period_hint")}
          icon={Activity}
        />
        <StatTile
          label={t("summary.storage_cost")}
          value={
            isLoadingData ? (
              <TileSkeleton />
            ) : (
              formatCurrency(displayedData.summary.total_storage_cost, currency)
            )
          }
          hint={tw("period_hint")}
          icon={Database}
        />
        <StatTile
          label={t("summary.storage_now")}
          value={
            isLoadingData ? (
              <TileSkeleton />
            ) : displayedData.summary.storage_used_mb == null ? (
              t("not_available")
            ) : (
              `${number.format(displayedData.summary.storage_used_mb)} ${t("units.mb")}`
            )
          }
          hint={tw("storage_now_hint")}
          icon={WalletCards}
        />
      </section>

      {isLoadingData || chartData.length > 0 ? (
      <Card
        className="animate-slide-up overflow-hidden rounded-xl border-border"
        aria-labelledby="earnings-chart-title"
        aria-busy={isLoadingData}
      >
        <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle
                id="earnings-chart-title"
                className="text-base font-semibold"
              >
                {t("chart.title")}
              </CardTitle>
              <CardDescription className="mt-0.5 text-sm">
                {t("chart.subtitle")}
              </CardDescription>
            </div>
            <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
              {t("chart.badge")}
            </Badge>
          </div>
        </CardHeader>
        {isLoadingData ? (
          <ChartSkeleton label={t("ledger.refreshing")} />
        ) : (
          <EarningsCostChart
            data={chartData}
            ariaLabel={t("chart.label")}
            costLabel={t("chart.cost")}
            locale={locale}
          />
        )}
      </Card>
      ) : null}

      <Card
        className="animate-slide-up overflow-hidden rounded-xl border-border"
        aria-labelledby="earnings-ledger-title"
        aria-busy={isLoadingData}
      >
        <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle
                id="earnings-ledger-title"
                className="text-base font-semibold"
              >
                {t("ledger.title")}
              </CardTitle>
              <CardDescription className="mt-0.5 text-sm">
                {t("ledger.subtitle")}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="shrink-0 gap-1.5">
              <ReceiptText className="size-3.5" aria-hidden="true" />
              {t("ledger.entries", { count: displayedData.total })}
            </Badge>
          </div>
        </CardHeader>

        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1.3fr)_repeat(2,minmax(0,1fr))_auto]">
          <div className="grid min-w-0 gap-1.5">
            <Label
              htmlFor="earnings-date-range"
              className="text-label-md font-medium text-on-surface-muted"
            >
              {t("filters.range")}
            </Label>
            <DateRangeFilterForm
              filters={{
                start: activeFilters.startDate,
                end: activeFilters.endDate,
              }}
               basePath="/usage"
              startParam="start_date"
              endParam="end_date"
              hiddenFields={{
                min_cost: activeFilters.minCost,
                max_cost: activeFilters.maxCost,
                sort_by: activeFilters.sortBy,
                sort_order: activeFilters.sortOrder,
                limit: pageSize,
              }}
              className="min-w-0"
              triggerId="earnings-date-range"
              triggerClassName="h-9 min-w-0 px-3 text-body-md sm:w-full sm:min-w-0"
              onApply={handleDateRangeApply}
              onReset={handleDateRangeReset}
              labels={{
                range: t("filters.range"),
                allTime: t("filters.all_time"),
                choose: t("filters.choose"),
                dialogTitle: t("filters.dialog_title"),
                dialogDescription: t("filters.dialog_description"),
                apply: t("filters.apply"),
                reset: t("filters.reset"),
                cancel: t("filters.cancel"),
              }}
            />
          </div>

          <form
            key={filterFormKey}
            className="contents"
            method="get"
            onSubmit={handleFilterSubmit}
          >
            <Input
              type="hidden"
              name="start_date"
              value={activeFilters.startDate ?? ""}
              readOnly
            />
            <Input
              type="hidden"
              name="end_date"
              value={activeFilters.endDate ?? ""}
              readOnly
            />
            <FilterField id="earnings-min-cost" label={t("filters.min_cost")}>
              <Input
                id="earnings-min-cost"
                className=" h-9 bg-surface text-body-md"
                type="number"
                name="min_cost"
                min="0"
                step="0.01"
                placeholder="0.00"
                defaultValue={activeFilters.minCost}
              />
            </FilterField>
            <FilterField id="earnings-max-cost" label={t("filters.max_cost")}>
              <Input
                id="earnings-max-cost"
                className=" h-9 bg-surface text-body-md"
                type="number"
                name="max_cost"
                min="0"
                step="0.01"
                placeholder="0.00"
                defaultValue={activeFilters.maxCost}
              />
            </FilterField>
            <Input type="hidden" name="limit" value={String(pageSize)} />
            <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
              <Button type="submit" size="sm" className="flex-1 xl:flex-none">
                {t("filters.apply")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleFilterReset}
                className="flex-1 xl:flex-none"
              >
                {t("filters.reset")}
              </Button>
            </div>
          </form>
        </div>

        {usageQuery.isError ? (
          <div
            className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-body-md font-medium text-destructive sm:mx-5"
            role="alert"
          >
            <span>{t("ledger.refresh_error")}</span>
            <Button
              variant="outline"
              size="xs"
              type="button"
              onClick={() => void usageQuery.refetch()}
              disabled={usageQuery.isFetching}
            >
              {t("ledger.retry")}
            </Button>
          </div>
        ) : null}

        <div className="transition-opacity" aria-busy={isLoadingData}>
          {isLoadingData ? (
            <LedgerSkeleton
              label={t("ledger.refreshing")}
              rows={pageSize === "all" ? 7 : Math.min(pageSize, 7)}
            />
          ) : displayedData.items.length > 0 ? (
            <Table className="min-w-[42rem]">
              <TableCaption className="px-5 pb-3 text-start text-label-sm leading-5 text-on-surface-muted">
                {t("ledger.caption")}
              </TableCaption>
              <TableHeader className="bg-surface-muted">
                <TableRow>
                  <LedgerHead column="date" label={t("ledger.date")} sort={ledgerSort} onSort={handleSort} />
                  <LedgerHead column="bandwidth_bytes" label={t("ledger.bandwidth")} sort={ledgerSort} onSort={handleSort} />
                  <LedgerHead column="storage_bytes" label={t("ledger.storage")} sort={ledgerSort} onSort={handleSort} />
                  <TableHead className="px-5 py-3 text-label-md leading-5 font-semibold text-on-surface-muted">
                    {t("ledger.bandwidth_cost")}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-label-md leading-5 font-semibold text-on-surface-muted">
                    {t("ledger.storage_cost")}
                  </TableHead>
                  <LedgerHead column="cost_amount" label={t("ledger.total")} sort={ledgerSort} onSort={handleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedData.items.map((item) => (
                  <UsageRow
                    key={item.id}
                    item={item}
                    locale={locale}
                    currency={currency}
                    t={t}
                  />
                ))}
              </TableBody>
            </Table>
          ) : hasFilters ? (
            <EmptyState
              icon={CalendarDays}
              title={t("empty.title")}
              note={t("empty.note")}
              action={
                <Button variant="outline" size="sm" type="button" onClick={handleFilterReset}>
                  {t("filters.reset")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Activity}
              title={tw("empty_none_title")}
              note={tw("empty_none_note")}
            />
          )}

          <Pagination
            page={page}
            pages={pageCount}
            total={displayedData.total}
            pageSize={pageSize}
            loading={isLoadingData}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setPage(1)
            }}
            t={t}
          />
        </div>
      </Card>
    </div>
  )
}

function FilterField({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label
        htmlFor={id}
        className="text-label-md font-medium text-on-surface-muted"
      >
        {label}
      </Label>
      {children}
    </div>
  )
}

function ChartSkeleton({ label }: { label: string }) {
  const barHeights = [
    "h-16",
    "h-24",
    "h-20",
    "h-32",
    "h-28",
    "h-36",
    "h-24",
    "h-30",
  ]

  return (
    <div
      className="h-72 min-h-64 w-full p-5 sm:h-80"
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div
        className="flex h-full items-end gap-3 rounded-xl border border-border/60 bg-surface-muted/40 px-4 pt-4 pb-8"
        aria-hidden="true"
      >
        {barHeights.map((height, index) => (
          <Skeleton
            key={`${height}-${index}`}
            className={cn(
              "w-full rounded-t-md rounded-b-none motion-reduce:animate-none",
              height
            )}
          />
        ))}
      </div>
    </div>
  )
}

function LedgerSkeleton({ label, rows }: { label: string; rows: number }) {
  return (
    <div className="overflow-x-auto" role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="min-w-[42rem] p-5" aria-hidden="true">
        <div className="grid grid-cols-6 gap-4 border-b border-border pb-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={`header-${index}`}
              className="h-3 w-20 motion-reduce:animate-none"
            />
          ))}
        </div>
        <div className="space-y-3 pt-3">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }, (_, columnIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${columnIndex}`}
                  className={cn(
                    "h-4 motion-reduce:animate-none",
                    columnIndex === 0 ? "w-24" : "w-20"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UsageRow({
  item,
  locale,
  currency,
  t,
}: {
  item: TeacherUsageLog
  locale: string
  currency: Intl.NumberFormat
  t: EarningsTranslator
}) {
  return (
    <TableRow>
      <TableCell className="px-5 py-3 text-body-md font-medium tabular-nums">
        {formatDate(item.date, locale)}
      </TableCell>
      <TableCell className="px-5 py-3 text-body-md text-on-surface-muted tabular-nums">
        {formatBytes(item.bandwidth_bytes, locale, t)}
      </TableCell>
      <TableCell className="px-5 py-3 text-body-md text-on-surface-muted tabular-nums">
        {formatBytes(item.storage_bytes, locale, t)}
      </TableCell>
      <TableCell className="px-5 py-3 text-body-md tabular-nums">
        {formatCurrency(item.bandwidth_cost_amount, currency)}
      </TableCell>
      <TableCell className="px-5 py-3 text-body-md tabular-nums">
        {formatCurrency(item.storage_cost_amount, currency)}
      </TableCell>
      <TableCell className="px-5 py-3 text-body-md font-semibold text-primary tabular-nums">
        {formatCurrency(item.cost_amount, currency)}
      </TableCell>
    </TableRow>
  )
}

function EmptyState({
  icon: Icon,
  title,
  note,
  action,
}: {
  icon: typeof Activity
  title: string
  note: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-60 items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <p className="mt-3 text-title-md font-semibold text-foreground">
          {title}
        </p>
        <p className="mx-auto mt-1 max-w-[32rem] text-body-md text-on-surface-muted">
          {note}
        </p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  )
}

function Pagination({
  page,
  pages,
  total,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  t,
}: {
  page: number
  pages: number
  total: number
  pageSize: EarningsPageSize
  loading: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: EarningsPageSize) => void
  t: EarningsTranslator
}) {
  const rowsPerPage = pageSize === "all" ? Math.max(total, 1) : pageSize
  const from = total === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const to = Math.min(page * rowsPerPage, total)

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-body-md text-on-surface-muted">
          {t("ledger.showing", { from, to, total })}
        </p>
        <EarningsPageSizeSelect
          value={pageSize}
          label={t("ledger.rows_per_page")}
          options={{
            ten: "10",
            twentyFive: "25",
            fifty: "50",
            oneHundred: "100",
            all: t("ledger.all"),
          }}
          disabled={loading}
          onChange={onPageSizeChange}
        />
      </div>
      <nav
        className="flex items-center gap-2"
        aria-label={t("ledger.pagination")}
      >
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ArrowUp
            className="me-1 size-3.5 rotate-[-90deg]"
            aria-hidden="true"
          />
          {t("ledger.previous")}
        </Button>
        <span className="min-w-16 text-center text-body-md font-medium text-on-surface-muted tabular-nums">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={loading || page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("ledger.next")}
          <ArrowDown
            className="ms-1 size-3.5 rotate-[-90deg]"
            aria-hidden="true"
          />
        </Button>
      </nav>
    </div>
  )
}

function resolvePageSize(
  limit: TeacherUsageFilters["limit"]
): EarningsPageSize {
  return limit === "all" || limit === 25 || limit === 50 || limit === 100
    ? limit
    : 10
}

function createInitialFilters(
  filters: TeacherUsageFilters
): EarningsClientFilters {
  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
    minCost: filters.minCost,
    maxCost: filters.maxCost,
    sortBy: filters.sortBy ?? "date",
    sortOrder: filters.sortOrder ?? "desc",
  }
}

function createResetFilters(): EarningsClientFilters {
  return {
    startDate: undefined,
    endDate: undefined,
    minCost: undefined,
    maxCost: undefined,
    sortBy: "date",
    sortOrder: "desc",
  }
}

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value : undefined
}

function normalizeMoneyInput(value?: string) {
  const candidate = value?.trim()
  return candidate && /^(?:\d+)(?:\.\d{1,2})?$/.test(candidate)
    ? candidate
    : undefined
}

function getPageNumber(data: PaginatedTeacherUsageLogs) {
  return Math.floor(data.skip / data.limit) + 1
}

function formatCurrency(value: number | null, currency: Intl.NumberFormat) {
  return value == null ? "—" : currency.format(value)
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

function formatShortDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`))
}

function formatBytes(value: number, locale: string, t: EarningsTranslator) {
  const units = [
    { threshold: 1024 ** 3, divisor: 1024 ** 3, label: t("units.gb") },
    { threshold: 1024 ** 2, divisor: 1024 ** 2, label: t("units.mb") },
    { threshold: 1024, divisor: 1024, label: t("units.kb") },
  ]
  const unit = units.find((candidate) => value >= candidate.threshold)
  if (!unit) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} ${t("units.bytes")}`
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / unit.divisor)} ${unit.label}`
}

function LedgerHead({
  column,
  label,
  sort,
  onSort,
}: {
  column: LedgerSortKey
  label: string
  sort: { key: LedgerSortKey; direction: "asc" | "desc" }
  onSort: (column: LedgerSortKey) => void
}) {
  return (
    <TableHead
      className="px-5 py-3 text-label-md leading-5 font-semibold text-on-surface-muted"
      aria-sort={ariaSort(sort, column)}
    >
      <SortHeader label={label} column={column} sort={sort} onSort={onSort} />
    </TableHead>
  )
}

function TileSkeleton() {
  return <Skeleton className="h-7 w-28 motion-reduce:animate-none" />
}

/** Same param names the server page parses, defaults omitted. */
function toUrlQuery(filters: TeacherUsageFilters) {
  const params = new URLSearchParams()
  if (filters.startDate) params.set("start_date", filters.startDate)
  if (filters.endDate) params.set("end_date", filters.endDate)
  if (filters.minCost) params.set("min_cost", filters.minCost)
  if (filters.maxCost) params.set("max_cost", filters.maxCost)
  if (filters.sortBy && filters.sortBy !== "date") params.set("sort_by", filters.sortBy)
  if (filters.sortOrder === "asc") params.set("sort_order", "asc")
  if (filters.limit != null && filters.limit !== 10) params.set("limit", String(filters.limit))
  if (filters.skip) params.set("skip", String(filters.skip))
  return params.toString()
}
