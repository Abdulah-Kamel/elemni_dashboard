"use client"

import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Banknote, CalendarClock, Gauge, PanelRightOpen, Plus, Receipt, ServerOff, TicketPercent, TicketX, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AttentionList, type AttentionItem } from "@/components/ui/attention-list"
import { StatTile } from "@/components/ui/stat-tile"
import { SortHeader, ariaSort } from "@/components/ui/sort-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardPagination } from "@/components/dashboard-pagination"
import { nextSort, sortRows } from "@/lib/sort"
import { FilterBar, FilteredEmpty, SearchField, Segmented, TableSkeleton, rowOpenProps } from "@/features/admin/components/list-controls"
import { useDebouncedSearch, useUrlFilters } from "@/features/admin/hooks/use-url-filters"
import { formatMoney } from "@/features/admin/format"
import { deriveCouponAttention, matchesFlag, EXPIRING_WINDOW_DAYS, type CouponAttentionKind } from "../attention"
import { formatCount, formatDiscount } from "../format"
import { useCouponList, useCouponMutations, useCouponStats } from "../hooks/use-coupons"
import type { Coupon, CouponErrorCode, CouponResult } from "../schema"
import {
  COUPON_PAGE_SIZE,
  COUPON_SCAN_LIMIT,
  listQueryFor,
  parseCouponFilters,
  scanQuery,
  serializeCouponFilters,
  type CouponSortKey,
  type CouponStatusOption,
} from "../url-state"
import { CopyCodeButton, CouponStatusBadge, DemoBadge, UsageMeter, ValidityLabel, scopeLabel } from "./coupon-bits"
import { CouponDeleteDialog } from "./coupon-delete-dialog"
import { CouponFormDialog, errorText } from "./coupon-form-dialog"
import { CouponSheet } from "./coupon-sheet"

const attentionIcons: Record<CouponAttentionKind, AttentionItem["icon"]> = {
  expiring: CalendarClock,
  near_cap: Gauge,
  exhausted: TicketX,
}

/** Client-side sort for flag views, which narrow one scanned page. */
const accessors: Record<CouponSortKey, (row: Coupon) => string | number | null> = {
  code: (row) => row.code,
  discount: (row) => Number(row.value),
  usage: (row) => row.used_count,
  validity: (row) => (row.expires_at ? new Date(row.expires_at).getTime() : null),
  status: (row) => row.status,
  created: (row) => new Date(row.created_at).getTime(),
}

function failureOf<T>(query: { isError: boolean; data?: CouponResult<T> }): CouponErrorCode | null {
  if (query.isError) return "upstream"
  return query.data && !query.data.ok ? query.data.error : null
}

