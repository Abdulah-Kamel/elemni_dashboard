"use client"

import { useLocale, useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { deriveGuidedAnalysis } from "@/features/analytics/guided-analysis"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"

type Props = {
  summary: TeacherAnalytics
  topCourses: TopEarningCourse[]
  currency: string
}

export function GuidedAnalysisSection({
  summary,
  topCourses,
  currency,
}: Props) {
  const t = useTranslations("analytics.analysis")
  const locale = useLocale()
  const analysis = deriveGuidedAnalysis(summary, topCourses)
  const courseTotal = analysis.activeCourses + analysis.archivedCourses
  const unavailable = t("unavailable")
  const teacherShare = formatPercent(analysis.teacherShare, locale, unavailable)
  const averageEarnings = formatMoney(
    analysis.earningsPerSubscription,
    locale,
    currency,
    unavailable
  )
  const activeRatio = formatPercent(
    analysis.activeCourseRatio,
    locale,
    unavailable
  )
  const concentration = formatPercent(
    analysis.topCourseConcentration,
    locale,
    unavailable
  )

  return (
    <section aria-labelledby="guided-analysis-title" className="space-y-md">
      <div>
        <h2 id="guided-analysis-title" className="text-title-lg font-semibold text-foreground">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-on-surface-muted">{t("subtitle")}</p>
      </div>

      <div className="grid gap-md lg:grid-cols-2">
        <Card className="rounded-2xl border border-border p-md shadow-xs">
          <h3 className="text-title-md font-semibold text-foreground">
            {t("business.title")}
          </h3>
          <dl className="mt-4 space-y-4">
            <AnalysisItem
              label={t("business.teacher_share")}
              value={teacherShare}
              description={
                analysis.teacherShare === null
                  ? ""
                  : t("business.teacher_share_description", { value: teacherShare })
              }
            />
            <AnalysisItem
              label={t("business.earnings_per_subscription")}
              value={averageEarnings}
              description={
                analysis.earningsPerSubscription === null
                  ? ""
                  : t("business.earnings_per_subscription_description", {
                      value: averageEarnings,
                    })
              }
            />
          </dl>
        </Card>

        <Card className="rounded-2xl border border-border p-md shadow-xs">
          <h3 className="text-title-md font-semibold text-foreground">
            {t("portfolio.title")}
          </h3>
          <dl className="mt-4 space-y-4">
            <AnalysisItem
              label={t("portfolio.active_ratio")}
              value={activeRatio}
              description={
                analysis.activeCourseRatio === null
                  ? ""
                  : t("portfolio.active_ratio_description", {
                      active: analysis.activeCourses,
                      total: courseTotal,
                      value: activeRatio,
                    })
              }
            />
            <AnalysisItem
              label={t("portfolio.top_course_concentration")}
              value={concentration}
              description={
                analysis.topCourseConcentration === null
                  ? ""
                  : t("portfolio.top_course_concentration_description", {
                      value: concentration,
                    })
              }
            />
          </dl>
        </Card>
      </div>
    </section>
  )
}

function AnalysisItem({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div>
      <dt className="text-sm font-semibold text-on-surface-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-primary tabular-nums" dir="ltr">
        {value}
      </dd>
      {description ? (
        <p className="mt-1 text-sm text-on-surface-muted">{description}</p>
      ) : null}
    </div>
  )
}

function formatPercent(value: number | null, locale: string, fallback: string) {
  return value === null
    ? fallback
    : new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value)
}

function formatMoney(
  value: number | null,
  locale: string,
  currency: string,
  fallback: string
) {
  return value === null
    ? fallback
    : new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
}
