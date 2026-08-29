import {
  Archive,
  Banknote,
  BookOpen,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DateRangeFilterForm } from "@/features/analytics/components/date-range-filter-form"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"

type Props = {
  summary: TeacherAnalytics
  topCourses: TopEarningCourse[]
  filters: {
    start?: string
    end?: string
  }
  title?: string
  subtitle?: string
  basePath?: string
  currency?: string
}

export async function TeacherAnalyticsView({
  summary,
  topCourses,
  filters,
  title,
  subtitle,
  basePath = "/dashboard",
  currency = "EGP",
}: Props) {
  const t = await getTranslations("analytics")
  const locale = await getLocale()

  const stats = [
    {
      label: t("stats.teacher_earnings"),
      value: formatMoney(summary.total_earnings, locale, currency),
      icon: TrendingUp,
    },
    {
      label: t("stats.total_revenue"),
      value: formatMoney(summary.total_revenue, locale, currency),
      icon: Banknote,
    },
    {
      label: t("stats.subscriptions"),
      value: formatCount(summary.subscription_count, locale),
      icon: ReceiptText,
    },
    {
      label: t("stats.active_courses"),
      value: formatCount(summary.active_courses_count, locale),
      icon: BookOpen,
    },
    {
      label: t("stats.archived_courses"),
      value: formatCount(summary.archived_courses_count, locale),
      icon: Archive,
    },
  ]

  const stagger = ["animate-stagger-1", "animate-stagger-2", "animate-stagger-3", "animate-stagger-4", "animate-stagger-5"]

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex animate-slide-up flex-col gap-2">
        <h1 className="text-headline-md font-semibold text-foreground">
          {title ?? t("title")}
        </h1>
        <p className="text-body-md text-on-surface-muted">
          {subtitle ?? t("subtitle")}
        </p>
      </header>

      <Card className="animate-slide-up animate-stagger-1 rounded-2xl border border-border p-md shadow-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-on-surface-muted">
              {t("filters.range")}
            </p>
            <p className="text-body-md font-medium text-foreground">
              {formatDateRange(
                summary.start_date,
                summary.end_date,
                locale,
                t("filters.all_time")
              )}
            </p>
          </div>

          <DateRangeFilterForm
            filters={filters}
            basePath={basePath}
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
      </Card>

      <section className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }, index) => (
          <Card
            key={label}
            className={`card-hover animate-slide-up ${stagger[index]} rounded-2xl border border-border p-md shadow-xs`}
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary-tint text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-on-surface-muted">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-primary tabular-nums" dir="ltr">
              {value}
            </p>
          </Card>
        ))}
      </section>

      <Card className="animate-slide-up animate-stagger-6 rounded-2xl border border-border shadow-xs">
        <div className="border-b border-border px-md pt-md pb-3">
          <h2 className="text-title-lg font-semibold text-foreground">
            {t("top_courses.title")}
          </h2>
          <p className="mt-1 text-sm text-on-surface-muted">
            {t("top_courses.subtitle")}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted">
              <TableHead>{t("top_courses.headers.course")}</TableHead>
              <TableHead>{t("top_courses.headers.price")}</TableHead>
              <TableHead>{t("top_courses.headers.earnings")}</TableHead>
              <TableHead>{t("top_courses.headers.subscriptions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCourses.length ? (
              topCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex items-center gap-3 font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary-tint text-primary">
                        <Users className="size-4" aria-hidden="true" />
                      </div>
                      <span>{course.title}</span>
                    </Link>
                  </TableCell>
                  <TableCell dir="ltr" className="tabular-nums">
                    {formatMoney(course.price, locale, currency)}
                  </TableCell>
                  <TableCell dir="ltr" className="tabular-nums">
                    {formatMoney(course.earning_amount, locale, currency)}
                  </TableCell>
                  <TableCell dir="ltr" className="tabular-nums">
                    {formatCount(course.student_subscription_count, locale)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-md py-8 text-center text-sm text-on-surface-muted"
                >
                  {t("top_courses.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function formatMoney(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateRange(
  start: string | null,
  end: string | null,
  locale: string,
  allTimeLabel: string
) {
  if (!start && !end) {
    return allTimeLabel
  }

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
  const startLabel = start ? formatter.format(new Date(start)) : "—"
  const endLabel = end ? formatter.format(new Date(end)) : "—"

  return `${startLabel} — ${endLabel}`
}
