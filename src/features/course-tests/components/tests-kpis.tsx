"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useCountUp } from "../hooks"
import { WARNING_TEXT } from "../ui-utils"
import type { TestStats } from "../types"

function Kpi({ label, children, tone = "default", className }: { label: string; children: React.ReactNode; tone?: "default" | "warning"; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-2xl border px-4.5 py-4 animate-slide-up",
        tone === "warning" ? "border-warning/40 bg-warning-tint text-foreground" : "border-border bg-card",
        className,
      )}
    >
      <dt className={cn("text-sm", tone === "warning" ? cn("font-medium", WARNING_TEXT) : "text-on-surface-muted")}>{label}</dt>
      <dd className={cn("text-[1.625rem] leading-tight font-bold tabular-nums", tone === "warning" && WARNING_TEXT)}>{children}</dd>
    </div>
  )
}

function Percent({ value, animate }: { value: number | null; animate: boolean }) {
  const shown = useCountUp(value, animate)
  return <>{shown === null ? "—" : `${shown}%`}</>
}

function Count({ value, animate }: { value: number; animate: boolean }) {
  return <>{useCountUp(value, animate) ?? value}</>
}

export function TestsKpis({ stats, animate }: { stats: TestStats; animate: boolean }) {
  const t = useTranslations("courseTests.kpi")
  const noData = t("no_data")
  return (
    <dl aria-label={t("label")} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Kpi label={t("published")} className="animate-stagger-1">
        <Count value={stats.published_tests} animate={animate} />{" "}
        <span className="text-sm font-medium text-on-surface-muted">
          {t("drafts", { count: stats.draft_tests })}
          {stats.scheduled_tests > 0 && ` · ${t("scheduled", { count: stats.scheduled_tests })}`}
        </span>
      </Kpi>
      <Kpi label={t("pending")} tone={stats.pending_grading > 0 ? "warning" : "default"} className="animate-stagger-2">
        <Count value={stats.pending_grading} animate={animate} />{" "}
        <span className="text-sm font-medium">{t("pending_unit", { count: stats.pending_grading })}</span>
      </Kpi>
      <Kpi label={t("average")} className="animate-stagger-3">
        <Percent value={stats.average_score} animate={animate} />
        {stats.average_score === null && <span className="block text-xs font-normal text-on-surface-muted">{noData}</span>}
      </Kpi>
      <Kpi label={t("pass_rate")} className="animate-stagger-4">
        <Percent value={stats.pass_rate} animate={animate} />
        {stats.pass_rate === null && <span className="block text-xs font-normal text-on-surface-muted">{noData}</span>}
      </Kpi>
    </dl>
  )
}

export function TestsKpisSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-23 rounded-2xl" />
      ))}
    </div>
  )
}