export function CouponsPage() {
  const t = useTranslations("adminCoupons")
  const locale = useLocale()
  const [now] = useState(() => Date.now())
  const [filters, update] = useUrlFilters(parseCouponFilters, serializeCouponFilters)
  const commitSearch = useCallback((q: string) => update({ q, page: 1 }), [update])
  const [search, setSearch] = useDebouncedSearch(filters.q, commitSearch)
  const createFromUrl = useSearchParams()?.get("create") === "1"
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [rowsRef] = useAutoAnimate({ duration: 160 })

  const stats = useCouponStats()
  const scan = useCouponList(scanQuery())
  const flagged = filters.flag !== "none"
  const list = useCouponList(listQueryFor(filters))
  const { toggle } = useCouponMutations()

  const statsData = stats.data?.ok ? stats.data.data : null
  const scanItems = scan.data?.ok ? scan.data.data.items : null
  const listFailure = failureOf(list)
  const notAvailable = [failureOf(stats), listFailure, failureOf(scan)].includes("not_available")

  const loaded = list.data?.ok ? list.data.data.items : []
  const matching = flagged ? loaded.filter((coupon) => matchesFlag(coupon, filters.flag, now)) : loaded
  const rows = flagged
    ? sortRows(matching, filters.sort, accessors, locale).slice((filters.page - 1) * COUPON_PAGE_SIZE, filters.page * COUPON_PAGE_SIZE)
    : matching
  const totalItems = flagged ? matching.length : list.data?.ok ? list.data.data.total : 0
  const totalPages = Math.max(1, Math.ceil(totalItems / COUPON_PAGE_SIZE))
  const scanTruncated = flagged && list.data?.ok === true && list.data.data.total > loaded.length
  const activeFilterCount = [filters.q, !flagged && filters.status !== "all", flagged].filter(Boolean).length

  // The panel can be opened from a deep link to a coupon on another page:
  // look it up by code when it isn't already loaded.
  const inLoaded = filters.view ? (loaded.find((coupon) => coupon.code === filters.view) ?? scanItems?.find((coupon) => coupon.code === filters.view)) : undefined
  const lookup = useCouponList({ q: filters.view ?? "", limit: 10 }, { enabled: !!filters.view && !inLoaded && !list.isLoading })
  const selected = inLoaded ?? (lookup.data?.ok ? lookup.data.data.items.find((coupon) => coupon.code === filters.view) : undefined)

  const clearFilters = () => update({ q: "", status: "all", flag: "none", page: 1 })
  const open = (code: string) => update({ view: code })
  const sortBy = (key: CouponSortKey) => update({ sort: nextSort(filters.sort, key), page: 1 })

  async function runToggle(coupon: Coupon) {
    const result = await toggle.mutateAsync(coupon.code)
    if (!result.ok) {
      toast.error(errorText(t, result.error, result.message))
      return
    }
    toast.success(result.data.is_active ? t("toast.activated", { code: coupon.code }) : t("toast.deactivated", { code: coupon.code }))
  }

  const attentionItems: AttentionItem[] = deriveCouponAttention(statsData, scanItems).map((item) => ({
    ...item,
    label: t(`attention.${item.id}`, { count: item.count, days: EXPIRING_WINDOW_DAYS }),
    icon: attentionIcons[item.id],
  }))

  const head = (key: CouponSortKey, label: string) => (
    <TableHead className="px-4 py-2.5" aria-sort={ariaSort(filters.sort, key)}>
      <SortHeader label={label} column={key} sort={filters.sort} onSort={sortBy} />
    </TableHead>
  )

  const header = (
    <header className="flex animate-slide-up flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-headline-md font-semibold text-foreground">{t("title")}</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-body-md text-on-surface-muted" aria-live="polite">
          {notAvailable || list.isLoading ? t("subtitle") : t("count", { count: totalItems })}
        </p>
      </div>
      {!notAvailable && (
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <Plus className="size-4" aria-hidden="true" /> {t("create")}
        </Button>
      )}
    </header>
  )

  if (notAvailable) {
    return (
      <div className="flex flex-col gap-lg">
        {header}
        <BackendMissing />
      </div>
    )
  }

  // With no filters the list is unfiltered, so an empty page means no coupons at all.
  const noCouponsYet = !list.isLoading && !listFailure && activeFilterCount === 0 && totalItems === 0
  const tileValue = (value: number | undefined) => (value === undefined ? <Skeleton className="h-7 w-12" /> : formatCount(locale, value))

  return (
    <div className="flex flex-col gap-lg">
      {header}

      {!noCouponsYet && (
        <div className="grid animate-slide-up gap-md xl:grid-cols-3 [&>*]:min-w-0">
          <section aria-label={t("tiles.label")} className="grid grid-cols-2 gap-md sm:grid-cols-3 xl:col-span-2 [&>*]:min-w-0">
            <StatTile label={t("tiles.active")} value={tileValue(statsData?.active)} hint={t("tiles.active_hint")} icon={TicketPercent} href="/admin/coupons?status=active" />
            <StatTile
              label={t("tiles.expiring")}
              value={tileValue(statsData?.expiring_soon)}
              hint={t("tiles.expiring_hint", { days: EXPIRING_WINDOW_DAYS })}
              icon={CalendarClock}
              href="/admin/coupons?flag=expiring"
              tone={statsData && statsData.expiring_soon > 0 ? "warning" : "default"}
            />
            <StatTile label={t("tiles.exhausted")} value={tileValue(statsData?.exhausted)} hint={t("tiles.exhausted_hint")} icon={TicketX} href="/admin/coupons?status=exhausted" />
            <StatTile label={t("tiles.redemptions")} value={tileValue(statsData?.total_redemptions)} hint={t("tiles.redemptions_hint")} icon={Receipt} href="/admin/coupons?sort=usage&dir=desc" />
            <StatTile
              label={t("tiles.discount")}
              value={
                statsData ? (
                  <span className="block text-lg break-words sm:text-2xl">{formatMoney(locale, statsData.total_discount_given, "EGP")}</span>
                ) : (
                  <Skeleton className="h-7 w-20" />
                )
              }
              hint={t("tiles.discount_hint")}
              icon={Banknote}
              href="/admin/coupons?sort=usage&dir=desc"
              className="col-span-2 sm:col-span-1"
            />
          </section>
          <AttentionList title={t("attention.title")} items={attentionItems} emptyLabel={t("attention.empty")} dir={locale === "ar" ? "rtl" : "ltr"} />
        </div>
      )}

      {!noCouponsYet && (
        <FilterBar activeCount={activeFilterCount} onClear={clearFilters}>
          <SearchField value={search} onChange={setSearch} placeholder={t("filters.search")} />
          {flagged ? (
            <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-warning/40 bg-warning-tint/60 ps-3 pe-1 text-xs font-medium">
              {t(`filters.flag_${filters.flag}`, { days: EXPIRING_WINDOW_DAYS })}
              <button
                type="button"
                onClick={() => update({ flag: "none", status: "all", page: 1 })}
                aria-label={t("filters.flag_clear")}
                className="grid size-7 place-items-center rounded-md text-on-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ) : (
            <Segmented<CouponStatusOption>
              label={t("filters.status")}
              value={filters.status}
              onChange={(status) => update({ status, page: 1 })}
              options={[
                { value: "all", label: t("filters.all") },
                { value: "active", label: t("status.active") },
                { value: "inactive", label: t("status.inactive") },
                { value: "expired", label: t("status.expired") },
                { value: "exhausted", label: t("status.exhausted") },
              ]}
            />
          )}
        </FilterBar>
      )}

      {scanTruncated && <p className="text-xs text-warning">{t("filters.scan_truncated", { count: COUPON_SCAN_LIMIT })}</p>}

      {list.isLoading ? (
        <TableSkeleton />
      ) : listFailure ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-4 py-12 text-center">
          <p className="text-sm text-destructive">{errorText(t, listFailure, list.data && !list.data.ok ? list.data.message : undefined)}</p>
          <Button variant="outline" size="sm" onClick={() => list.refetch()}>
            {t("errors.retry")}
          </Button>
        </div>
      ) : noCouponsYet ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <FilteredEmpty filtered={activeFilterCount > 0} onClear={clearFilters} />
        </div>
      ) : (
        <section
          className="overflow-hidden rounded-xl border border-border bg-surface transition-opacity data-[stale=true]:opacity-70"
          data-stale={list.isPlaceholderData}
          aria-busy={list.isFetching}
        >
          <div className="hidden overflow-x-auto md:block">
            <Table className="text-sm">
              <TableHeader className="bg-surface-muted text-on-surface-muted">
                <TableRow className="hover:bg-transparent">
                  {head("code", t("table.code"))}
                  {head("discount", t("table.discount"))}
                  {head("usage", t("table.usage"))}
                  {head("validity", t("table.validity"))}
                  <TableHead className="px-4 py-2.5">{t("table.scope")}</TableHead>
                  {head("status", t("table.status"))}
                  <TableHead className="px-4 py-2.5 text-end">
                    <span className="sr-only">{t("table.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody ref={rowsRef}>
                {rows.map((coupon) => (
                  <TableRow key={coupon.code} {...rowOpenProps(() => open(coupon.code), filters.view === coupon.code)}>
                    <TableCell className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => open(coupon.code)}
                          dir="ltr"
                          className="rounded-sm font-mono font-semibold tracking-wide hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                          {coupon.code}
                        </button>
                        <CopyCodeButton code={coupon.code} />
                      </div>
                      {coupon.description && <p className="max-w-[16rem] truncate text-xs text-on-surface-muted">{coupon.description}</p>}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 font-medium whitespace-nowrap tabular-nums">
                      <span dir="ltr">{formatDiscount(locale, coupon)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <UsageMeter used={coupon.used_count} max={coupon.max_uses} />
                    </TableCell>
                    <TableCell className="px-4 py-2.5 whitespace-nowrap text-on-surface-muted">
                      <ValidityLabel coupon={coupon} />
                    </TableCell>
                    <TableCell className="px-4 py-2.5 whitespace-nowrap text-on-surface-muted">{scopeLabel(t, coupon)}</TableCell>
                    <TableCell className="px-4 py-2.5">
                      <CouponStatusBadge status={coupon.status} />
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-end">
                      <Button variant="ghost" size="sm" onClick={() => open(coupon.code)}>
                        <PanelRightOpen className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                        {t("table.open")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {rows.map((coupon) => (
              <li key={coupon.code} className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  onClick={() => open(coupon.code)}
                  className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-md text-start focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span dir="ltr" className="font-mono font-semibold tracking-wide">{coupon.code}</span>
                    <span dir="ltr" className="text-sm font-medium">{formatDiscount(locale, coupon)}</span>
                    <CouponStatusBadge status={coupon.status} />
                  </span>
                  <UsageMeter used={coupon.used_count} max={coupon.max_uses} className="w-full" />
                  <span className="text-xs text-on-surface-muted">
                    <ValidityLabel coupon={coupon} /> · {scopeLabel(t, coupon)}
                  </span>
                </button>
                <CopyCodeButton code={coupon.code} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {!noCouponsYet && !listFailure && (
        <DashboardPagination
          currentPage={Math.min(filters.page, totalPages)}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={COUPON_PAGE_SIZE}
          onPageChange={(page) => update({ page })}
          labels={{
            previous: t("pagination.previous"),
            next: t("pagination.next"),
            page: (current, pages) => t("pagination.page", { page: current, pages }),
            summary: (from, to, total) => t("pagination.summary", { from, to, total }),
          }}
        />
      )}

      <CouponSheet
        code={filters.view}
        coupon={selected}
        loading={!selected && (list.isLoading || lookup.isLoading)}
        onClose={() => update({ view: null })}
        onEdit={setEditTarget}
        onToggle={runToggle}
        onDelete={setDeleteTarget}
        togglePending={toggle.isPending}
      />
      <CouponFormDialog
        open={createOpen || createFromUrl}
        onOpenChange={(next) => {
          setCreateOpen(next)
          // Re-serialising the filters drops the one-shot `create` param.
          if (!next && createFromUrl) update({})
        }}
        onSaved={(coupon) => update({ view: coupon.code })}
      />
      {editTarget && (
        <CouponFormDialog
          key={editTarget.code}
          coupon={editTarget}
          open
          onOpenChange={(next) => {
            if (!next) setEditTarget(null)
          }}
        />
      )}
      <CouponDeleteDialog
        code={deleteTarget?.code ?? null}
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null)
        }}
        onDeleted={() => update({ view: null })}
        onDeactivate={deleteTarget?.is_active ? () => runToggle(deleteTarget) : undefined}
      />
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("adminCoupons")
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-primary-tint text-primary">
        <TicketPercent className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold">{t("empty.title")}</h2>
      <p className="max-w-[28rem] text-sm text-on-surface-muted">{t("empty.body")}</p>
      <Button onClick={onCreate}>
        <Plus className="size-4" aria-hidden="true" />
        {t("empty.cta")}
      </Button>
    </section>
  )
}

/** Shown when the backend answers 404/501 for the coupon endpoints. Admin-only page. */
function BackendMissing() {
  const t = useTranslations("adminCoupons")
  const showDevHint = process.env.NODE_ENV !== "production"
  return (
    <section role="status" className="flex flex-col gap-3 rounded-xl border border-warning/50 bg-warning-tint/40 p-5 sm:flex-row sm:items-start">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-warning-tint text-warning">
        <ServerOff className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="text-base font-semibold">{t("backend.title")}</h2>
        <p className="text-sm text-on-surface-muted">{t("backend.body")}</p>
        {showDevHint && (
          <p className="text-sm text-on-surface-muted">
            {t("backend.dev_hint")}{" "}
            <code dir="ltr" className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">
              NEXT_PUBLIC_COUPONS_DEMO=1
            </code>
          </p>
        )}
      </div>
    </section>
  )
}
