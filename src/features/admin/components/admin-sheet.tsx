"use client"

import type { ReactNode } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Side panel used by every admin list for "quick look" details. It opens from
 * the inline-end edge (left in Arabic), traps focus and closes on Esc via the
 * Sheet primitive.
 */
export function AdminSheet({
  open,
  onOpenChange,
  title,
  description,
  badges,
  footer,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  badges?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  const tClose = useTranslations("dashboardShell")
  const locale = useLocale()
  const t = useTranslations("adminConsole")
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent closeLabel={tClose("close")}
        side={locale === "ar" ? "left" : "right"}
        className="w-full gap-0 data-[side=left]:sm:max-w-[32rem] data-[side=right]:sm:max-w-[32rem]"
        aria-label={t("sheet.label")}
      >
        <SheetHeader className="gap-1 border-b border-border px-5 pt-5 pb-4 pe-12">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          {description && <SheetDescription className="break-all text-on-surface-muted">{description}</SheetDescription>}
          {badges && <div className="mt-2 flex flex-wrap items-center gap-1.5">{badges}</div>}
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-5 px-5 py-4">{children}</div>
        {footer && <SheetFooter className="sticky bottom-0 border-t border-border bg-popover px-5 py-3">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}

export function SheetSection({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-on-surface-muted uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

export function FactList({ items }: { items: { label: string; value: ReactNode; ltr?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border p-3">
      {items.map(({ label, value, ltr }) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-on-surface-muted">{label}</dt>
          <dd className="mt-0.5 truncate text-sm font-medium">
            {value == null || value === "" ? "—" : ltr ? <span dir="ltr">{value}</span> : value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function SheetLoading() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  )
}
