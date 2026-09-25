import type { ComponentType, ReactNode } from "react"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type StatTileProps = {
  label: string
  value: ReactNode
  /** Short supporting line under the value, e.g. "3 بانتظار التصحيح". */
  hint?: ReactNode
  icon?: ComponentType<{ className?: string }>
  /** When set, the whole tile links to the list this number summarises. */
  href?: string
  tone?: "default" | "primary" | "warning" | "success"
  className?: string
}

const toneRing: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "",
  primary: "border-primary/40 bg-primary-tint/40",
  warning: "border-warning/50 bg-warning-tint/40",
  success: "border-success/40 bg-success-tint/40",
}

/** A single headline number. Clickable tiles drill into the filtered list behind it. */
export function StatTile({ label, value, hint, icon: Icon, href, tone = "default", className }: StatTileProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-on-surface-muted">{label}</span>
        {Icon && <Icon className="size-4 shrink-0 text-on-surface-muted" aria-hidden="true" />}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-on-surface-muted">{hint}</div>}
    </>
  )
  const base = cn("block rounded-xl border border-border bg-surface p-4 transition-colors", toneRing[tone], className)

  if (!href) return <div className={base}>{body}</div>
  return (
    <Link
      href={href as never}
      className={cn(
        base,
        "group hover:border-primary/50 hover:bg-primary-tint/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
      )}
    >
      {body}
    </Link>
  )
}
