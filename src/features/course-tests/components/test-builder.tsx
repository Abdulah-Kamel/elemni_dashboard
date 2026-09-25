"use client"

import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { AlertTriangle, ArrowRight, CircleCheck, Eye, Loader2, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Link, useRouter } from "@/i18n/routing"
import { getCourseTestsClient } from "../client"
import type { CourseItemOption, CourseTestRow, QuestionType, TestStatus } from "../types"
import { isFuture, stableKey, switchQuestionType, validateTest, type TypeLabels } from "./builder/builder-model"
import { AddQuestionPanel } from "./builder/add-question-menu"
import { ConfirmDialog } from "./builder/confirm-dialog"
import { BankDialog, ExcelImportDialog } from "./builder/import-dialogs"
import { QuestionEditor } from "./builder/question-editor"
import { QuestionList } from "./builder/question-list"
import { ReviewStep } from "./builder/review-step"
import { SettingsStep } from "./builder/settings-step"
import { SummaryPanel } from "./builder/summary-panel"
import { useTestBuilder, type SaveState } from "./builder/use-test-builder"
import { CARD, ENTER, ERROR_TEXT, OUTLINE_BUTTON, PRIMARY_INK_BUTTON, SUCCESS_TEXT, WARNING_BOX, WARNING_TEXT } from "./builder/styles"

export type BuilderStep = "questions" | "settings" | "review"
const STEPS: BuilderStep[] = ["questions", "settings", "review"]

