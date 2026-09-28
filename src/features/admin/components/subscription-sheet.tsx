"use client"

import { UserRound } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "@/features/billing/components/payment-status-badge"
import { formatDate, formatMoney } from "../format"
import type { AdminSubscriptionPage } from "../schema"
import { AdminSheet, FactList, SheetLoading, SheetSection } from "./admin-sheet"

type Subscription = AdminSubscriptionPage["items"][number]

/** Payment details for one enrollment. Everything shown comes from the list row. */
export function SubscriptionSheet({
  open,
  subscription,
  loading = false,
  onClose,
}: {
  open: boolean
  subscription: Subscription | undefined
  loading?: boolean
  onClose: () => void
}) {
  const t = useTranslations("admin")
  const c = useTranslations("adminConsole")
  const locale = useLocale()

  return (
    <AdminSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={subscription?.course.title ?? c("sheet.subscription_title")}
      description={subscription ? c("sheet.enrollment_id", { id: subscription.enrollment_id }) : undefined}
      badges={subscription && <PaymentStatusBadge status={subscription.payment_status} />}
      footer={
        subscription && (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={`/admin/students?q=${encodeURIComponent(subscription.student_email)}&view=${subscription.student_id}` as never}
              />
            }
          >
            <UserRound className="size-4" aria-hidden="true" />
            {c("sheet.open_student")}
          </Button>
        )
      }
    >
      {subscription ? (
        <>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-on-surface-muted">{c("fields.amount_paid")}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums" dir="ltr">
              {formatMoney(locale, subscription.total_paid, subscription.currency)}
            </p>
          </div>
          <SheetSection title={c("sheet.payment")}>
            <FactList
              items={[
                { label: c("fields.purchased_at"), value: formatDate(locale, subscription.purchased_at, "long") },
                { label: c("fields.expires_at"), value: formatDate(locale, subscription.expires_at, "long") },
                { label: c("fields.currency"), value: subscription.currency, ltr: true },
                { label: t("table_status"), value: <PaymentStatusBadge status={subscription.payment_status} /> },
              ]}
            />
          </SheetSection>
          <SheetSection title={t("table_student")}>
            <FactList
              items={[
                { label: t("field_name"), value: subscription.student_name },
                { label: t("field_email"), value: subscription.student_email, ltr: true },
                { label: t("field_phone"), value: subscription.student_phone, ltr: true },
                { label: c("fields.whatsapp"), value: subscription.whatsapp_number, ltr: true },
                { label: c("fields.parent_phone"), value: subscription.parent_phone, ltr: true },
                { label: t("table_level"), value: [subscription.grade_name, subscription.stream_name].filter(Boolean).join(" · ") },
              ]}
            />
          </SheetSection>
        </>
      ) : loading ? (
        <SheetLoading />
      ) : (
        <p className="text-sm text-on-surface-muted">{c("sheet.subscription_not_on_page")}</p>
      )}
    </AdminSheet>
  )
}
