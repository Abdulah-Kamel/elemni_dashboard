import {
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CircleDollarSign,
  Database,
  ReceiptText,
  WalletCards,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import type {
  PaginatedTeacherUsageLogs,
  TeacherUsageLog,
} from "@/features/earnings/schema"
import type { TeacherUsageFilters } from "@/features/earnings/queries"
import {
  EarningsCostChart,
  type EarningsChartPoint,
} from "./earnings-cost-chart"
import styles from "./earnings-view.module.css"

type EarningsViewProps = {
  data: PaginatedTeacherUsageLogs
  filters: TeacherUsageFilters
  locale: string
}

export async function EarningsView({
  data,
  filters,
  locale,
}: EarningsViewProps) {
  const t = await getTranslations({ locale, namespace: "earnings" })
  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const pageNumber = Math.floor(data.skip / data.limit) + 1
  const pageCount = Math.max(1, Math.ceil(data.total / data.limit))
  const chartItems = [...data.items]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-12)
  const chartData: EarningsChartPoint[] = chartItems.map((item) => ({
    date: item.date,
    label: formatShortDate(item.date, locale),
    cost: item.cost_amount,
  }))

  return (
    <div className={`${styles.page} flex flex-col gap-5 p-1 sm:gap-6`}>
      <header className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <Activity className="size-3.5" aria-hidden="true" />
              {t("eyebrow")}
            </span>
            <h1 className={styles.heroTitle}>{t("title")}</h1>
            <p className={styles.heroDescription}>{t("subtitle")}</p>
          </div>
          <div className={styles.balance}>
            <p className={styles.balanceLabel}>{t("pending_dues")}</p>
            <p className={styles.balanceValue}>
              {formatCurrency(data.summary.pending_dues, currency)}
            </p>
            <p className={styles.balanceHint}>{t("pending_dues_hint")}</p>
          </div>
        </div>
      </header>

      <section
        className={styles.signalStrip}
        aria-labelledby="earnings-summary-title"
      >
        <h2 id="earnings-summary-title" className="sr-only">
          {t("summary_title")}
        </h2>
        <SummaryCell
          label={t("summary.filtered_cost")}
          value={formatCurrency(data.summary.total_cost, currency)}
          icon={CircleDollarSign}
          primary
        />
        <SummaryCell
          label={t("summary.bandwidth_cost")}
          value={formatCurrency(data.summary.total_bandwidth_cost, currency)}
          icon={Activity}
        />
        <SummaryCell
          label={t("summary.storage_cost")}
          value={formatCurrency(data.summary.total_storage_cost, currency)}
          icon={Database}
        />
        <SummaryCell
          label={t("summary.storage_now")}
          value={
            data.summary.storage_used_mb == null
              ? t("not_available")
              : `${number.format(data.summary.storage_used_mb)} ${t("units.mb")}`
          }
          icon={WalletCards}
        />
      </section>

      <section
        className={styles.section}
        aria-labelledby="earnings-chart-title"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="earnings-chart-title" className={styles.sectionTitle}>
              {t("chart.title")}
            </h2>
            <p className={styles.sectionNote}>{t("chart.subtitle")}</p>
          </div>
          <span className={`${styles.eyebrow} hidden sm:inline-flex`}>
            {t("chart.badge")}
          </span>
        </div>
        {chartData.length > 0 ? (
          <EarningsCostChart
            data={chartData}
            ariaLabel={t("chart.label")}
            costLabel={t("chart.cost")}
            locale={locale}
          />
        ) : (
          <EmptyState
            icon={Activity}
            title={t("empty.title")}
            note={t("empty.note")}
          />
        )}
      </section>

      <section
        className={styles.section}
        aria-labelledby="earnings-ledger-title"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="earnings-ledger-title" className={styles.sectionTitle}>
              {t("ledger.title")}
            </h2>
            <p className={styles.sectionNote}>{t("ledger.subtitle")}</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--earnings-muted)]">
            <ReceiptText className="size-4" aria-hidden="true" />
            {t("ledger.entries", { count: data.total })}
          </span>
        </div>

        <form className={styles.filters} method="get">
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t("filters.start")}</span>
            <input
              className={styles.control}
              type="date"
              name="start_date"
              defaultValue={filters.startDate}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t("filters.end")}</span>
            <input
              className={styles.control}
              type="date"
              name="end_date"
              defaultValue={filters.endDate}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t("filters.min_cost")}</span>
            <input
              className={styles.control}
              type="number"
              name="min_cost"
              min="0"
              step="0.01"
              placeholder="0.00"
              defaultValue={filters.minCost}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t("filters.max_cost")}</span>
            <input
              className={styles.control}
              type="number"
              name="max_cost"
              min="0"
              step="0.01"
              placeholder="0.00"
              defaultValue={filters.maxCost}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t("filters.sort")}</span>
            <select
              className={styles.control}
              name="sort_by"
              defaultValue={filters.sortBy ?? "date"}
            >
              <option value="date">{t("filters.sort_date")}</option>
              <option value="cost_amount">{t("filters.sort_cost")}</option>
              <option value="bandwidth_bytes">
                {t("filters.sort_bandwidth")}
              </option>
              <option value="storage_bytes">{t("filters.sort_storage")}</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t("filters.order")}</span>
            <select
              className={styles.control}
              name="sort_order"
              defaultValue={filters.sortOrder ?? "desc"}
            >
              <option value="desc">{t("filters.desc")}</option>
              <option value="asc">{t("filters.asc")}</option>
            </select>
          </label>
          <input type="hidden" name="limit" value={data.limit} />
          <div className={styles.filterActions}>
            <button className={styles.filterButton} type="submit">
              {t("filters.apply")}
            </button>
            <a className={styles.resetButton} href="?">
              {t("filters.reset")}
            </a>
          </div>
        </form>

        {data.items.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="sr-only">{t("ledger.caption")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("ledger.date")}</th>
                  <th scope="col">{t("ledger.bandwidth")}</th>
                  <th scope="col">{t("ledger.storage")}</th>
                  <th scope="col">{t("ledger.bandwidth_cost")}</th>
                  <th scope="col">{t("ledger.storage_cost")}</th>
                  <th scope="col">{t("ledger.total")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <UsageRow
                    key={item.id}
                    item={item}
                    locale={locale}
                    currency={currency}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={t("empty.title")}
            note={t("empty.note")}
          />
        )}

        <Pagination
          page={pageNumber}
          pages={pageCount}
          total={data.total}
          filters={filters}
          t={t}
        />
      </section>
    </div>
  )
}

