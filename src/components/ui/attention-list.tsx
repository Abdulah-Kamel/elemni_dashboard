import type { ComponentType } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"

export type AttentionItem = {
  id: string
  label: string
  count: number
  href: string
  icon: ComponentType<{ className?: string }>
  tone?: "warning" | "primary" | "destructive"
}

const toneClass = {
  warning: "bg-warning-tint text-warning",
  primary: "bg-primary-tint text-primary",
  destructive: "bg-destructive/10 text-destructive",
}

/**
 * "Needs your attention": each row is a count that links to the filtered
 * list where the work happens. Rows with a zero count are hidden; when
 * nothing needs attention the caller's empty state shows instead.
 */
export function AttentionList({
  title,
  items,
  emptyLabel,
  dir = "rtl",
  className,
}: {
  title: string
  items: AttentionItem[]
  emptyLabel: string
  dir?: "rtl" | "ltr"
  className?: string
}) {
  const visible = items.filter((item) => item.count > 0)
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight
  return (
    <section aria-label={title} className={cn("rounded-xl border border-border bg-surface", className)}>
      <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">{title}</h2>
      {visible.length === 0 ? (
        <p className="px-4 py-6 text-sm text-on-surface-muted">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map(({ id, label, count, href, icon: Icon, tone = "primary" }) => (
            <li key={id}>
              <Link
                href={href as never}
                className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
              >
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", toneClass[tone])}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm text-foreground">{label}</span>
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-foreground tabular-nums">{count}</span>
                <Chevron className="size-4 shrink-0 text-on-surface-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
