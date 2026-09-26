"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { ParamReader } from "../url-state"

const EMPTY: ParamReader = { get: () => null }

/**
 * List filters that live in the URL, so tiles and attention rows can deep-link
 * into a filtered list and a reload keeps the view. Writes use
 * `history.replaceState`, which Next's router picks up without a server
 * round-trip. With `sync: false` (a list embedded in another page) the same
 * state is kept locally instead.
 */
export function useUrlFilters<T extends object>(
  parse: (params: ParamReader) => T,
  serialize: (value: T) => URLSearchParams,
  { sync = true }: { sync?: boolean } = {},
): [T, (patch: Partial<T>) => void] {
  const searchParams = useSearchParams()
  const query = sync ? (searchParams?.toString() ?? "") : ""
  const fromUrl = useMemo(() => (query ? parse(new URLSearchParams(query)) : parse(EMPTY)), [parse, query])
  const [local, setLocal] = useState<T>(() => parse(EMPTY))

  const update = useCallback(
    (patch: Partial<T>) => {
      if (!sync) {
        setLocal((previous) => ({ ...previous, ...patch }))
        return
      }
      const current = parse(new URLSearchParams(window.location.search))
      const next = serialize({ ...current, ...patch }).toString()
      window.history.replaceState(null, "", next ? `?${next}` : window.location.pathname)
    },
    [parse, serialize, sync],
  )

  return [sync ? fromUrl : local, update]
}

/**
 * Search box state: typing is local and immediate, the URL follows after a
 * short pause. External URL changes (a deep link) replace the draft.
 */
export function useDebouncedSearch(value: string, commit: (next: string) => void, delay = 300) {
  const [draft, setDraft] = useState(value)
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (draft.trim() !== value) setDraft(value)
  }
  useEffect(() => {
    const next = draft.trim()
    if (next === value) return
    const id = window.setTimeout(() => commit(next), delay)
    return () => window.clearTimeout(id)
  }, [draft, value, commit, delay])
  return [draft, setDraft] as const
}
