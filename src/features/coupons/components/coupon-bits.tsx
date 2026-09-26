"use client"

import { useState } from "react"
import { Check, Copy, FlaskConical } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDate } from "@/features/admin/format"
import { isCouponsDemo } from "../client"
import { formatCount, usagePercent } from "../format"
import type { Coupon, CouponStatus } from "../schema"

const statusStyle: Record<CouponStatus, string> = {
  active: "border-success/30 bg-success-tint text-success",
  scheduled: "border-primary/30 bg-primary-tint text-primary",
  inactive: "border-border bg-surface-muted text-on-surface-muted",
  expired: "border-border bg-surface-muted text-on-surface-muted",
  exhausted: "border-warning/40 bg-warning-tint text-warning",
}

export function CouponStatusBadge({ status }: { status: CouponStatus }) {
  const t = useTranslations("adminCoupons")
  return (
    <Badge variant="outline" data-testid={`coupon-status-${status}`} className={cn("whitespace-nowrap", statusStyle[status])}>
      {t(`status.${status}`)}
    </Badge>
  )
}

/** "37 / 500" with a thin bar; unlimited coupons show the count and "no limit". */
export function UsageMeter({ used, max, className }: { used: number; max: number | null; className?: string }) {
  const t = useTranslations("adminCoupons")
  const locale = useLocale()
  const percent = usagePercent(used, max)
  return (
    <div className={cn("flex min-w-[6.5rem] flex-col gap-1", className)}>
      <span className="text-sm tabular-nums">
        {max === null ? (
          <>
            {formatCount(locale, used)} <span className="text-xs text-on-surface-muted">· {t("table.unlimited")}</span>
          </>
        ) : (
          <span dir="ltr">{t("table.usage_of", { used: formatCount(locale, used), max: formatCount(locale, max) })}</span>
        )}
      </span>
      {percent !== null && (
        <span
          role="meter"
          aria-valuemin={0}
          aria-valuemax={max ?? 0}
          aria-valuenow={used}
          aria-label={t("table.usage")}
          className="block h-1 w-full overflow-hidden rounded-full bg-surface-muted"
        >
          <span
            className={cn("block h-full rounded-full", percent >= 90 ? "bg-warning" : "bg-primary")}
            style={{ inlineSize: `${percent}%` }}
          />
        </span>
      )}
    </div>
  )
}

export function CopyCodeButton({ code, className }: { code: string; className?: string }) {
  const t = useTranslations("adminCoupons")
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success(t("table.copied", { code }))
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t("table.copy_failed"))
    }
  }
  const Icon = copied ? Check : Copy
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={t("table.copy", { code })}
      title={t("table.copy", { code })}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
    </button>
  )
}

export function scopeLabel(t: ReturnType<typeof useTranslations>, coupon: Pick<Coupon, "applies_to" | "course_ids" | "teacher_ids">) {
  if (coupon.applies_to === "courses") return t("scope.courses", { count: coupon.course_ids.length })
  if (coupon.applies_to === "teachers") return t("scope.teachers", { count: coupon.teacher_ids.length })
  return t("scope.all")
}

/** "until 12 Oct" / "from 1 Oct" / "1 Oct – 12 Oct" / "no expiry". */
export function ValidityLabel({ coupon }: { coupon: Pick<Coupon, "starts_at" | "expires_at"> }) {
  const t = useTranslations("adminCoupons")
  const locale = useLocale()
  const { starts_at: starts, expires_at: expires } = coupon
  if (starts && expires) return <>{t("table.range", { from: formatDate(locale, starts), to: formatDate(locale, expires) })}</>
  if (expires) return <>{t("table.until", { date: formatDate(locale, expires) })}</>
  if (starts) return <>{t("table.from", { date: formatDate(locale, starts) })}</>
  return <span className="text-on-surface-muted">{t("table.no_expiry")}</span>
}

/** Small marker shown only when the development demo client is active. */
export function DemoBadge() {
  const t = useTranslations("adminCoupons")
  if (!isCouponsDemo) return null
  return (
    <span
      title={t("demo.hint")}
      className="inline-flex items-center gap-1 rounded-full border border-dashed border-warning/60 bg-warning-tint/60 px-2 py-0.5 text-xs font-medium text-on-surface-muted"
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {t("demo.badge")}
      <span className="sr-only">{t("demo.hint")}</span>
    </span>
  )
}
