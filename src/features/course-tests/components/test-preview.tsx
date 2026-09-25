"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, ArrowRight, Check, ClipboardList, Clock, Eye, Flag, Pencil, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Link } from "@/i18n/routing"
import { getCourseTestsClient } from "../client"
import type { CourseTest } from "../types"
import { useStartRules } from "./builder/student-preview-panel"
import { announcementFor, buildPreviewAttempt, formatClock, isAnswered, isCorrect, scorePreview, type PreviewQuestion, type PreviewResponse, type PreviewResponses } from "./builder/preview-scoring"
import { CARD, ENTER, ENTER_UP, INK, WARNING_BOX } from "./builder/styles"
import { PreviewAnswer } from "./test-preview-question"

type Phase = "intro" | "quiz" | "result"

const PILL = "rounded-full bg-muted px-2.5 py-[3px] text-xs font-semibold text-muted-foreground"
const INK_BUTTON = cn(INK, "inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none")
const PRIMARY = cn(INK_BUTTON, "bg-primary-deep text-on-primary hover:bg-primary-deep/90")
const SECONDARY = cn(INK_BUTTON, "bg-card text-foreground hover:bg-muted")

export function TestPreview({ courseId, testId }: { courseId: number; testId: number }) {
  const t = useTranslations("courseTests.builder.preview")
  const [test, setTest] = useState<CourseTest | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const client = await getCourseTestsClient()
      const result = await client.getTest(testId)
      if (cancelled) return
      if (result.ok) setTest(result.data)
      else setError(result.error)
    })()
    return () => {
      cancelled = true
    }
  }, [testId])

  const editorHref = `/courses/${courseId}/tests/${testId}`

  return (
    <div className="student-preview flex flex-col gap-6 text-foreground">
      <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm", WARNING_BOX)} role="note">
        <span className="flex items-center gap-2">
          <Eye className="size-4 shrink-0" aria-hidden />
          {t("banner")}
        </span>
        <Link href={editorHref} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 font-semibold underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
          <Pencil className="size-4" aria-hidden />
          {t("back_to_editor")}
        </Link>
      </div>
      {error ? <p className={cn(CARD, "p-8 text-center")}>{error}</p> : null}
      {!test && !error ? (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label={t("loading")}>
          <Skeleton className="h-10 w-72 rounded-xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      ) : null}
      {test ? <PreviewFlow test={test} editorHref={editorHref} /> : null}
    </div>
  )
}

function PreviewFlow({ test, editorHref }: { test: CourseTest; editorHref: string }) {
  const t = useTranslations("courseTests.builder.preview")
  const [phase, setPhase] = useState<Phase>("intro")
  const [attempt, setAttempt] = useState<PreviewQuestion[]>([])
  const [responses, setResponses] = useState<PreviewResponses>({})
  const [flags, setFlags] = useState<Set<number>>(new Set())
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [startedAt, setStartedAt] = useState(0)
  const [usedSeconds, setUsedSeconds] = useState(0)
  const limitSeconds = test.time_limit_minutes ? test.time_limit_minutes * 60 : null

  const start = () => {
    setAttempt(buildPreviewAttempt(test.questions, test))
    setResponses({})
    setFlags(new Set())
    setCurrent(0)
    setTimeUp(false)
    setStartedAt(Date.now())
    setPhase("quiz")
  }

  const submit = useCallback(
    (auto = false) => {
      setConfirmOpen(false)
      setTimeUp(auto)
      setUsedSeconds(Math.round((Date.now() - startedAt) / 1000))
      setPhase("result")
    },
    [startedAt],
  )

  const go = (index: number) => {
    setDirection(index >= current ? 1 : -1)
    setCurrent(index)
  }

  if (phase === "intro") return <IntroCard test={test} onStart={start} />
  if (phase === "result") return <ResultCard test={test} attempt={attempt} responses={responses} usedSeconds={usedSeconds} timeUp={timeUp} onRestart={() => setPhase("intro")} editorHref={editorHref} />

  const question = attempt[current]
  const answeredCount = attempt.filter((item) => isAnswered(item, responses[item.id])).length
  const canGoBack = test.allow_back_navigation
  const isLast = current === attempt.length - 1
  const flagged = flags.has(question.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] text-muted-foreground">{t("student_view")}</span>
        <h1 className="text-2xl font-bold" dir="auto">
          {test.title}
        </h1>
      </div>
      <div className="flex flex-col-reverse items-start gap-6 lg:flex-row">
        <main className="w-full min-w-0 flex-1">
          <section aria-label={t("question_of", { number: current + 1, total: attempt.length })} className={cn(CARD, "flex flex-col gap-[22px] rounded-3xl px-5 py-6 sm:px-8 sm:py-7")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[15px] font-bold tabular-nums">{t("question_of", { number: current + 1, total: attempt.length })}</span>
                <span className={PILL}>{t(`type.${question.type}`)}</span>
                <span className={cn(PILL, "tabular-nums")}>{t("points", { count: question.points })}</span>
                {question.type === "essay" ? <span className={cn(PILL, "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300")}>{t("teacher_graded")}</span> : null}
              </div>
              <button
                type="button"
                aria-pressed={flagged}
                onClick={() =>
                  setFlags((currentFlags) => {
                    const next = new Set(currentFlags)
                    if (next.has(question.id)) next.delete(question.id)
                    else next.add(question.id)
                    return next
                  })
                }
                className={cn(
                  "inline-flex h-11 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  flagged ? "border-orange-500 bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" : "border-border bg-card text-muted-foreground",
                )}
              >
                <Flag className="size-4" aria-hidden />
                {flagged ? t("flagged") : t("flag")}
              </button>
            </div>

            <div className="flex gap-1" aria-hidden>
              {attempt.map((item, index) => (
                <span key={item.id} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", index === current ? "bg-foreground" : isAnswered(item, responses[item.id]) ? "bg-primary" : "bg-border")} />
              ))}
            </div>

            <div key={question.id} className={cn("flex flex-col gap-[22px]", ENTER, direction === 1 ? "motion-safe:slide-in-from-end-4" : "motion-safe:slide-in-from-start-4")}>
              <div className="flex flex-col gap-3.5">
                <h2 className="text-xl leading-[1.7] font-semibold sm:text-[22px]" dir="auto">
                  {question.text}
                </h2>
                {question.code_snippet ? (
                  <pre dir="ltr" className="overflow-x-auto rounded-[14px] bg-slate-900 px-5 py-4 text-start font-mono text-[15px] leading-[1.7] whitespace-pre text-slate-100">
                    {question.code_snippet}
                  </pre>
                ) : null}
                {question.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- teacher-provided URL; next/image needs allow-listed hosts
                  <img src={question.image_url} alt={t("image_alt")} className="max-h-80 w-fit max-w-full rounded-2xl border border-border object-contain" />
                ) : null}
                <span className="text-[13px] text-muted-foreground">{t(`hint.${question.type}`)}</span>
              </div>
              <PreviewAnswer question={question} response={responses[question.id]} onRespond={(response: PreviewResponse) => setResponses((currentResponses) => ({ ...currentResponses, [question.id]: response }))} />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-[18px]">
              <button type="button" onClick={() => go(current - 1)} disabled={current === 0 || !canGoBack} className={SECONDARY}>
                <ArrowRight className="size-[18px] ltr:rotate-180" aria-hidden />
                {t("previous")}
              </button>
              {isLast ? (
                <button type="button" onClick={() => setConfirmOpen(true)} className={PRIMARY}>
                  {t("review_submit")}
                  <Check className="size-[18px]" aria-hidden />
                </button>
              ) : (
                <button type="button" onClick={() => go(current + 1)} className={PRIMARY}>
                  {t("next")}
                  <ArrowLeft className="size-[18px] ltr:rotate-180" aria-hidden />
                </button>
              )}
            </div>
          </section>
        </main>

        <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[340px]">
          {limitSeconds !== null ? <TimerCard limitSeconds={limitSeconds} startedAt={startedAt} onTimeUp={() => submit(true)} /> : null}
          <div className={cn(CARD, "flex flex-col gap-4 rounded-[20px] p-5")}>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">{t("navigator")}</span>
              <span className="text-[13px] text-muted-foreground tabular-nums">{t("answered_of", { answered: answeredCount, total: attempt.length })}</span>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {attempt.map((item, index) => {
                const answered = isAnswered(item, responses[item.id])
                const isCurrent = index === current
                const locked = !canGoBack && index < current
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(index)}
                    disabled={locked}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={t("nav_label", { number: index + 1, state: answered ? t("state_answered") : t("state_unanswered"), flagged: flags.has(item.id) ? "yes" : "no" })}
                    className={cn(
                      "relative h-12 rounded-xl border-2 text-[15px] font-bold tabular-nums outline-none transition-[background-color,border-color,box-shadow] duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40",
                      answered ? "border-primary-deep bg-primary-deep text-on-primary" : "border-border-strong bg-card text-muted-foreground",
                      isCurrent && cn(INK, !answered && "bg-card text-foreground"),
                    )}
                  >
                    {index + 1}
                    {flags.has(item.id) ? <span className="absolute -top-1.5 -start-1.5 size-3.5 rounded-full border-2 border-card bg-orange-500" aria-hidden /> : null}
                  </button>
                )
              })}
            </div>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-3.5 rounded bg-primary-deep" aria-hidden />
                {t("legend_answered")}
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3.5 rounded border-2 border-foreground" aria-hidden />
                {t("legend_current")}
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3.5 rounded border-2 border-border-strong" aria-hidden />
                {t("legend_unanswered")}
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-orange-500" aria-hidden />
                {t("legend_flagged")}
              </li>
            </ul>
            <button type="button" onClick={() => setConfirmOpen(true)} className={cn(SECONDARY, "w-full justify-center")}>
              {t("review_submit")}
            </button>
          </div>
        </aside>
      </div>

      <SubmitDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        attempt={attempt}
        responses={responses}
        flags={flags}
        canJump={(index) => canGoBack || index >= current}
        onJump={(index) => {
          setConfirmOpen(false)
          go(index)
        }}
        onSubmit={() => submit(false)}
        remaining={limitSeconds !== null ? <RemainingTime limitSeconds={limitSeconds} startedAt={startedAt} /> : null}
      />
    </div>
  )
}