function StatusPill({ status, scheduled }: { status: TestStatus; scheduled: boolean }) {
  const t = useTranslations("courseTests.builder.status")
  const label = status === "published" && scheduled ? t("scheduled") : t(status)
  return (
    <span
      key={label}
      className={cn(
        "shrink-0 rounded-full px-2.5 py-[3px] text-xs font-semibold",
        ENTER,
        status === "draft" && "border-[1.5px] border-dashed border-on-surface-subtle text-muted-foreground",
        status === "published" && !scheduled && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        status === "published" && scheduled && "bg-primary-tint text-primary-deep",
        status === "archived" && "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  )
}

function SaveIndicator({ state, error, onRetry }: { state: SaveState; error: string | null; onRetry: () => void }) {
  const t = useTranslations("courseTests.builder.save")
  return (
    <div role="status" aria-live="polite" className="flex min-h-11 shrink-0 items-center">
      <span key={state === "pending" ? "saving" : state} className={cn("flex items-center gap-1.5 text-xs", ENTER)}>
        {state === "saved" ? (
          <span className={cn("flex items-center gap-1.5", SUCCESS_TEXT)}>
            <CircleCheck className="size-[15px]" aria-hidden />
            {t("saved")}
          </span>
        ) : null}
        {state === "saving" || state === "pending" ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-[15px] motion-safe:animate-spin" aria-hidden />
            {t("saving")}
          </span>
        ) : null}
        {state === "incomplete" ? (
          <span className={cn("flex items-center gap-1.5", WARNING_TEXT)} title={t("incomplete_hint")}>
            <AlertTriangle className="size-[15px]" aria-hidden />
            {t("incomplete")}
          </span>
        ) : null}
        {state === "error" ? (
          <span className={cn("flex items-center gap-1.5", ERROR_TEXT)}>
            <AlertTriangle className="size-[15px]" aria-hidden />
            <span title={error ?? undefined}>{t("failed")}</span>
            <button type="button" onClick={onRetry} className="inline-flex h-11 items-center gap-1 rounded-lg px-2 font-semibold underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <RotateCw className="size-3.5" aria-hidden />
              {t("retry")}
            </button>
          </span>
        ) : null}
      </span>
    </div>
  )
}

function Stepper({ step, onStep, questionCount }: { step: BuilderStep; onStep: (step: BuilderStep) => void; questionCount: number }) {
  const t = useTranslations("courseTests.builder.steps")
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const index = STEPS.indexOf(step)
    let next = index
    if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = (index + 1) % STEPS.length
    else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = (index - 1 + STEPS.length) % STEPS.length
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = STEPS.length - 1
    else return
    event.preventDefault()
    onStep(STEPS[next])
    document.getElementById(`builder-tab-${STEPS[next]}`)?.focus()
  }
  return (
    <div role="tablist" aria-label={t("label")} onKeyDown={onKeyDown} className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 sm:px-6">
      {STEPS.map((item, index) => {
        const selected = item === step
        return (
          <button
            key={item}
            id={`builder-tab-${item}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`builder-panel-${item}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onStep(item)}
            className={cn(
              "relative flex h-[46px] shrink-0 items-center gap-2 px-4 text-sm whitespace-nowrap outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
              selected ? "font-semibold text-primary-deep" : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="tabular-nums">{index + 1}</span>
            <span aria-hidden>·</span>
            {t(item)}
            {item === "questions" ? <span className={cn("rounded-full px-2 py-px text-xs tabular-nums transition-colors", selected ? "bg-primary-tint" : "bg-muted")}>{questionCount}</span> : null}
            <span aria-hidden className={cn("absolute inset-x-2 bottom-0 h-[3px] origin-center rounded-t-full bg-primary-deep transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none", selected ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0")} />
          </button>
        )
      })}
    </div>
  )
}

function useCourseContext(courseId: number) {
  const [items, setItems] = useState<CourseItemOption[]>([])
  const [tests, setTests] = useState<CourseTestRow[]>([])
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const client = await getCourseTestsClient()
      const [itemsResult, testsResult] = await Promise.all([client.listCourseItems(courseId), client.listTests(courseId)])
      if (cancelled) return
      if (itemsResult.ok) setItems(itemsResult.data)
      if (testsResult.ok) setTests(testsResult.data)
    })()
    return () => {
      cancelled = true
    }
  }, [courseId])
  return { items, tests }
}

export function TestBuilder({ courseId, testId, initialStep = "questions" }: { courseId: number; testId: number; initialStep?: BuilderStep }) {
  const t = useTranslations("courseTests.builder")
  const router = useRouter()
  const labels = useMemo<TypeLabels>(() => ({ trueLabel: t("true_label"), falseLabel: t("false_label") }), [t])
  const builder = useTestBuilder(testId, labels)
  const course = useCourseContext(courseId)
  const [step, setStep] = useState<BuilderStep>(initialStep)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [excelOpen, setExcelOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const { test, settings, questions, selectedId } = builder
  const issues = useMemo(() => (settings ? validateTest(settings, questions) : []), [settings, questions])

  if (builder.loadState.status === "loading" || (builder.loadState.status === "ready" && (!test || !settings))) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label={t("loading")}>
        <Skeleton className="h-[72px] w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_290px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-[32rem] rounded-3xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }
  if (builder.loadState.status === "error" || !test || !settings) {
    return (
      <div className={cn(CARD, "flex flex-col items-center gap-4 p-10 text-center")}>
        <p className="text-base font-semibold">{t("load_error")}</p>
        {builder.loadState.status === "error" ? <p className="text-sm text-muted-foreground">{builder.loadState.message}</p> : null}
        <div className="flex gap-2">
          <Button type="button" onClick={() => void builder.reload()} className={PRIMARY_INK_BUTTON}>
            {t("retry")}
          </Button>
          <Link href={`/courses/${courseId}/tests`} className={cn(OUTLINE_BUTTON, "inline-flex items-center")}>
            {t("header.back")}
          </Link>
        </div>
      </div>
    )
  }

  const selectedIndex = questions.findIndex((question) => question.id === selectedId)
  const selected = selectedIndex >= 0 ? questions[selectedIndex] : null
  const lessonTitle = course.items.find((item) => item.lesson_id === settings.lesson_id)?.lesson_title
  const scheduled = test.status === "published" && isFuture(settings.opens_at)
  const published = test.status === "published"
  const canPublish = issues.length === 0 && !builder.publishing && test.status !== "archived"

  const goToQuestion = (id: number) => {
    builder.setSelectedId(id)
    setStep("questions")
  }

  const handlePublish = async () => {
    const result = await builder.publish()
    if (result.ok) {
      toast.success(t("publish_success"))
      return
    }
    if (result.error) toast.error(result.error)
    else toast.error(t("publish_unsaved"))
    if (result.issues.length > 0) setStep("review")
  }

  const openPreview = async () => {
    setLeaving(true)
    await builder.flush()
    setLeaving(false)
    router.push(`/courses/${courseId}/tests/${testId}/preview`)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    setDeleting(true)
    const result = await builder.deleteQuestion(deleteId)
    setDeleting(false)
    setDeleteId(null)
    if (result.ok) toast.success(t("delete.done"))
    else if (result.error) toast.error(result.error)
  }

  const deleteNumber = deleteId === null ? 0 : questions.findIndex((question) => question.id === deleteId) + 1

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-page">
      <header className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-border bg-card px-4 py-3.5 sm:px-6">
        <Link href={`/courses/${courseId}/tests`} aria-label={t("header.back")} className="grid size-11 shrink-0 place-items-center rounded-xl border border-border outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
          <ArrowRight className="size-[18px] ltr:rotate-180" aria-hidden />
        </Link>
        <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
          <label htmlFor="builder-title" className="truncate text-xs text-muted-foreground">
            {lessonTitle ? t("header.context", { lesson: lessonTitle }) : t("header.title_label")}
          </label>
          <input
            id="builder-title"
            dir="auto"
            value={settings.title}
            onChange={(event) => builder.updateSettings({ title: event.target.value })}
            placeholder={t("header.title_placeholder")}
            aria-invalid={!settings.title.trim() || undefined}
            className="-ms-1.5 h-9 w-full max-w-[420px] rounded-lg border border-transparent bg-transparent px-1.5 text-lg font-bold outline-none hover:border-border focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </div>
        <StatusPill status={test.status} scheduled={scheduled} />
        <SaveIndicator state={builder.saveState} error={builder.saveError} onRetry={() => void builder.flush()} />
        <Button type="button" variant="outline" onClick={() => void openPreview()} disabled={leaving} className={cn(OUTLINE_BUTTON, "gap-2")}>
          {leaving ? <Loader2 className="size-[18px] motion-safe:animate-spin" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
          {t("header.preview")}
        </Button>
        {!published ? (
          <Button
            type="button"
            onClick={() => void handlePublish()}
            disabled={!canPublish}
            aria-describedby={issues.length > 0 ? "publish-blocked" : undefined}
            className={cn(PRIMARY_INK_BUTTON, "gap-2")}
          >
            {builder.publishing ? <Loader2 className="size-[18px] motion-safe:animate-spin" aria-hidden /> : null}
            {t("header.publish")}
          </Button>
        ) : null}
        {issues.length > 0 && !published ? (
          <span id="publish-blocked" className="sr-only">
            {t("header.publish_blocked", { count: issues.length })}
          </span>
        ) : null}
      </header>

      {builder.needsAck ? (
        <div role="note" className={cn("flex items-start gap-2 border-b border-border px-4 py-3 text-sm sm:px-6", WARNING_BOX)}>
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{t("attempts_notice", { count: test.attempt_count })}</p>
        </div>
      ) : null}

      <Stepper step={step} onStep={setStep} questionCount={questions.length} />

      <div id={`builder-panel-${step}`} role="tabpanel" aria-labelledby={`builder-tab-${step}`} key={step} className={cn("p-4 sm:p-6", ENTER)}>
        {step === "questions" ? (
          <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_290px]">
            <QuestionList
              questions={questions}
              selectedId={selectedId}
              onSelect={builder.setSelectedId}
              onMove={builder.moveQuestion}
              onAdd={(type: QuestionType) => builder.addQuestion(type)}
              onOpenBank={() => setBankOpen(true)}
              onOpenExcel={() => setExcelOpen(true)}
            />
            {selected ? (
              <QuestionEditor
                key={stableKey(selected)}
                question={selected}
                number={selectedIndex + 1}
                total={questions.length}
                courseItems={course.items}
                onChange={(update) => builder.updateQuestion(selected.id, update)}
                onTypeChange={(type) => builder.updateQuestion(selected.id, (question) => switchQuestionType(question, type, labels))}
                onMove={(delta) => builder.moveQuestion(selectedIndex, selectedIndex + delta)}
                onDuplicate={() => builder.duplicateQuestion(selected.id)}
                onDelete={() => setDeleteId(selected.id)}
              />
            ) : (
              <section className={cn(CARD, "flex min-h-72 flex-col items-center justify-center gap-2 rounded-3xl p-10 text-center", ENTER)}>
                <p className="text-base font-semibold">{t("empty.title")}</p>
                <p className="max-w-[24rem] text-sm text-muted-foreground">{t("empty.description")}</p>
              </section>
            )}
            <div className="flex flex-col gap-5 lg:col-span-2 xl:col-span-1">
              <AddQuestionPanel onAdd={(type) => builder.addQuestion(type)} onOpenBank={() => setBankOpen(true)} onOpenExcel={() => setExcelOpen(true)} />
              <SummaryPanel questions={questions} issues={issues} onSelectQuestion={goToQuestion} onOpenSettings={() => setStep("settings")} />
            </div>
          </div>
        ) : null}
        {step === "settings" ? <SettingsStep testId={testId} settings={settings} questions={questions} courseItems={course.items} courseTests={course.tests} issues={issues} onChange={builder.updateSettings} /> : null}
        {step === "review" ? (
          <ReviewStep
            status={test.status}
            settings={settings}
            questions={questions}
            courseItems={course.items}
            courseTests={course.tests}
            issues={issues}
            serverIssues={builder.serverIssues}
            publishing={builder.publishing}
            onPublish={() => void handlePublish()}
            onSelectQuestion={goToQuestion}
            onOpenSettings={() => setStep("settings")}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={builder.ackOpen}
        onOpenChange={(open) => {
          if (!open) builder.resolveAck(false)
        }}
        title={t("ack.title")}
        description={t("ack.description", { count: test.attempt_count })}
        confirmLabel={t("ack.confirm")}
        cancelLabel={t("ack.cancel")}
        onConfirm={() => builder.resolveAck(true)}
      />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null)
        }}
        title={t("delete.title", { number: deleteNumber })}
        description={t("delete.description")}
        confirmLabel={t("delete.confirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void confirmDelete()}
        destructive
        busy={deleting}
      />
      <BankDialog open={bankOpen} onOpenChange={setBankOpen} testId={testId} courseId={courseId} ensureAck={builder.ensureAck} onImported={builder.appendPersisted} />
      <ExcelImportDialog open={excelOpen} onOpenChange={setExcelOpen} testId={testId} courseId={courseId} ensureAck={builder.ensureAck} onImported={builder.appendPersisted} />
    </div>
  )
}
