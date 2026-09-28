"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import type { SortState } from "@/lib/sort"
import { cn } from "@/lib/utils"

/** Table header cell content that sorts its column. Use inside a <th aria-sort=…>. */
export function SortHeader<K extends string>({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string
  column: K
  sort: SortState<K> | null
  onSort: (column: K) => void
  className?: string
}) {
  const active = sort?.key === column
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn(
        "-mx-1 inline-flex min-h-8 items-center gap-1.5 rounded-md px-1 font-medium transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        active ? "text-foreground" : "text-on-surface-muted",
        className,
      )}
    >
      {label}
      <Icon className={cn("size-3.5", !active && "opacity-50")} aria-hidden="true" />
    </button>
  )
}

export function ariaSort<K extends string>(sort: SortState<K> | null, column: K) {
  if (sort?.key !== column) return "none" as const
  return sort.direction === "asc" ? ("ascending" as const) : ("descending" as const)
}
