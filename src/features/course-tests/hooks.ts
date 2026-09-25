"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { COURSE_TESTS_CHANGED, getCourseTestsClient, isCourseTestsDemo, type CourseTestsClient } from "./client"
import type { ActionResult } from "./types"

/**
 * Tell other mounted views (sidebar badge, lists) that course-test data
 * changed. The demo client already emits this on every write.
 */
export function notifyCourseTestsChanged() {
  if (!isCourseTestsDemo && typeof window !== "undefined") window.dispatchEvent(new Event(COURSE_TESTS_CHANGED))
}

export function subscribeCourseTestsChanged(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(COURSE_TESTS_CHANGED, onChange)
  // Other tabs (demo mode persists to localStorage).
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(COURSE_TESTS_CHANGED, onChange)
    window.removeEventListener("storage", onChange)
  }
}

/** Resolve the active client (API or demo) and run one call on it. */
export async function callClient<T>(operation: (client: CourseTestsClient) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const client = await getCourseTestsClient()
  return operation(client)
}

export type Loadable<T> = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; data: T }

/**
 * Loads data through the course-tests client and reloads whenever the data
 * changes (COURSE_TESTS_CHANGED). `initial` (server-fetched in API mode)
 * skips the first client round-trip.
 */
export function useCourseTestsQuery<T>(load: (client: CourseTestsClient) => Promise<ActionResult<T>>, deps: unknown[], initial?: T): Loadable<T> & { reload: () => void } {
  const [state, setState] = useState<Loadable<T>>(initial !== undefined ? { status: "ready", data: initial } : { status: "loading" })
  const [version, setVersion] = useState(0)
  const loadRef = useRef(load)
  const skipFirst = useRef(initial !== undefined)

  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => subscribeCourseTestsChanged(() => setVersion((value) => value + 1)), [])

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false
      return
    }
    let cancelled = false
    callClient(loadRef.current).then(
      (result) => {
        if (cancelled) return
        setState(result.ok ? { status: "ready", data: result.data } : { status: "error", error: result.error })
      },
      () => {
        if (!cancelled) setState({ status: "error", error: "" })
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's query key
  }, [version, ...deps])

  return { ...state, reload: () => setVersion((value) => value + 1) }
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {}
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  )
}

/**
 * Animates a number towards `target`. With `animateInitial` the first value
 * counts up from 0 (use it for data loaded on the client, not server-rendered
 * values, to avoid a flash). Reduced motion always shows the target directly.
 */
export function useCountUp(target: number | null, animateInitial: boolean, durationMs = 700): number | null {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState<number | null>(animateInitial && !reduced && target !== null ? 0 : target)
  const fromRef = useRef(animateInitial ? 0 : (target ?? 0))

  useEffect(() => {
    if (target === null || reduced || fromRef.current === target) {
      fromRef.current = target ?? 0
      const id = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(id)
    }
    const from = fromRef.current
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, reduced, durationMs])

  return value
}
