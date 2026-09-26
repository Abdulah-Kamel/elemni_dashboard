"use client"

import { Fragment } from "react"
import { useTranslations } from "next-intl"
import { ChevronRight } from "lucide-react"
import { Link, usePathname } from "@/i18n/routing"
import { pageTrail, type Crumb, type NavRole } from "@/features/shell/nav-config"

/**
 * Start side of the top bar: the current section's name from the nav config,
 * or a breadcrumb on deeper routes (course → chapter, teacher details).
 */
export function PageContext({ role }: { role: NavRole }) {
  const tNav = useTranslations("sidebar")
  const t = useTranslations("dashboardShell")
  const pathname = usePathname()
  const trail = pageTrail(pathname, role)

  if (trail.length === 0) return <div className="min-w-0" />

  const label = (crumb: Crumb) =>
    crumb.navId ? tNav(crumb.navId as never) : t(`crumbs.${crumb.labelKey}` as never)

  return (
    <nav aria-label={t("breadcrumb_label")} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1
          return (
            <Fragment key={crumb.href}>
              {index > 0 && (
                <li aria-hidden="true" className="hidden shrink-0 text-on-surface-subtle sm:block">
                  <ChevronRight className="size-4 rtl:rotate-180" />
                </li>
              )}
              <li className={last ? "min-w-0" : "hidden min-w-0 shrink-0 sm:block"}>
                {last ? (
                  <span
                    aria-current="page"
                    className="block truncate text-title-md font-semibold text-on-surface"
                  >
                    {label(crumb)}
                  </span>
                ) : (
                  <Link
                    href={crumb.href as never}
                    className="block truncate rounded text-body-lg text-on-surface-muted transition-colors hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {label(crumb)}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
