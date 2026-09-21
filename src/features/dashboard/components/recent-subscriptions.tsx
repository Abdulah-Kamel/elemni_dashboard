"use client"

import { useLocale, useTranslations } from "next-intl"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { PaymentStatusBadge } from "@/features/billing/components/payment-status-badge"
import type { TeacherSubscription } from "@/features/students/schema"
import { Link } from "@/i18n/routing"

export function RecentSubscriptions({
  subscriptions,
}: {
  subscriptions: TeacherSubscription[] | null
}) {
  const t = useTranslations("analytics.recent_subscriptions")
  const locale = useLocale()
  const visibleSubscriptions = subscriptions?.slice(0, 5) ?? null

  return (
    <Card className="overflow-hidden rounded-2xl border border-border shadow-xs">
      <div className="flex items-center justify-between gap-4 border-b border-border px-md py-4">
        <h2 className="text-title-lg font-semibold text-foreground">
          {t("title")}
        </h2>
        <Link
          href="/students"
          className="text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("view_all")}
        </Link>
      </div>

      {visibleSubscriptions === null ? (
        <ActivityState message={t("unavailable")} />
      ) : visibleSubscriptions.length === 0 ? (
        <ActivityState message={t("empty")} />
      ) : (
        <ul className="divide-y divide-border">
          {visibleSubscriptions.map((subscription) => (
            <li
              key={subscription.enrollment_id}
              className="flex flex-col gap-3 px-md py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-10 shrink-0 bg-primary-tint text-primary">
                  <AvatarFallback className="font-semibold">
                    {getInitials(subscription.student_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {subscription.student_name}
                  </p>
                  <p className="truncate text-sm text-on-surface-muted">
                    {t("subscribed_to", { course: subscription.course.title })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <PaymentStatusBadge status={subscription.payment_status} />
                <span className="font-semibold text-foreground tabular-nums" dir="ltr">
                  {formatMoney(subscription.total_paid, subscription.currency, locale)}
                </span>
                <time
                  dateTime={subscription.purchased_at}
                  className="text-sm text-on-surface-muted tabular-nums"
                >
                  {formatDate(subscription.purchased_at, locale)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function ActivityState({ message }: { message: string }) {
  return <p className="px-md py-8 text-center text-sm text-on-surface-muted">{message}</p>
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value)
  )
}
