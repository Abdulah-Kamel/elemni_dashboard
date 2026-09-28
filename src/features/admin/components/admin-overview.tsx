import {
  Banknote,
  CircleAlert,
  Clock3,
  CopyX,
  GraduationCap,
  ReceiptText,
  UserRoundX,
  Users,
  VideoOff,
} from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { AttentionList, type AttentionItem } from "@/components/ui/attention-list"
import { StatTile } from "@/components/ui/stat-tile"
import { deriveAdminAttention, type AdminAttentionCounts, type AttentionKind } from "../attention"
import { formatDate, formatMoney, formatRelative, initials } from "../format"
import type { AdminOverview, AdminSubscriptionPage, AdminTeacherPage } from "../schema"

const attentionIcons: Record<AttentionKind, AttentionItem["icon"]> = {
  duplicatePayments: CopyX,
  failedPayments: CircleAlert,
  teachersWithoutLibrary: VideoOff,
  inactiveTeachers: UserRoundX,
  pendingPayments: Clock3,
}

const LATEST_TEACHERS = 5

export async function AdminOverviewView({
  overview,
  teachers,
  subscriptions,
  attention,
}: {
  overview: AdminOverview
  teachers: AdminTeacherPage
  subscriptions: AdminSubscriptionPage
  attention: AdminAttentionCounts
}) {
  const t = await getTranslations("admin")
  const c = await getTranslations("adminConsole")
  const locale = await getLocale()
  const number = new Intl.NumberFormat(locale)

  const attentionItems: AttentionItem[] = deriveAdminAttention(attention).map((item) => ({
    ...item,
    label: c(`attention.${item.id}`, { count: item.count }),
    icon: attentionIcons[item.id],
  }))
  const latestTeachers = teachers.items.slice(0, LATEST_TEACHERS)

  return (
    <div className="flex flex-col gap-lg">
      <header className="animate-slide-up">
        <h1 className="text-headline-md font-semibold">{t("overview_title")}</h1>
        <p className="mt-1 text-on-surface-muted">{t("overview_subtitle")}</p>
      </header>

      <section aria-label={c("tiles.label")} className="grid animate-slide-up grid-cols-2 gap-md xl:grid-cols-4 [&>*]:min-w-0">
        <StatTile
          label={t("overview_teachers")}
          value={number.format(overview.active_teacher_total)}
          hint={c("tiles.of_total", { total: overview.teacher_total })}
          icon={GraduationCap}
          href="/admin/teachers?status=active"
        />
        <StatTile
          label={t("overview_students")}
          value={number.format(overview.active_student_total)}
          hint={c("tiles.of_total", { total: overview.student_total })}
          icon={Users}
          href="/admin/students?status=active"
        />
        <StatTile
          label={c("tiles.completed_subscriptions")}
          value={number.format(overview.completed_subscription_total)}
          hint={c("tiles.open_list")}
          icon={ReceiptText}
          href="/admin/subscriptions"
        />
        <StatTile
          label={t("overview_revenue")}
          value={<span dir="ltr" className="block text-lg break-words sm:text-2xl">{formatMoney(locale, overview.collected_revenue, overview.currency)}</span>}
          hint={c("tiles.revenue_hint")}
          icon={Banknote}
          href="/admin/subscriptions"
        />
      </section>

      <div className="grid animate-slide-up gap-md animate-stagger-1 xl:grid-cols-3 [&>*]:min-w-0">
        <div className="flex min-w-0 flex-col gap-md">
          <AttentionList
            title={c("attention.title")}
            items={attentionItems}
            emptyLabel={c("attention.empty")}
            dir={locale === "ar" ? "rtl" : "ltr"}
          />

          <section aria-labelledby="latest-teachers" className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id="latest-teachers" className="text-sm font-semibold">{t("recent_teachers")}</h2>
              <Link href="/admin/teachers" className="text-xs font-semibold text-primary hover:underline">
                {t("view_all")}
              </Link>
            </div>
            {latestTeachers.length === 0 ? (
              <p className="px-4 py-6 text-sm text-on-surface-muted">{c("empty.teachers")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {latestTeachers.map((teacher) => (
                  <li key={teacher.id}>
                    <Link
                      href={`/admin/teachers?view=${teacher.id}` as never}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-tint text-xs font-semibold text-primary">
                        {initials(teacher.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{teacher.name}</span>
                        <span className="block text-xs text-on-surface-muted">
                          {formatRelative(locale, teacher.created_at)}
                        </span>
                      </span>
                      {!teacher.has_library && (
                        <span className="rounded-full bg-warning-tint px-2 py-0.5 text-xs font-medium text-warning">
                          {c("library_short_missing")}
                        </span>
                      )}
                      <span
                        className={
                          teacher.is_active
                            ? "size-2 shrink-0 rounded-full bg-success"
                            : "size-2 shrink-0 rounded-full bg-on-surface-muted/40"
                        }
                        aria-label={teacher.is_active ? t("status_active") : t("status_inactive")}
                        role="img"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section aria-labelledby="latest-subscriptions" className="rounded-xl border border-border bg-surface xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 id="latest-subscriptions" className="text-sm font-semibold">{t("recent_subscriptions")}</h2>
            <Link href="/admin/subscriptions" className="text-xs font-semibold text-primary hover:underline">
              {t("view_all")}
            </Link>
          </div>
          {subscriptions.items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-on-surface-muted">{c("empty.subscriptions")}</p>
          ) : (
            <ol className="divide-y divide-border">
              {subscriptions.items.map((item) => (
                <li key={item.enrollment_id}>
                  <Link
                    href={`/admin/subscriptions?view=${item.enrollment_id}` as never}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-semibold text-on-surface-muted">
                      {initials(item.student_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {c.rich("feed.subscribed", {
                          student: item.student_name,
                          course: item.course.title,
                          strong: (chunks) => <span className="font-semibold">{chunks}</span>,
                        })}
                      </span>
                      <time
                        dateTime={item.purchased_at}
                        title={formatDate(locale, item.purchased_at, "long")}
                        className="block text-xs text-on-surface-muted"
                      >
                        {formatRelative(locale, item.purchased_at)}
                      </time>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums" dir="ltr">
                      {formatMoney(locale, item.total_paid, item.currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
