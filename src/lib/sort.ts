export type SortDirection = "asc" | "desc"
export type SortState<K extends string> = { key: K; direction: SortDirection }

/** Next state when a column header is clicked: new column → asc, same column → toggle. */
export function nextSort<K extends string>(current: SortState<K> | null, key: K): SortState<K> {
  if (!current || current.key !== key) return { key, direction: "asc" }
  return { key, direction: current.direction === "asc" ? "desc" : "asc" }
}

/** Stable sort by an accessor; strings compare with the locale, nulls sink to the end. */
export function sortRows<T, K extends string>(
  rows: readonly T[],
  sort: SortState<K> | null,
  accessors: Record<K, (row: T) => string | number | null | undefined>,
  locale: string,
): T[] {
  if (!sort) return [...rows]
  const read = accessors[sort.key]
  const factor = sort.direction === "asc" ? 1 : -1
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const x = read(a.row)
      const y = read(b.row)
      if (x == null && y == null) return a.index - b.index
      if (x == null) return 1
      if (y == null) return -1
      const result = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), locale, { numeric: true })
      return result * factor || a.index - b.index
    })
    .map(({ row }) => row)
}
