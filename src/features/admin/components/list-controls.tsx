"use client"

import type { MouseEvent, ReactNode } from "react"
import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[12rem] flex-1">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 ps-9"
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  )
}

/** One-click filter group; each option is a toggle button (aria-pressed). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-surface-muted p-0.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-full rounded-md px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              active ? "bg-surface text-foreground shadow-xs" : "text-on-surface-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function FilterBar({ children, onClear, activeCount }: { children: ReactNode; onClear: () => void; activeCount: number }) {
  const c = useTranslations("adminConsole")
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3">
      {children}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-on-surface-muted">
          <X className="size-3.5" aria-hidden="true" />
          {c("filters.clear", { count: activeCount })}
        </Button>
      )}
    </div>
  )
}

export function FilteredEmpty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  const t = useTranslations("admin")
  const c = useTranslations("adminConsole")
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <p className="text-sm text-on-surface-muted">{filtered ? t("no_results") : c("empty.generic")}</p>
      {filtered && (
        <Button variant="outline" size="sm" onClick={onClear}>
          {c("filters.clear_all")}
        </Button>
      )}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface" aria-busy="true">
      <div className="h-11 bg-surface-muted" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function ListError({ onRetry }: { onRetry: () => void }) {
  const c = useTranslations("adminConsole")
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-4 py-12 text-center">
      <p className="text-sm text-destructive">{c("errors.list")}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {c("errors.retry")}
      </Button>
    </div>
  )
}

/** Sorting runs on the rows already loaded; say so when there is more than one page. */
export function PageSortNote({ show }: { show: boolean }) {
  const c = useTranslations("adminConsole")
  if (!show) return null
  return <p className="px-4 py-2 text-xs text-on-surface-muted">{c("filters.sort_page_only")}</p>
}

/** Row props that make a table row open its side panel by mouse, while the name button covers keyboard. */
export function rowOpenProps(open: () => void, selected: boolean) {
  return {
    onClick: (event: MouseEvent<HTMLTableRowElement>) => {
      if ((event.target as HTMLElement).closest("button, a, input, [role=menuitem]")) return
      open()
    },
    className: cn("cursor-pointer transition-colors hover:bg-surface-muted/60", selected && "bg-primary-tint/40 hover:bg-primary-tint/50"),
  }
}
