"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, CircleOff, Pencil, Power, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminSheet, FactList, SheetLoading, SheetSection } from "@/features/admin/components/admin-sheet"
import { formatDate, formatMoney } from "@/features/admin/format"
import { formatDiscount } from "../format"
import { REDEMPTIONS_PAGE_SIZE, useRedemptions } from "../hooks/use-coupons"
import type { Coupon } from "../schema"
import { CopyCodeButton, CouponStatusBadge, UsageMeter, ValidityLabel, scopeLabel } from "./coupon-bits"
import { errorText } from "./coupon-form-dialog"

type Props = {
  code: string | null
  coupon: Coupon | undefined
  loading: boolean
  onClose: () => void
  onEdit: (coupon: Coupon) => void
  onToggle: (coupon: Coupon) => void
  onDelete: (coupon: Coupon) => void
  togglePending: boolean
}

export function CouponSheet({ code, coupon, loading, onClose, onEdit, onToggle, onDelete, togglePending }: Props) {
  const t = useTranslations("adminCoupons")
  const locale = useLocale()
  const used = (coupon?.used_count ?? 0) > 0

  return (
    <AdminSheet
      open={code !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={
        <span className="flex items-center gap-1.5">
          <span dir="ltr" className="font-mono tracking-wide">{code}</span>
          {code && <CopyCodeButton code={code} />}
        </span>
      }
      description={coupon?.description || undefined}
      badges={coupon && <CouponStatusBadge status={coupon.status} />}
      footer={
        coupon && (
          <div className="flex w-full flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(coupon)}>
                <Pencil className="size-4" aria-hidden="true" />
                {t("sheet.edit")}
              </Button>
              <Button variant="outline" size="sm" disabled={togglePending} onClick={() => onToggle(coupon)}>
                {coupon.is_active ? <CircleOff className="size-4" aria-hidden="true" /> : <Power className="size-4" aria-hidden="true" />}
                {coupon.is_active ? t("sheet.deactivate") : t("sheet.activate")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ms-auto text-destructive hover:text-destructive"
                disabled={used}
                aria-describedby={used ? "coupon-delete-blocked" : undefined}
                onClick={() => onDelete(coupon)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {t("sheet.delete")}
              </Button>
            </div>
            {used && (
              <p id="coupon-delete-blocked" className="text-xs text-on-surface-muted">
                {t("sheet.delete_blocked", { count: coupon.used_count })}
              </p>
            )}
          </div>
        )
      }
    >
      {loading ? (
        <SheetLoading />
      ) : !coupon ? (
        <p className="text-sm text-on-surface-muted">{t("sheet.not_found")}</p>
      ) : (
        <>
          <SheetSection title={t("sheet.discount")}>
            <FactList
              items={[
                { label: t("sheet.value"), value: <span dir="ltr">{formatDiscount(locale, coupon)}</span> },
                { label: t("sheet.type"), value: coupon.type === "percentage" ? t("form.percentage") : t("form.fixed") },
                { label: t("sheet.min_price"), value: coupon.min_price ? formatMoney(locale, coupon.min_price, coupon.currency) : t("sheet.none") },
                { label: t("sheet.scope"), value: scopeLabel(t, coupon) },
              ]}
            />
            {coupon.applies_to !== "all" && (
              <p className="text-xs text-on-surface-muted">
                {coupon.applies_to === "courses" ? t("sheet.course_ids") : t("sheet.teacher_ids")}{" "}
                <span dir="ltr" className="font-mono">
                  {(coupon.applies_to === "courses" ? coupon.course_ids : coupon.teacher_ids).join(", ")}
                </span>
              </p>
            )}
          </SheetSection>

          <SheetSection title={t("sheet.limits")}>
            <div className="rounded-lg border border-border p-3">
              <UsageMeter used={coupon.used_count} max={coupon.max_uses} />
            </div>
            <FactList
              items={[
                { label: t("sheet.validity"), value: <ValidityLabel coupon={coupon} /> },
                { label: t("sheet.per_student"), value: coupon.max_uses_per_student ?? t("table.unlimited") },
                { label: t("sheet.created"), value: formatDate(locale, coupon.created_at) },
                { label: t("sheet.status"), value: t(`status.${coupon.status}`) },
              ]}
            />
          </SheetSection>

          <RedemptionsSection key={coupon.code} code={coupon.code} currency={coupon.currency} />
        </>
      )}
    </AdminSheet>
  )
}

function RedemptionsSection({ code, currency }: { code: string; currency: string }) {
  const t = useTranslations("adminCoupons")
  const locale = useLocale()
  const [page, setPage] = useState(1)
  const query = useRedemptions(code, page)
  const result = query.data
  const total = result?.ok ? result.data.total : 0
  const pages = Math.max(1, Math.ceil(total / REDEMPTIONS_PAGE_SIZE))
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft
  const Next = locale === "ar" ? ChevronLeft : ChevronRight

  return (
    <SheetSection title={t("sheet.redemptions", { count: total })}>
      {query.isLoading ? (
        <SheetLoading />
      ) : query.isError || (result && !result.ok) ? (
        <div role="alert" className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
          <span className="text-destructive">{result && !result.ok ? errorText(t, result.error) : t("errors.upstream")}</span>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            {t("errors.retry")}
          </Button>
        </div>
      ) : total === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-on-surface-muted">{t("sheet.redemptions_empty")}</p>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-lg border border-border" data-stale={query.isPlaceholderData}>
            {result?.ok &&
              result.data.items.map((item, index) => (
                <li key={`${item.redeemed_at}-${index}`} className="flex items-start justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.student_name}</p>
                    <p className="truncate text-xs text-on-surface-muted">
                      {item.course_title} · {formatDate(locale, item.redeemed_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-end text-xs tabular-nums">
                    <p className="font-medium">{formatMoney(locale, item.final_price, currency)}</p>
                    <p className="text-success">{t("sheet.saved", { amount: formatMoney(locale, item.discount_amount, currency) })}</p>
                  </div>
                </li>
              ))}
          </ul>
          {pages > 1 && (
            <div className="flex items-center justify-between text-xs text-on-surface-muted">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label={t("pagination.previous")}>
                <Prev className="size-4" aria-hidden="true" />
              </Button>
              <span>{t("pagination.page", { page, pages })}</span>
              <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label={t("pagination.next")}>
                <Next className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}
    </SheetSection>
  )
}
