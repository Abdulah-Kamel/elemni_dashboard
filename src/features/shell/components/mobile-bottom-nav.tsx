"use client"

import { useTranslations } from "next-intl"
import { MoreHorizontal } from "lucide-react"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { isNavActive, navFor, roleFromUserRole } from "@/features/shell/nav-config"

const tabClass =
  "flex min-h-11 min-w-11 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"

export function MobileBottomNav({ userRole }: { userRole?: string }) {
  const tClose = useTranslations("dashboardShell")
  const tNav = useTranslations("sidebar")
  const pathname = usePathname()
  const role = roleFromUserRole(userRole)
  const items = navFor(role)
  const primary = items.filter((item) => item.mobile)
  const overflow = items.filter((item) => !item.mobile)
  const overflowActive = overflow.some((item) => isNavActive(item.href, pathname, role))

  return (
    <nav className="fixed start-0 bottom-0 z-50 flex w-full items-center justify-around border-t border-border bg-surface px-1 py-1 md:hidden safe-area-bottom">
      {primary.map(({ id, href, icon: Icon }) => {
        const active = isNavActive(href, pathname, role)
        return (
          <Link
            key={id}
            href={href as never}
            aria-current={active ? "page" : undefined}
            className={cn(
              tabClass,
              active ? "bg-primary-tint text-primary" : "text-on-surface-muted hover:text-on-surface"
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="max-w-[60px] truncate text-label-sm font-semibold leading-tight">{tNav(id as never)}</span>
          </Link>
        )
      })}
      {overflow.length > 0 && (
        <Sheet>
          <SheetTrigger
            className={cn(
              tabClass,
              overflowActive ? "bg-primary-tint text-primary" : "text-on-surface-muted hover:text-on-surface"
            )}
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
            <span className="max-w-[60px] truncate text-label-sm font-semibold leading-tight">{tNav("more")}</span>
          </SheetTrigger>
          <SheetContent closeLabel={tClose("close")} side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{tNav("catalog")}</SheetTitle>
            </SheetHeader>
            <div className="grid gap-1.5 px-4 pb-6">
              {overflow.map(({ id, href, icon: Icon }) => {
                const active = isNavActive(href, pathname, role)
                return (
                  <Link
                    key={id}
                    href={href as never}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 font-medium",
                      active ? "bg-primary-tint text-primary" : "bg-surface-muted text-on-surface"
                    )}
                  >
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    {tNav(id as never)}
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </nav>
  )
}
