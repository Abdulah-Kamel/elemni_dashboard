import { getLocale, getTranslations } from "next-intl/server"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PaymentStatusBadge } from "@/features/billing/components/payment-status-badge"
import { formatMoney, initials } from "@/features/dashboard/format"
import { overviewLinks } from "@/features/dashboard/links"
import { formatRelative } from "@/features/dashboard/relative-time"
import type { TeacherSubscription } from "@/features/students/schema"
import { Link } from "@/i18n/routing"

/** Latest subscriptions as a compact feed; amounts are `total_paid` as sent. */
export async function ActivityFeed({
  subscriptions,
  now,
}: {
  subscriptions: TeacherSubscription[] | null
  now: Date
}) {
  const t = await getTranslations("teacherHome.activity")
  // Reuses the existing recent-subscriptions strings (title, empty, unavailable).
  const tr = await getTranslations("analytics.recent_subscriptions")
  const locale = await getLocale()
  const items = subscriptions?.slice(0, 5) ?? null

  return (
    <section aria-labelledby="activity-title" className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <h2 id="activity-title" className="text-sm font-semibold text-foreground">
          {tr("title")}
        </h2>
        <Link
          href={overviewLinks.students}
          className="rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("view_all")}
        </Link>
      </div>

      {items === null || items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-on-surface-muted">
          {items === null ? tr("unavailable") : tr("empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((s) => {
            const status = s.payment_status.toLowerCase()
            return (
              <li key={s.enrollment_id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar className="size-8 shrink-0 bg-primary-tint text-primary">
                  <AvatarFallback className="text-xs font-semibold">
                    {initials(s.student_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="truncate text-sm font-medium text-foreground w-fit max-w-full">
                    {s.student_name}
                  </p>
                  <p dir="auto" className="truncate text-xs text-on-surface-muted w-fit max-w-full">
                    {s.course.title}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {formatMoney(s.total_paid, s.currency, locale)}
                  </span>
                  {status === "completed" ? (
                    <time
                      dateTime={s.purchased_at}
                      title={new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(s.purchased_at))}
                      className="text-xs text-on-surface-muted"
                    >
                      {formatRelative(new Date(s.purchased_at), now, locale)}
                    </time>
                  ) : (
                    <PaymentStatusBadge status={status} />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