function SummaryCell({
  label,
  value,
  icon: Icon,
  primary = false,
}: {
  label: string
  value: string
  icon: typeof Activity
  primary?: boolean
}) {
  return (
    <div
      className={`${styles.signalCell} ${primary ? styles.signalCellPrimary : ""}`}
    >
      <Icon
        className="size-4 text-[var(--earnings-signal)]"
        aria-hidden="true"
      />
      <p className={`${styles.signalLabel} mt-3`}>{label}</p>
      <p className={styles.signalValue}>{value}</p>
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
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  return (
    <tr>
      <td className={styles.dateCell}>{formatDate(item.date, locale)}</td>
      <td className={styles.mutedCell}>
        {formatBytes(item.bandwidth_bytes, locale, t)}
      </td>
      <td className={styles.mutedCell}>
        {formatBytes(item.storage_bytes, locale, t)}
      </td>
      <td>{formatCurrency(item.bandwidth_cost_amount, currency)}</td>
      <td>{formatCurrency(item.storage_cost_amount, currency)}</td>
      <td className={styles.costCell}>
        {formatCurrency(item.cost_amount, currency)}
      </td>
    </tr>
  )
}

function EmptyState({
  icon: Icon,
  title,
  note,
}: {
  icon: typeof Activity
  title: string
  note: string
}) {
  return (
    <div className={styles.empty}>
      <div>
        <span className={styles.emptyIcon}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <p className={styles.emptyTitle}>{title}</p>
        <p className={styles.emptyNote}>{note}</p>
      </div>
    </div>
  )
}

function Pagination({
  page,
  pages,
  total,
  filters,
  t,
}: {
  page: number
  pages: number
  total: number
  filters: TeacherUsageFilters
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  const from = total === 0 ? 0 : (page - 1) * (filters.limit ?? 20) + 1
  const to = Math.min(page * (filters.limit ?? 20), total)
  const previous = buildPaginationHref(
    filters,
    Math.max(0, (page - 2) * (filters.limit ?? 20))
  )
  const next = buildPaginationHref(filters, page * (filters.limit ?? 20))

  return (
    <div className={styles.pagination}>
      <p className={styles.paginationMeta}>
        {t("ledger.showing", { from, to, total })}
      </p>
      <nav className={styles.paginationNav} aria-label={t("ledger.pagination")}>
        <a
          className={styles.paginationLink}
          href={page > 1 ? previous : undefined}
          aria-disabled={page <= 1}
        >
          <ArrowUp
            className="me-1 size-3.5 rotate-[-90deg]"
            aria-hidden="true"
          />
          {t("ledger.previous")}
        </a>
        <span className="flex min-h-[2.1rem] items-center px-1 text-xs font-bold text-[var(--earnings-muted)]">
          {page} / {pages}
        </span>
        <a
          className={styles.paginationLink}
          href={page < pages ? next : undefined}
          aria-disabled={page >= pages}
        >
          {t("ledger.next")}
          <ArrowDown
            className="ms-1 size-3.5 rotate-[-90deg]"
            aria-hidden="true"
          />
        </a>
      </nav>
    </div>
  )
}

function buildPaginationHref(filters: TeacherUsageFilters, skip: number) {
  const query = new URLSearchParams()
  if (filters.startDate) query.set("start_date", filters.startDate)
  if (filters.endDate) query.set("end_date", filters.endDate)
  if (filters.minCost) query.set("min_cost", filters.minCost)
  if (filters.maxCost) query.set("max_cost", filters.maxCost)
  if (filters.sortBy) query.set("sort_by", filters.sortBy)
  if (filters.sortOrder) query.set("sort_order", filters.sortOrder)
  query.set("skip", String(skip))
  query.set("limit", String(filters.limit ?? 20))
  return `?${query.toString()}`
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

function formatBytes(
  value: number,
  locale: string,
  t: Awaited<ReturnType<typeof getTranslations>>
) {
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
