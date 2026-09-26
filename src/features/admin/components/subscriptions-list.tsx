"use client"

import { useCallback } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { DashboardPagination } from "@/components/dashboard-pagination"
import { SortHeader, ariaSort } from "@/components/ui/sort-header"
import { PaymentStatusBadge } from "@/features/billing/components/payment-status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { nextSort, sortRows } from "@/lib/sort"
import { listSubscriptionsAction } from "../actions"
import { adminKeys } from "../query-keys"
import { formatDate, formatMoney } from "../format"
import { useDebouncedSearch, useUrlFilters } from "../hooks/use-url-filters"
import {
  parseSubscriptionFilters,
  serializeSubscriptionFilters,
  type PaymentStatusFilter,
  type SubscriptionSortKey,
} from "../url-state"
import type { AdminSubscriptionPage } from "../schema"
import {
  FilterBar,
  FilteredEmpty,
  ListError,
  PageSortNote,
  SearchField,
  Segmented,
  TableSkeleton,
  rowOpenProps,
} from "./list-controls"
import { SubscriptionSheet } from "./subscription-sheet"

const PAGE_SIZE = 10

type Subscription = AdminSubscriptionPage["items"][number]

const accessors: Record<SubscriptionSortKey, (row: Subscription) => string | number | null> = {
  student: (row) => row.student_name,
  course: (row) => row.course.title,
  status: (row) => row.payment_status,
  // Ordering only — the displayed amount is always the API string.
  amount: (row) => Number(row.total_paid),
  date: (row) => new Date(row.purchased_at).getTime(),
}

const STATUS_KEYS: Record<Exclude<PaymentStatusFilter, "all">, string> = {
  completed: "payment_completed",
  pending: "payment_pending",
  failed: "payment_failed",
  cancelled: "payment_cancelled",
  refunded: "payment_refunded",
  duplicate_paid: "payment_duplicate_paid",
}

export function SubscriptionsList({
  teacherProfileId,
}: {
  teacherProfileId?: number
}) {
  const t = useTranslations("admin")
  const locale = useLocale()
  const embedded = teacherProfileId !== undefined
  const [filters, update] = useUrlFilters(parseSubscriptionFilters, serializeSubscriptionFilters, { sync: !embedded })
  const commitSearch = useCallback((q: string) => update({ q, page: 1 }), [update])
  const [search, setSearch] = useDebouncedSearch(filters.q, commitSearch)
  const params = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.q || undefined,
    paymentStatus: filters.status,
    teacherProfileId,
  }
  const query = useQuery({
    queryKey: adminKeys.subscriptions(params),
    queryFn: () => listSubscriptionsAction(params),
    placeholderData: keepPreviousData,
  })
  const total = query.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rows = sortRows(query.data?.items ?? [], filters.sort, accessors, locale)
  const activeFilterCount = [filters.q, filters.status !== "completed"].filter(Boolean).length
  const clearFilters = () => update({ q: "", status: "completed", page: 1 })
  const sortBy = (key: SubscriptionSortKey) => update({ sort: nextSort(filters.sort, key) })
  const view = (id: number) => update({ view: id })
  const head = (key: SubscriptionSortKey, label: string, className?: string) => (
    <TableHead className={className ?? "px-4 py-2.5"} aria-sort={ariaSort(filters.sort, key)}>
      <SortHeader label={label} column={key} sort={filters.sort} onSort={sortBy} />
    </TableHead>
  )

  return (
    <div className="flex flex-col gap-lg">
      {!embedded && (
        <header className="animate-slide-up">
          <h1 className="text-headline-md font-semibold">
            {t("title_subscriptions")}
          </h1>
          <p className="mt-1 text-on-surface-muted" aria-live="polite">
            {t("subscriptions_count", { count: total })}
          </p>
        </header>
      )}
      <FilterBar activeCount={activeFilterCount} onClear={clearFilters}>
        <SearchField value={search} onChange={setSearch} placeholder={t("search_subscriptions")} />
        <div className="max-w-full overflow-x-auto">
          <Segmented<PaymentStatusFilter>
            label={t("table_status")}
            value={filters.status}
            onChange={(status) => update({ status, page: 1 })}
            options={[
              ...(Object.keys(STATUS_KEYS) as (keyof typeof STATUS_KEYS)[]).map((value) => ({
                value,
                label: t(STATUS_KEYS[value]),
              })),
              { value: "all" as const, label: t("status_all") },
            ]}
          />
        </div>
      </FilterBar>
      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ListError onRetry={() => query.refetch()} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <FilteredEmpty filtered={activeFilterCount > 0} onClear={clearFilters} />
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl border border-border bg-surface transition-opacity data-[stale=true]:opacity-70"
          data-stale={query.isPlaceholderData}
          aria-busy={query.isFetching}
        >
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader className="bg-surface-muted text-on-surface-muted">
                <TableRow className="hover:bg-transparent">
                  {head("student", t("table_student"))}
                  {head("course", t("table_course"))}
                  {head("status", t("table_status"))}
                  {head("amount", t("table_amount"), "px-4 py-2.5 text-end")}
                  {head("date", t("table_date"))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.enrollment_id} {...rowOpenProps(() => view(item.enrollment_id), filters.view === item.enrollment_id)}>
                    <TableCell className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => view(item.enrollment_id)}
                        className="rounded-sm text-start font-medium hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        {item.student_name}
                      </button>
                      <p className="text-xs text-on-surface-muted">
                        {item.student_email}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      {item.course.title}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <PaymentStatusBadge status={item.payment_status} />
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-end font-semibold tabular-nums">
                      <span dir="ltr">{formatMoney(locale, item.total_paid, item.currency)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 whitespace-nowrap text-on-surface-muted">
                      {formatDate(locale, item.purchased_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PageSortNote show={!!filters.sort && pages > 1} />
        </div>
      )}
      <DashboardPagination
        currentPage={Math.min(filters.page, pages)}
        totalPages={pages}
        totalItems={total}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => update({ page })}
        labels={{
          previous: t("previous"),
          next: t("next"),
          page: (current, totalPages) =>
            t("pagination", { page: current, pages: totalPages }),
          summary: (from, to, totalItems) => t("showing", { from, to, total: totalItems }),
        }}
      />
      <SubscriptionSheet
        open={filters.view !== null}
        subscription={rows.find((item) => item.enrollment_id === filters.view)}
        loading={query.isLoading}
        onClose={() => update({ view: null })}
      />
    </div>
  )
}
