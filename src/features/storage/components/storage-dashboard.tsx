"use client"

import {
  BookOpen,
  FileStack,
  Film,
  GraduationCap,
  Layers3,
  ReceiptText,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { StorageTable } from "@/features/storage/components/storage-table"
import type { UsageDashboardData } from "@/features/storage/types"

export function StorageDashboard({ data }: { data: UsageDashboardData }) {
  const t = useTranslations("storage")
  const locale = useLocale()
  const formatNumber = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  })

  const statCards = [
    {
      label: t("total_courses"),
      value: data.summary.totalCourses,
      icon: BookOpen,
    },
    {
      label: t("published_courses"),
      value: data.summary.publishedCourses,
      icon: GraduationCap,
    },
    {
      label: t("total_lessons"),
      value: data.summary.totalLessons,
      icon: Layers3,
    },
    {
      label: t("total_items"),
      value: data.summary.totalItems,
      icon: FileStack,
    },
    {
      label: t("total_subscriptions"),
      value: data.summary.totalSubscriptions,
      icon: ReceiptText,
    },
  ]

  const contentRows = [
    {
      label: t("videos"),
      value: data.summary.totalVideoItems,
      barClassName: "bg-primary",
    },
    {
      label: t("documents"),
      value: data.summary.totalDocumentItems,
      barClassName: "bg-chart-2",
    },
    {
      label: t("exams"),
      value: data.summary.totalExamItems,
      barClassName: "bg-chart-3",
    },
    {
      label: t("other_content"),
      value: data.summary.totalOtherItems,
      barClassName: "bg-surface-strong",
    },
  ]

  return (
    <div className="flex flex-col gap-xl">
      <header>
        <h1 className="text-headline-md font-semibold text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-body-md text-on-surface-muted">
          {t("subtitle")}
        </p>
      </header>

      <section className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="rounded-2xl border border-border p-5 shadow-xs"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary-tint text-primary">
              <Icon className="size-5" />
            </div>
            <p className="text-xs font-semibold text-on-surface-muted">
              {label}
            </p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {formatNumber.format(value)}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-md lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="rounded-2xl border border-border p-5 shadow-xs">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-title-lg font-semibold text-foreground">
                {t("content_mix_title")}
              </h2>
              <p className="mt-1 text-sm text-on-surface-muted">
                {t("content_mix_subtitle")}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-tint text-primary">
              <Film className="size-5" />
            </div>
          </div>

          <div className="space-y-4">
            {contentRows.map((row) => {
              const percentage = shareOf(row.value, data.summary.totalItems)

              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {row.label}
                    </p>
                    <p className="text-sm text-on-surface-muted">
                      {formatNumber.format(row.value)} · {percentage}%
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={`h-full rounded-full transition-[width] ${row.barClassName}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="rounded-2xl border border-border p-5 shadow-xs">
          <h2 className="text-title-lg font-semibold text-foreground">
            {t("largest_course_title")}
          </h2>
          <p className="mt-1 text-sm text-on-surface-muted">
            {t("largest_course_subtitle")}
          </p>

          {data.topCourse ? (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {data.topCourse.title}
                </p>
                <p className="mt-1 text-sm text-on-surface-muted">
                  {[
                    data.topCourse.subject,
                    data.topCourse.grade,
                    data.topCourse.stream,
                  ]
                    .filter(Boolean)
                    .join(" · ") || t("not_available")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricTile
                  label={t("lessons")}
                  value={formatNumber.format(data.topCourse.lessonCount)}
                />
                <MetricTile
                  label={t("items")}
                  value={formatNumber.format(data.topCourse.itemCount)}
                />
                <MetricTile
                  label={t("subscriptions")}
                  value={formatNumber.format(data.topCourse.subscriptionCount)}
                />
                <MetricTile
                  label={t("videos")}
                  value={formatNumber.format(data.topCourse.videoCount)}
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface-muted p-6 text-sm text-on-surface-muted">
              {t("no_course_data")}
            </div>
          )}
        </Card>
      </section>

      <StorageTable rows={data.courseUsage} />
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-4">
      <p className="text-xs font-semibold text-on-surface-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function shareOf(value: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((value / total) * 100)
}