function useRemaining(limitSeconds: number, startedAt: number) {
  const [remaining, setRemaining] = useState(limitSeconds)
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, limitSeconds - Math.floor((Date.now() - startedAt) / 1000)))
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [limitSeconds, startedAt])
  return remaining
}

function RemainingTime({ limitSeconds, startedAt }: { limitSeconds: number; startedAt: number }) {
  const remaining = useRemaining(limitSeconds, startedAt)
  return <span className="tabular-nums">{formatClock(remaining)}</span>
}

function TimerCard({ limitSeconds, startedAt, onTimeUp }: { limitSeconds: number; startedAt: number; onTimeUp: () => void }) {
  const t = useTranslations("courseTests.builder.preview")
  const remaining = useRemaining(limitSeconds, startedAt)
  const previous = useRef(remaining)
  const [announcement, setAnnouncement] = useState("")
  const low = remaining <= 120

  useEffect(() => {
    const minutes = announcementFor(previous.current, remaining)
    previous.current = remaining
    // Screen readers hear the timer only at 5, 2 and 1 minutes left.
    if (minutes !== null) setAnnouncement(t("time_left_announce", { minutes }))
    if (remaining === 0) onTimeUp()
  }, [remaining, onTimeUp, t])

  return (
    <div className={cn(INK, "flex flex-col gap-2 rounded-[20px] px-5 py-[18px] transition-colors duration-300 shadow-[5px_5px_0_var(--color-foreground)]", low ? "bg-error-tint" : "bg-card")}>
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-semibold", low && "text-red-700 dark:text-red-300")}>
          <Clock className="size-4" aria-hidden />
          {low ? t("time_low") : t("time_left")}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">{t("of_total", { total: formatClock(limitSeconds) })}</span>
      </div>
      <span role="timer" aria-live="off" className={cn("text-[42px] leading-[1.1] font-bold tabular-nums", low && "text-red-700 dark:text-red-300")}>
        {formatClock(remaining)}
      </span>
      <div className="h-1.5 rounded-full bg-border" aria-hidden>
        <div className={cn("h-1.5 rounded-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none", low ? "bg-red-500" : "bg-primary")} style={{ width: `${(remaining / limitSeconds) * 100}%` }} />
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}

function SubmitDialog({
  open,
  onOpenChange,
  attempt,
  responses,
  flags,
  canJump,
  onJump,
  onSubmit,
  remaining,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  attempt: PreviewQuestion[]
  responses: PreviewResponses
  flags: Set<number>
  canJump: (index: number) => boolean
  onJump: (index: number) => void
  onSubmit: () => void
  remaining: ReactNode
}) {
  const t = useTranslations("courseTests.builder.preview")
  const unanswered = attempt.map((question, index) => ({ question, index })).filter(({ question }) => !isAnswered(question, responses[question.id]))
  const flaggedList = attempt.map((question, index) => ({ question, index })).filter(({ question }) => flags.has(question.id))
  const answered = attempt.length - unanswered.length
  const jumpList = (items: typeof unanswered, tone: string) => (
    <div className="flex flex-wrap gap-2">
      {items.map(({ question, index }) => (
        <button key={question.id} type="button" disabled={!canJump(index)} onClick={() => onJump(index)} className={cn("h-11 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40", tone)}>
          {t("question_n", { number: index + 1 })}
        </button>
      ))}
    </div>
  )
  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogContent showCloseButton={false} className={cn(INK, "gap-5 rounded-3xl p-7 shadow-[6px_6px_0_var(--color-foreground)] sm:max-w-[500px]")}>
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-[22px] font-bold">{t("submit_title")}</DialogTitle>
          <DialogDescription className="text-sm leading-[1.8]">{t("submit_description")}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col gap-1 rounded-[14px] bg-muted p-3.5">
            <dt className="text-xs text-primary-deep">{t("answered")}</dt>
            <dd className="text-[22px] font-bold tabular-nums">{answered}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-[14px] bg-amber-50 p-3.5 dark:bg-amber-950/40">
            <dt className="text-xs text-amber-800 dark:text-amber-300">{t("unanswered")}</dt>
            <dd className="text-[22px] font-bold tabular-nums">{unanswered.length}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-[14px] bg-orange-50 p-3.5 dark:bg-orange-950/40">
            <dt className="text-xs text-orange-800 dark:text-orange-300">{t("flagged_short")}</dt>
            <dd className="text-[22px] font-bold tabular-nums">{flaggedList.length}</dd>
          </div>
        </dl>
        {unanswered.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">{t("unanswered_jump")}</span>
            {jumpList(unanswered, "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200")}
          </div>
        ) : null}
        {flaggedList.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-orange-800 dark:text-orange-300">{t("flagged_jump")}</span>
            {jumpList(flaggedList, "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200")}
          </div>
        ) : null}
        {remaining ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden />
            {t("remaining")} {remaining}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={onSubmit} className={PRIMARY}>
            {t("submit")}
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className={cn("inline-flex h-12 items-center rounded-full border-2 border-foreground bg-card px-5 text-[15px] font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50")}>
            {t("back_to_review")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function IntroCard({ test, onStart }: { test: CourseTest; onStart: () => void }) {
  const t = useTranslations("courseTests.builder.preview")
  const rules = useStartRules(test, test.questions)
  const count = test.random_pool_size ?? test.questions.length
  const tiles = [
    { label: t("tile_questions"), value: t("questions_count", { count }) },
    { label: t("tile_duration"), value: test.time_limit_minutes ? t("minutes", { count: test.time_limit_minutes }) : t("no_limit") },
    { label: t("tile_pass"), value: `${test.pass_percent}%` },
    { label: t("tile_attempts"), value: test.max_attempts ? t("attempts", { count: test.max_attempts }) : t("unlimited") },
  ]
  return (
    <section className={cn(CARD, "flex flex-col gap-6 rounded-3xl p-6 sm:p-8", ENTER_UP)}>
      <div className="flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-tint text-primary-deep">
          <ClipboardList className="size-7" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={cn(PILL, "w-fit bg-primary-tint text-primary-deep")}>{t("test_badge")}</span>
          <h1 className="text-2xl font-bold" dir="auto">
            {test.title}
          </h1>
          {test.description ? (
            <p className="text-[15px] leading-[1.8] text-muted-foreground" dir="auto">
              {test.description}
            </p>
          ) : null}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col gap-1 rounded-2xl border border-border bg-page p-4">
            <dt className="text-[13px] text-muted-foreground">{tile.label}</dt>
            <dd className="text-lg font-bold tabular-nums">{tile.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3 rounded-2xl bg-page p-5">
        <h2 className="text-base font-bold">{t("before_start")}</h2>
        <ul className="flex flex-col gap-2.5 text-sm leading-[1.8]">
          {rules.map((rule) => (
            <li key={rule} className="flex gap-2.5">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              {rule}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={onStart} disabled={test.questions.length === 0} className={PRIMARY}>
          {t("start")}
        </button>
        <span className="text-[13px] text-muted-foreground tabular-nums">{test.max_attempts ? t("first_attempt_of", { count: test.max_attempts }) : t("first_attempt")}</span>
        {test.questions.length === 0 ? <span className="text-sm text-muted-foreground">{t("no_questions")}</span> : null}
      </div>
    </section>
  )
}

function ResultCard({ test, attempt, responses, usedSeconds, timeUp, onRestart, editorHref }: { test: CourseTest; attempt: PreviewQuestion[]; responses: PreviewResponses; usedSeconds: number; timeUp: boolean; onRestart: () => void; editorHref: string }) {
  const t = useTranslations("courseTests.builder.preview")
  const result = scorePreview(attempt, responses, test.pass_percent)
  const answered = attempt.filter((question) => isAnswered(question, responses[question.id])).length
  const pending = result.percent === null
  const shownPercent = pending ? Math.round((result.autoScore / Math.max(1, result.maxScore)) * 100) : result.percent!
  const circumference = 402.12
  const ringTone = pending ? "stroke-amber-500" : result.passed ? "stroke-emerald-500" : "stroke-red-500"
  const trackTone = pending ? "stroke-amber-100 dark:stroke-amber-950" : result.passed ? "stroke-emerald-100 dark:stroke-emerald-950" : "stroke-red-100 dark:stroke-red-950"
  const stats = [
    { label: t("stat_correct"), value: result.correct, tone: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { label: t("stat_wrong"), value: result.wrong, tone: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300" },
    { label: t("stat_blank"), value: result.blank, tone: "bg-muted text-muted-foreground" },
    { label: t("stat_time"), value: formatClock(usedSeconds), tone: "bg-muted text-muted-foreground" },
  ]
  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      <section className={cn(CARD, "flex w-full min-w-0 flex-1 flex-col items-center gap-6 rounded-3xl p-6 text-center sm:p-10", ENTER_UP)}>
        {timeUp ? <p className={cn("w-full rounded-2xl px-4 py-3 text-sm font-medium", WARNING_BOX)}>{t("time_up", { answered, total: attempt.length })}</p> : null}
        <div className="relative size-[180px]">
          <svg width="180" height="180" viewBox="0 0 160 160" className="-rotate-90" aria-hidden>
            <circle cx="80" cy="80" r="64" fill="none" strokeWidth="14" className={trackTone} />
            <circle cx="80" cy="80" r="64" fill="none" strokeWidth="14" strokeLinecap="round" className={cn(ringTone, "transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none")} strokeDasharray={`${((circumference * shownPercent) / 100).toFixed(1)} ${circumference}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[40px] font-bold tabular-nums">{pending ? `${result.autoScore}/${result.autoMax}` : `${shownPercent}%`}</span>
            <span className="text-xs text-muted-foreground">{pending ? t("auto_subtotal") : t("your_score")}</span>
          </div>
        </div>
        <h2 className="text-[26px] font-bold">{pending ? t("pending_title") : result.passed ? t("passed_title") : t("failed_title")}</h2>
        <p className="text-[15px] text-muted-foreground tabular-nums">
          {pending ? t("pending_points", { auto: result.autoScore, autoMax: result.autoMax, essays: result.pendingEssays, points: result.pendingPoints }) : t("points_line", { score: result.autoScore, max: result.maxScore, pass: test.pass_percent })}
        </p>
        <dl className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className={cn("flex flex-col gap-1 rounded-[14px] p-4 text-start", stat.tone)}>
              <dt className="text-[13px]">{stat.label}</dt>
              <dd className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">{t("local_note")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRestart} className={SECONDARY}>
            <RotateCcw className="size-[18px]" aria-hidden />
            {t("restart")}
          </button>
          <Link href={editorHref} className={PRIMARY}>
            <Pencil className="size-[18px]" aria-hidden />
            {t("back_to_editor")}
          </Link>
        </div>
      </section>
      <aside className={cn(CARD, "flex w-full shrink-0 flex-col gap-4 rounded-[20px] p-5 lg:w-[340px]")}>
        <span className="text-base font-bold">{t("your_answers")}</span>
        <ol className="grid grid-cols-5 gap-2.5">
          {attempt.map((question, index) => {
            const answeredQuestion = isAnswered(question, responses[question.id])
            const correct = isCorrect(question, responses[question.id])
            const state = !answeredQuestion ? "blank" : correct === null ? "pending" : correct ? "correct" : "wrong"
            return (
              <li
                key={question.id}
                aria-label={t("result_nav", { number: index + 1, state: t(`result_${state}`) })}
                className={cn(
                  "grid h-12 place-items-center rounded-xl border-2 text-[15px] font-bold tabular-nums",
                  state === "correct" && "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                  state === "wrong" && "border-red-500 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                  state === "blank" && "border-border-strong bg-muted text-muted-foreground",
                  state === "pending" && "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                )}
              >
                {index + 1}
              </li>
            )
          })}
        </ol>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="size-3.5 rounded border-2 border-emerald-500 bg-emerald-100" aria-hidden />
            {t("result_correct")}
          </li>
          <li className="flex items-center gap-2">
            <span className="size-3.5 rounded border-2 border-red-500 bg-red-100" aria-hidden />
            {t("result_wrong")}
          </li>
          <li className="flex items-center gap-2">
            <span className="size-3.5 rounded border-2 border-border-strong bg-muted" aria-hidden />
            {t("result_blank")}
          </li>
          <li className="flex items-center gap-2">
            <span className="size-3.5 rounded border-2 border-amber-500 bg-amber-100" aria-hidden />
            {t("result_pending")}
          </li>
        </ul>
      </aside>
    </div>
  )
}
