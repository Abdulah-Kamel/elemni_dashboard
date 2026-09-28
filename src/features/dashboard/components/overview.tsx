import { BookOpen, CalendarClock, FilePen, Plus, ReceiptText, TrendingUp, Wallet } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { AttentionList, type AttentionItem } from "@/components/ui/attention-list"
import { Button } from "@/components/ui/button"
import { StatTile } from "@/components/ui/stat-tile"
import type { TeacherAnalytics, TopEarningCourse } from "@/features/analytics/schema"
import { countDrafts, deriveAttention, type AttentionId } from "@/features/dashboard/attention"
import { activeRange, rangePresets, type RangeFilters } from "@/features/dashboard/date-presets"
import { formatCount, formatMoney } from "@/features/dashboard/format"
import { buildKpis, type Kpi } from "@/features/dashboard/kpis"
import { overviewLinks } from "@/features/dashboard/links"
import type { CourseOut } from "@/features/shell/schema"
import { EXPIRING_WINDOW_DAYS } from "@/features/students/roster-model"
import type { TeacherSubscription } from "@/features/students/schema"
import { Link } from "@/i18n/routing"
import { ActivityFeed } from "./activity-feed"
import { RangeControl } from "./range-control"
import { TopCourses } from "./top-courses"
import { TrendSlot, type TrendPoint } from "./trend-slot"

// The analytics API reports money without a currency; the platform bills in EGP.
const CURRENCY = "EGP"

type OverviewProps = {
  teacherFirstName: string
  summary: TeacherAnalytics
  topCourses: TopEarningCourse[]
  recentSubscriptions: TeacherSubscription[] | null
  courses: CourseOut[] | null
  subscriptions: TeacherSubscription[] | null
  trend: TrendPoint[] | null
  filters: RangeFilters
  now: Date
}

const attentionIcons: Record<AttentionId, AttentionItem["icon"]> = {
  expiring_soon: CalendarClock,
  pending_payments: ReceiptText,
  draft_courses: FilePen,
  published_without_students: BookOpen,
}

const enter = "animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both motion-reduce:animate-none"

export async function Overview({
  teacherFirstName,
  summary,
  topCourses,
  recentSubscriptions,
  courses,
  subscriptions,
  trend,
  filters,
  now,
}: OverviewProps) {
  const t = await getTranslations("teacherHome")
  const locale = await getLocale()
  const presets = rangePresets(now)
  const active = activeRange(filters, presets)

  const header = (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-headline-md font-semibold text-foreground">
          {t("greeting", { name: teacherFirstName })}
        </h1>
        <p className="mt-1 text-sm text-on-surface-muted">
          {t("showing", { range: rangePhrase(active, filters, locale, t) })}
        </p>
      </div>
      <RangeControl presets={presets} active={active} filters={filters} />
    </header>
  )

  if (courses !== null && courses.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-md font-semibold text-foreground">
            {t("greeting", { name: teacherFirstName })}
          </h1>
        </header>
        <section className={`flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-6 ${enter}`}>
          <span className="grid size-10 place-items-center rounded-lg bg-primary-tint text-primary">
            <BookOpen className="size-5" aria-hidden="true" />
          </span>
          <h2 className="text-title-lg font-semibold text-foreground">{t("empty.title")}</h2>
          <p className="max-w-[36rem] text-sm text-on-surface-muted">{t("empty.body")}</p>
          <Button
            render={
              <Link href={overviewLinks.newCourse}>
                <Plus data-icon="inline-start" />
                {t("empty.cta")}
              </Link>
            }
          />
        </section>
      </div>
    )
  }

  const kpis = buildKpis(summary, countDrafts(courses))
  const attention = deriveAttention({ courses, subscriptions, now })
  const attentionItems: AttentionItem[] = (attention ?? []).map((entry) => ({
    id: entry.id,
    label: t(`attention.${entry.id}`, { days: EXPIRING_WINDOW_DAYS }),
    count: entry.count,
    href: entry.href,
    tone: entry.tone,
    icon: attentionIcons[entry.id],
  }))

  return (
    <div className="flex flex-col gap-6">
      {header}

      <section aria-label={t("kpi.label")} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${enter}`}>
        {kpis.map((kpi) => (
          <StatTile
            key={kpi.id}
            {...kpiTileProps(kpi, locale, t)}
            href={kpi.href}
            className={kpi.id === "earnings" ? "col-span-2 sm:col-span-1" : undefined}
          />
        ))}
      </section>

      {trend && <TrendSlot series={trend} />}

      <div className={`grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] ${enter} delay-75`}>
        <div className="flex min-w-0 flex-col gap-6">
          {attention === null ? (
            <section className="rounded-xl border border-border bg-surface">
              <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
                {t("attention.title")}
              </h2>
              <p className="px-4 py-6 text-sm text-on-surface-muted">{t("attention.unavailable")}</p>
            </section>
          ) : (
            <AttentionList
              title={t("attention.title")}
              items={attentionItems}
              emptyLabel={t("attention.empty")}
              dir={locale === "ar" ? "rtl" : "ltr"}
            />
          )}
          <ActivityFeed subscriptions={recentSubscriptions} now={now} />
        </div>
        <TopCourses
          courses={topCourses}
          currency={CURRENCY}
          isFiltered={active !== "all"}
        />
      </div>
    </div>
  )
}

type T = Awaited<ReturnType<typeof getTranslations<"teacherHome">>>

function kpiTileProps(kpi: Kpi, locale: string, t: T) {
  switch (kpi.id) {
    case "earnings":
      return {
        label: t("kpi.earnings"),
        icon: Wallet,
        tone: "primary" as const,
        value: formatMoney(kpi.value, CURRENCY, locale),
        hint: t("kpi.earnings_hint", { revenue: formatMoney(kpi.revenue, CURRENCY, locale) }),
      }
    case "subscriptions":
      return {
        label: t("kpi.subscriptions"),
        icon: TrendingUp,
        value: formatCount(kpi.value, locale),
      }
    case "courses":
      return {
        label: t("kpi.courses"),
        icon: BookOpen,
        value: formatCount(kpi.value, locale),
        hint:
          kpi.drafts === null
            ? t("kpi.courses_hint_archived", { archived: kpi.archived })
            : t("kpi.courses_hint", { drafts: kpi.drafts, archived: kpi.archived }),
      }
  }
}

function rangePhrase(
  active: ReturnType<typeof activeRange>,
  filters: RangeFilters,
  locale: string,
  t: T
) {
  switch (active) {
    case "all":
      return t("range.all_time_phrase")
    case "7d":
      return t("range.last_7")
    case "30d":
      return t("range.last_30")
    case "term":
      return t("range.this_term")
    case "custom": {
      const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
      const start = filters.start ? new Date(`${filters.start}T12:00:00`) : null
      const end = filters.end ? new Date(`${filters.end}T12:00:00`) : null
      if (start && end) return fmt.formatRange(start, end)
      return fmt.format((start ?? end) as Date)
    }
  }
}
