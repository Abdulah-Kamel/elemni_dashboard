import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { formatDate, formatRelative } from "../format"
import type { AdminUsageSyncFailurePage } from "../schema"

/**
 * Teacher usage days the nightly Bunny sync could not fetch, so they are not
 * billed yet. The attention panel links here; rendered only when there are any.
 */
export async function UsageSyncFailures({ page }: { page: AdminUsageSyncFailurePage }) {
  const c = await getTranslations("adminConsole")
  const locale = await getLocale()
  const hidden = page.total - page.items.length

  return (
    <section id="usage-sync-failures" aria-labelledby="usage-sync-failures-title" className="scroll-mt-24 rounded-xl border border-destructive/30 bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 id="usage-sync-failures-title" className="text-sm font-semibold">{c("usageSync.title")}</h2>
        <p className="mt-1 text-xs text-on-surface-muted">{c("usageSync.hint")}</p>
      </div>
      <ul className="divide-y divide-border">
        {page.items.map((failure) => (
          <li key={failure.id}>
            <Link
              href={`/admin/teachers?view=${failure.teacher_user_id}` as never}
              className="block px-4 py-2.5 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium">{failure.teacher_name ?? failure.teacher_slug ?? failure.teacher_email}</span>
                <time dateTime={failure.date} className="shrink-0 text-xs font-semibold text-destructive">
                  {formatDate(locale, failure.date)}
                </time>
              </span>
              <span className="mt-0.5 block truncate text-xs text-on-surface-muted" title={failure.error} dir="ltr">
                {failure.error}
              </span>
              <span className="mt-0.5 block text-xs text-on-surface-muted">
                {c("usageSync.attempts", { count: failure.attempts })} ·{" "}
                <time dateTime={failure.last_failed_at} title={formatDate(locale, failure.last_failed_at, "long")}>
                  {c("usageSync.last_failed", { time: formatRelative(locale, failure.last_failed_at) })}
                </time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {hidden > 0 && <p className="border-t border-border px-4 py-2 text-xs text-on-surface-muted">{c("usageSync.more", { count: hidden })}</p>}
    </section>
  )
}
