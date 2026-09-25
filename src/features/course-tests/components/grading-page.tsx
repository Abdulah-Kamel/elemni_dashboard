"use client"

import { useId, useMemo, useState, useSyncExternalStore } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, CheckCircle2, Inbox, Loader2, RotateCw, UserRound } from "lucide-react"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { callClient, notifyCourseTestsChanged, useCourseTestsQuery } from "../hooks"
import { buildPseudonyms, ERROR_TEXT, previewTotal, relativeTime, sortQueue, SUCCESS_TEXT, WARNING_TEXT, wordCount } from "../ui-utils"
import type { GradingQueueItem } from "../types"
import { DemoBadge } from "./demo-badge"
import { ScoreChips } from "./grading-score-chips"

type Filter = "pending" | "graded"

const ANONYMOUS_KEY = "elemni:grading-anonymous"
const ANONYMOUS_EVENT = "elemni:grading-anonymous-change"

// Fallback when storage is unavailable (private mode, blocked site data).
let anonymousInMemory = true

function readAnonymous() {
  try {
    const stored = window.localStorage.getItem(ANONYMOUS_KEY)
    return stored === null ? anonymousInMemory : stored !== "false"
  } catch {
    return anonymousInMemory
  }
}

function subscribeAnonymous(onChange: () => void) {
  window.addEventListener(ANONYMOUS_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(ANONYMOUS_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

function setAnonymous(value: boolean) {
  anonymousInMemory = value
  try {
    window.localStorage.setItem(ANONYMOUS_KEY, String(value))
  } catch {
    // Storage unavailable: the in-memory value above still applies for this session.
  }
  window.dispatchEvent(new Event(ANONYMOUS_EVENT))
}

/** Next pending item after `current` in queue order (wrapping), excluding `current`. */
export function nextPendingId(items: GradingQueueItem[], current: number | null): number | null {
  const pending = items.filter((item) => item.status === "pending")
  if (pending.length === 0) return null
  const ordered = sortQueue(items)
  const start = current === null ? -1 : ordered.findIndex((item) => item.answer_id === current)
  for (let step = 1; step <= ordered.length; step++) {
    const candidate = ordered[(start + step + ordered.length) % ordered.length]
    if (candidate.status === "pending" && candidate.answer_id !== current) return candidate.answer_id
  }
  return null
}

export function GradingWorkspace({ testId, initialFilter = "pending", initial }: { testId?: number; initialFilter?: Filter; initial?: GradingQueueItem[] }) {
  const t = useTranslations("courseTests.grading")
  const locale = useLocale()
  const query = useCourseTestsQuery<GradingQueueItem[]>((client) => client.getGradingQueue(testId ? { testId } : undefined), [testId], initial)
  const anonymous = useSyncExternalStore(subscribeAnonymous, readAnonymous, () => true)
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [listRef] = useAutoAnimate<HTMLUListElement>({ duration: 220 })

  const items = useMemo(() => (query.status === "ready" ? sortQueue(query.data) : []), [query])
  const pseudonyms = useMemo(() => buildPseudonyms(items), [items])
  const visible = items.filter((item) => item.status === filter)
  const pendingCount = items.filter((item) => item.status === "pending").length
  const gradedCount = items.length - pendingCount
  const selected = visible.find((item) => item.answer_id === selectedId) ?? visible[0] ?? null
  const testTitle = testId ? items.find((item) => item.test.id === testId)?.test.title : undefined
  const courseId = testId ? items.find((item) => item.test.id === testId)?.test.course_id : undefined

  const studentLabel = (item: GradingQueueItem) => (anonymous ? t("pseudonym", { number: pseudonyms.get(item.student.id) ?? 0 }) : item.student.name)
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft

  return (
    <div className="flex flex-col gap-6">
      <header className="flex animate-fade-in flex-wrap items-center gap-3.5 border-b border-border pb-5">
        {courseId && (
          <Link
            href={`/courses/${courseId}/tests` as never}
            aria-label={t("back")}
            title={t("back")}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-foreground transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <BackIcon className="size-4.5" aria-hidden="true" />
          </Link>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2 text-xs text-on-surface-muted">
            {testTitle ? t("eyebrow_test", { test: testTitle }) : t("eyebrow")}
            {testId && (
              <Link href="/grading" className="font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                {t("all_tests")}
              </Link>
            )}
            <DemoBadge />
          </span>
          <h1 className="text-lg font-bold">{t("title")}</h1>
        </div>
        {items.length > 0 && (
          <div className="flex w-full items-center gap-2.5 sm:w-64">
            <div
              role="progressbar"
              aria-label={t("progress_label")}
              aria-valuemin={0}
              aria-valuemax={items.length}
              aria-valuenow={gradedCount}
              aria-valuetext={t("progress", { done: gradedCount, total: items.length })}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-warning-tint"
            >
              <div className="h-full rounded-full bg-warning transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${(gradedCount / items.length) * 100}%` }} />
            </div>
            <span className={cn("text-[13px] font-semibold tabular-nums", WARNING_TEXT)}>{t("progress", { done: gradedCount, total: items.length })}</span>
          </div>
        )}
      </header>

      {query.status === "loading" && (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]" aria-busy="true">
          <Skeleton className="h-80 rounded-[20px]" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      )}

      {query.status === "error" && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{query.error || t("load_error")}</p>
          <Button variant="outline" className="h-11 gap-2 px-4" onClick={query.reload}>
            <RotateCw className="size-4" aria-hidden="true" />
            {t("retry")}
          </Button>
        </div>
      )}

      {query.status === "ready" && (
        <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside aria-label={t("queue_label")} className="flex animate-slide-up flex-col gap-1 rounded-[20px] border border-border bg-card p-3 lg:sticky lg:top-4">
            <div role="group" aria-label={t("filter_label")} className="flex flex-wrap gap-1.5 px-1 pt-1 pb-2.5">
              {(["pending", "graded"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => {
                    setFilter(value)
                    setSelectedId(null)
                  }}
                  className={cn(
                    "min-h-11 rounded-full border-[1.5px] px-3 text-xs tabular-nums transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none",
                    filter === value ? "border-foreground bg-foreground font-semibold text-background" : "border-border bg-card text-on-surface-muted hover:text-foreground",
                  )}
                >
                  {t(value === "pending" ? "filter_pending" : "filter_graded", { count: value === "pending" ? pendingCount : gradedCount })}
                </button>
              ))}
            </div>

            <ul ref={listRef} className="flex max-h-[60dvh] flex-col gap-1 overflow-y-auto">
              {visible.map((item) => {
                const active = selected?.answer_id === item.answer_id
                const label = studentLabel(item)
                return (
                  <li key={item.answer_id}>
                    <button
                      type="button"
                      aria-current={active ? "true" : undefined}
                      onClick={() => setSelectedId(item.answer_id)}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-start transition-[background-color,border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none",
                        active ? "border-foreground bg-primary-tint shadow-[3px_3px_0_var(--color-foreground)]" : "border-transparent hover:bg-surface-muted",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn("grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums", active ? "bg-primary text-primary-foreground" : "bg-surface-strong text-on-surface-muted")}
                      >
                        {anonymous ? <UserRound className="size-4" /> : item.student.initials || item.student.name.slice(0, 1)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold">{label}</span>
                        <span className="truncate text-xs text-on-surface-muted tabular-nums">
                          {t("attempt_time", { number: item.attempt_number, time: relativeTime(item.submitted_at, locale) })} · {t("question_short", { number: item.question.position + 1 })}
                        </span>
                        {!testId && <span className="truncate text-xs text-on-surface-subtle">{item.test.title}</span>}
                        {item.status === "graded" && item.points_awarded !== null && (
                          <span className={cn("text-xs font-medium tabular-nums", SUCCESS_TEXT)}>{t("graded_badge", { points: item.points_awarded, max: item.question.points })}</span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
              {visible.length === 0 && <li className="px-3 py-6 text-center text-sm text-on-surface-muted">{t(filter === "pending" ? "empty_pending_title" : "empty_graded_title")}</li>}
            </ul>

            <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2.5 border-t border-border px-2 pt-2.5 text-[13px] text-on-surface-muted">
              <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="size-4.5 accent-primary" />
              {t("anonymous")}
            </label>
          </aside>

          {selected ? (
            <GradingPanel
              key={selected.answer_id}
              item={selected}
              onSaved={(nextId) => setSelectedId(nextId)}
              nextId={() => nextPendingId(items, selected.answer_id)}
            />
          ) : (
            <EmptyPanel filter={filter} hasItems={items.length > 0} />
          )}
        </div>
      )}
    </div>
  )
}

function EmptyPanel({ filter, hasItems }: { filter: Filter; hasItems: boolean }) {
  const t = useTranslations("courseTests.grading")
  const allDone = filter === "pending" && hasItems
  const Icon = allDone ? CheckCircle2 : Inbox
  return (
    <section className="flex animate-fade-in flex-col items-center gap-2 rounded-3xl border border-dashed border-border-strong bg-card px-6 py-14 text-center">
      <span className={cn("grid size-12 place-items-center rounded-2xl", allDone ? cn("bg-success-tint", SUCCESS_TEXT) : "bg-surface-strong text-on-surface-muted")} aria-hidden="true">
        <Icon className="size-6" />
      </span>
      <h2 className="text-base font-semibold">{t(allDone ? "all_done_title" : filter === "pending" ? "empty_pending_title" : "empty_graded_title")}</h2>
      {filter === "pending" && <p className="max-w-sm text-sm text-on-surface-muted">{t(allDone ? "all_done_body" : "empty_pending_body")}</p>}
    </section>
  )
}

function GradingPanel({ item, onSaved, nextId }: { item: GradingQueueItem; onSaved: (nextId: number | null) => void; nextId: () => number | null }) {
  const t = useTranslations("courseTests.grading")
  const NextIcon = useLocale() === "ar" ? ArrowLeft : ArrowRight
  const id = useId()
  const [points, setPoints] = useState<number | null>(item.points_awarded)
  const [feedback, setFeedback] = useState(item.feedback ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const key = item.question.answer_key as { model_answer?: string; rubric?: { criterion: string; points: number }[] }
  const rubric = key.rubric ?? []
  const words = wordCount(item.response)
  const total = points === null ? null : previewTotal(item, points)
  const restMax = item.max_score - item.question.points
  const isGraded = item.status === "graded"

  async function save() {
    if (points === null) {
      setError(t("pick_score"))
      return
    }
    setSaving(true)
    setError(null)
    const upcoming = nextId()
    const result = await callClient((client) => client.gradeAnswer(item.answer_id, points, feedback))
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      return
    }
    const grade = result.data
    if (grade.attempt_status === "graded" && grade.score_total !== null && grade.percent !== null) {
      toast.success(t("saved_final", { score: grade.score_total, max: grade.max_score, percent: grade.percent, result: t(grade.passed ? "passed" : "failed") }))
    } else {
      toast.success(t("saved"))
    }
    notifyCourseTestsChanged()
    onSaved(isGraded ? item.answer_id : upcoming)
  }

  return (
    <div className="flex animate-in flex-col gap-5 duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <section aria-labelledby={`${id}-question`} className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-surface-strong px-2.5 py-0.5 text-xs font-semibold text-on-surface-muted">{t("question_badge", { number: item.question.position + 1 })}</span>
            <span className="rounded-full bg-surface-strong px-2.5 py-0.5 text-xs font-semibold text-on-surface-muted tabular-nums">{t("points", { count: item.question.points })}</span>
          </div>
          <span className="text-[13px] text-on-surface-muted tabular-nums">{t("rest_subtotal", { score: item.score_rest, max: restMax })}</span>
        </div>
        <h2 id={`${id}-question`} className="text-[1.1875rem] leading-[1.7] font-semibold">
          {item.question.text}
        </h2>
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-muted px-4.5 py-4">
          <span className="text-xs font-semibold text-on-surface-muted tabular-nums">{t("student_answer", { count: words })}</span>
          {item.response?.trim() ? (
            <p dir="auto" className="text-base leading-[1.9] whitespace-pre-wrap">
              {item.response}
            </p>
          ) : (
            <p className="text-sm text-on-surface-muted italic">{t("no_answer")}</p>
          )}
        </div>
        <details className="group rounded-[14px] border border-border px-4 py-3">
          <summary className="flex min-h-8 cursor-pointer items-center text-[13px] font-semibold text-primary focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            {t("model_rubric")}
          </summary>
          <div className="mt-2.5 flex animate-in flex-col gap-3 text-[13px] leading-[1.8] text-on-surface-muted duration-200 fade-in motion-reduce:animate-none">
            {!key.model_answer && rubric.length === 0 && <p>{t("no_model")}</p>}
            {key.model_answer && (
              <div>
                <h3 className="font-semibold text-foreground">{t("model_answer")}</h3>
                <p dir="auto">{key.model_answer}</p>
              </div>
            )}
            {rubric.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground">{t("rubric")}</h3>
                <ul className="list-disc ps-5">
                  {rubric.map((criterion, index) => (
                    <li key={index}>
                      {criterion.criterion} <span className="tabular-nums">{t("rubric_points", { points: criterion.points })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </section>

      <section aria-label={t("score_of", { max: item.question.points })} className="flex flex-col gap-4.5 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <span id={`${id}-score`} className="text-xs font-semibold text-foreground/80">
            {t("score_of", { max: item.question.points })}
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <ScoreChips
              max={item.question.points}
              value={points}
              labelId={`${id}-score`}
              disabled={saving}
              onChange={(value) => {
                setPoints(value)
                setError(null)
              }}
            />
            <p className="ms-auto text-sm text-on-surface-muted tabular-nums" aria-live="polite">
              {total && (
                <>
                  {t("total_after")}{" "}
                  <strong className={cn("font-semibold", total.passed ? SUCCESS_TEXT : ERROR_TEXT)}>{t("total_value", { score: total.score, max: total.max, percent: total.percent })}</strong>
                  {" · "}
                  <span className={cn("font-medium", total.passed ? SUCCESS_TEXT : ERROR_TEXT)}>{t(total.passed ? "passed" : "failed")}</span>
                  <span className="block text-xs">{t("pass_mark", { percent: item.test.pass_percent })}</span>
                </>
              )}
            </p>
          </div>
          {item.remaining_essays_in_attempt > 0 && <p className={cn("text-xs", WARNING_TEXT)}>{t("remaining_in_attempt", { count: item.remaining_essays_in_attempt })}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-feedback`} className="text-xs font-semibold text-foreground/80">
            {t("feedback")} <span className="font-normal text-on-surface-muted">{t("optional")}</span>
          </label>
          <Textarea id={`${id}-feedback`} dir="auto" value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={3} maxLength={5000} className="min-h-22 resize-y text-sm leading-[1.8]" />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {!isGraded ? (
            <Button variant="outline" className="h-12 px-4.5 text-sm font-semibold" disabled={saving} onClick={() => onSaved(nextId())}>
              {t("skip")}
            </Button>
          ) : (
            <span />
          )}
          <Button
            className="h-12 gap-2 rounded-xl border-2 border-foreground px-5.5 text-[15px] font-semibold shadow-[3px_3px_0_var(--color-foreground)]"
            disabled={saving}
            aria-busy={saving}
            onClick={() => void save()}
          >
            {saving && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {saving ? t("saving") : isGraded ? t("save_changes") : t("save_next")}
            {!saving && !isGraded && <NextIcon className="size-4.5" aria-hidden="true" />}
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-on-surface-muted">{t("notify_hint")}</p>
      </section>
    </div>
  )
}
