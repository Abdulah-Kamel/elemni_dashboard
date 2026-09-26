"use client"

import { useAutoAnimate } from "@formkit/auto-animate/react"
import { PencilLine, Users } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { TopEarningCourse } from "@/features/analytics/schema"
import { overviewLinks } from "@/features/dashboard/links"
import { formatMoney } from "@/features/dashboard/format"
import { Link } from "@/i18n/routing"

/**
 * Ranked top-earning courses. Order, earnings and subscription counts are the
 * API's; the bar is only a visual proportion of the listed earnings values.
 * Row quick links appear on hover/focus (always shown on small screens).
 */
export function TopCourses({
  courses,
  currency,
  isFiltered,
}: {
  courses: TopEarningCourse[]
  currency: string
  isFiltered: boolean
}) {
  const t = useTranslations("teacherHome.top")
  const locale = useLocale()
  const [listRef] = useAutoAnimate<HTMLOListElement>({ duration: 200 })
  const max = courses.reduce((m, c) => Math.max(m, c.earning_amount), 0)

  return (
    <section
      aria-labelledby="top-courses-title"
      className="rounded-xl border border-border bg-surface"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div>
          <h2 id="top-courses-title" className="text-sm font-semibold text-foreground">
            {t("title")}
          </h2>
          <p className="mt-0.5 text-xs text-on-surface-muted">{t("subtitle")}</p>
        </div>
        <Link
          href={overviewLinks.courses}
          className="shrink-0 rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("view_all")}
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <p className="text-sm text-on-surface-muted">{t("empty")}</p>
          {isFiltered && (
            <Link
              href="/dashboard"
              scroll={false}
              className="rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t("show_all_time")}
            </Link>
          )}
        </div>
      ) : (
        <ol ref={listRef} className="divide-y divide-border">
          {courses.map((course, index) => {
            const share = max > 0 ? (course.earning_amount / max) * 100 : 0
            return (
              <li
                key={course.id}
                className="group grid grid-cols-[1.5rem_minmax(0,1fr)_8rem] items-center gap-x-3 px-4 py-3 transition-colors hover:bg-surface-muted/60 focus-within:bg-surface-muted/60"
              >
                <span className="text-sm font-semibold text-on-surface-muted tabular-nums">
                  {new Intl.NumberFormat(locale).format(index + 1)}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      dir="auto"
                      href={overviewLinks.courseEditor(course.id)}
                      className="min-w-0 truncate rounded text-sm font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {course.title}
                    </Link>
                    <span className="flex shrink-0 items-center gap-0.5 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                      <QuickLink
                        href={overviewLinks.courseEditor(course.id)}
                        label={t("edit", { course: course.title })}
                      >
                        <PencilLine className="size-3.5" aria-hidden="true" />
                      </QuickLink>
                      <QuickLink
                        href={overviewLinks.courseStudents(course.id)}
                        label={t("students", { course: course.title })}
                      >
                        <Users className="size-3.5" aria-hidden="true" />
                      </QuickLink>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-[width] duration-300 motion-reduce:transition-none"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>

                <div className="text-end">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {formatMoney(course.earning_amount, currency, locale)}
                  </p>
                  <p className="text-xs text-on-surface-muted">
                    {t("subscriptions", { count: course.student_subscription_count })}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function QuickLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-md text-on-surface-muted transition-colors hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {children}
    </Link>
  )
}
