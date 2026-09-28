"use client"

import { useLinkStatus } from "next/link"
import { useTranslations } from "next-intl"
import { DateRangeFilterForm } from "@/features/analytics/components/date-range-filter-form"
import {
  rangeHref,
  type RangeFilters,
  type RangePreset,
  type RangePresetId,
} from "@/features/dashboard/date-presets"
import { Link, useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"

/**
 * Inline range switcher for the overview header. Presets are plain links
 * (the range lives in `?start=&end=`), "custom" opens the calendar dialog.
 */
export function RangeControl({
  presets,
  active,
  filters,
}: {
  presets: RangePreset[]
  active: RangePresetId | "custom"
  filters: RangeFilters
}) {
  const t = useTranslations("teacherHome.range")
  const tf = useTranslations("analytics.filters")
  const router = useRouter()

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <nav
        aria-label={t("label")}
        className="grid grid-cols-4 rounded-lg border border-border bg-surface p-0.5 sm:inline-grid"
      >
        {presets.map((preset) => {
          const isActive = preset.id === active
          return (
            <Link
              key={preset.id}
              href={rangeHref(preset)}
              scroll={false}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "relative flex h-8 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-primary-tint text-primary"
                  : "text-on-surface-muted hover:bg-surface-muted hover:text-foreground"
              )}
            >
              {t(preset.id)}
              <PendingHint />
            </Link>
          )
        })}
      </nav>
      <DateRangeFilterForm
        filters={active === "custom" ? filters : {}}
        basePath="/dashboard"
        className="xl:justify-start"
        triggerClassName={cn(
          "h-9 w-full sm:w-auto sm:min-w-0",
          active === "custom" && "border-primary/50 bg-primary-tint text-primary"
        )}
        onApply={(range) => router.push(rangeHref(range), { scroll: false })}
        onReset={() => router.push("/dashboard", { scroll: false })}
        labels={{
          range: tf("range"),
          allTime: tf("all_time"),
          choose: t("custom"),
          dialogTitle: tf("dialog_title"),
          dialogDescription: tf("dialog_description"),
          apply: tf("apply"),
          reset: tf("reset"),
          cancel: tf("cancel"),
        }}
      />
    </div>
  )
}

/** Fixed-size underline that fades in while the range navigation is pending. */
function PendingHint() {
  const { pending } = useLinkStatus()
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-primary opacity-0 transition-opacity",
        pending && "animate-pulse opacity-100"
      )}
    />
  )
}
