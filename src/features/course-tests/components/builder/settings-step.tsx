"use client"

import { useId, useRef, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { CalendarDays, CircleCheck, Clock, Info, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CourseItemOption, CourseTestRow, GradingPolicy, Prerequisite, ShowCorrectAnswers, TestSettings } from "../../types"
import { isoToLocalInput, localInputToIso, passPoints, summarize, validateSettings, type DraftQuestion, type Issue, type IssueCode, type SettingsField } from "./builder-model"
import { ChoiceSelect, Field, Segmented, SwitchRow } from "./controls"
import { useIssueText } from "./issue-text"
import { StudentPreviewPanel } from "./student-preview-panel"
import { CARD, CONTROL } from "./styles"

export const COOLDOWN_CHOICES = [0, 30, 60, 180, 720, 1440, 10080] as const

type Props = {
  testId: number
  settings: TestSettings
  questions: DraftQuestion[]
  courseItems: CourseItemOption[]
  courseTests: CourseTestRow[]
  issues: Issue[]
  onChange: (patch: Partial<TestSettings>) => void
}

function Section({ icon, title, children, className }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={cn(CARD, "flex flex-col gap-4 rounded-[20px] p-5", className)}>
      <h2 id={headingId} className="flex items-center gap-2 text-base font-semibold">
        <span className="text-primary-deep" aria-hidden>
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

const INPUT = cn(CONTROL, "text-[15px] tabular-nums md:text-[15px]")

export function SettingsStep({ testId, settings, questions, courseItems, courseTests, issues, onChange }: Props) {
  const t = useTranslations("courseTests.builder.settings")
  const { message } = useIssueText()
  const lastDuration = useRef(settings.time_limit_minutes ?? 15)
  const lastAttempts = useRef(settings.max_attempts ?? 3)
  const lastPool = useRef(settings.random_pool_size ?? Math.max(1, Math.min(questions.length, 10)))
  const [prereqRef] = useAutoAnimate<HTMLDivElement>({ duration: 180 })
  const [placementRef] = useAutoAnimate<HTMLDivElement>({ duration: 180 })
  const ids = {
    title: useId(), description: useId(), duration: useId(), attempts: useId(), cooldown: useId(), pass: useId(), lesson: useId(), placement: useId(), position: useId(), parent: useId(), prereq: useId(), opens: useId(), closes: useId(), pool: useId(), showAnswers: useId(), windowError: useId(),
  }

  const settingIssues = validateSettings(settings, questions.length)
  const errorFor = (field: SettingsField): IssueCode | undefined => settingIssues.find((issue) => issue.fields?.includes(field))?.code
  const err = (field: SettingsField) => {
    const code = errorFor(field)
    return code ? message(code) : undefined
  }

  const summary = summarize(questions)
  const lessons = [...new Map(courseItems.map((item) => [item.lesson_id, item.lesson_title])).entries()].map(([value, label]) => ({ value: String(value), label }))
  const lessonItems = courseItems.filter((item) => item.lesson_id === settings.lesson_id && !(item.kind === "test" && item.id === testId))
  const positionOptions = [{ value: "0", label: t("position_start") }, ...lessonItems.map((item, index) => ({ value: String(index + 1), label: t("position_after", { title: item.title }) }))]
  const parentOptions = lessonItems.filter((item) => item.kind !== "test").map((item) => ({ value: String(item.id), label: item.title }))
  const otherTests = courseTests.filter((test) => test.id !== testId)
  const cooldownOptions = [...new Set<number>([...COOLDOWN_CHOICES, settings.cooldown_minutes])].sort((a, b) => a - b).map((minutes) => ({ value: String(minutes), label: t.has(`cooldown_${minutes}`) ? t(`cooldown_${minutes}`) : t("cooldown_minutes", { minutes }) }))

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Section icon={<Info className="size-[18px]" />} title={t("about")} className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <Field label={t("title")} htmlFor={ids.title} error={err("title")}>
              <Input id={ids.title} dir="auto" value={settings.title} onChange={(event) => onChange({ title: event.target.value })} aria-invalid={Boolean(err("title")) || undefined} className={cn(CONTROL, "md:text-sm")} />
            </Field>
            <Field label={t("description")} htmlFor={ids.description} hint={t("description_hint")}>
              <Textarea id={ids.description} dir="auto" value={settings.description ?? ""} onChange={(event) => onChange({ description: event.target.value || null })} className="min-h-11 rounded-xl border-[1.5px] border-border-strong px-3 py-2.5 leading-7" rows={2} />
            </Field>
          </div>
        </Section>

        <Section icon={<Clock className="size-[18px]" />} title={t("time_attempts")}>
          <SwitchRow
            label={t("time_limit")}
            checked={settings.time_limit_minutes !== null}
            onChange={(on) => {
              if (!on && settings.time_limit_minutes) lastDuration.current = settings.time_limit_minutes
              onChange({ time_limit_minutes: on ? lastDuration.current : null })
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("duration")} htmlFor={ids.duration} error={err("time_limit_minutes")}>
              <Input
                id={ids.duration}
                type="number"
                inputMode="numeric"
                min={1}
                disabled={settings.time_limit_minutes === null}
                value={settings.time_limit_minutes === null ? "" : Number.isFinite(settings.time_limit_minutes) ? settings.time_limit_minutes : ""}
                placeholder={t("no_limit")}
                onChange={(event) => onChange({ time_limit_minutes: event.target.value === "" ? Number.NaN : Number(event.target.value) })}
                className={INPUT}
              />
            </Field>
            <Field label={t("attempts")} htmlFor={ids.attempts} error={err("max_attempts")}>
              <Input
                id={ids.attempts}
                type="number"
                inputMode="numeric"
                min={1}
                disabled={settings.max_attempts === null}
                value={settings.max_attempts === null ? "" : Number.isFinite(settings.max_attempts) ? settings.max_attempts : ""}
                placeholder={t("unlimited")}
                onChange={(event) => onChange({ max_attempts: event.target.value === "" ? Number.NaN : Number(event.target.value) })}
                className={INPUT}
              />
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={settings.max_attempts === null}
                  onChange={(event) => {
                    if (event.target.checked && settings.max_attempts) lastAttempts.current = settings.max_attempts
                    onChange({ max_attempts: event.target.checked ? null : lastAttempts.current })
                  }}
                  className="size-[18px] accent-sky-700"
                />
                {t("unlimited_attempts")}
              </label>
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground/80">{t("grading_policy")}</span>
            <Segmented<GradingPolicy>
              label={t("grading_policy")}
              value={settings.grading_policy}
              onChange={(grading_policy) => onChange({ grading_policy })}
              options={[
                { value: "highest", label: t("policy_highest") },
                { value: "last", label: t("policy_last") },
                { value: "average", label: t("policy_average") },
              ]}
            />
          </div>
          <Field label={t("cooldown")} htmlFor={ids.cooldown} error={err("cooldown_minutes")}>
            <ChoiceSelect id={ids.cooldown} value={String(settings.cooldown_minutes)} onChange={(value) => onChange({ cooldown_minutes: Number(value) })} options={cooldownOptions} />
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground/80">{t("on_time_up")}</span>
            <span className="rounded-xl bg-page px-3 py-2.5 text-[13px] text-muted-foreground">{t("on_time_up_value")}</span>
          </div>
        </Section>

        <Section icon={<CircleCheck className="size-[18px]" />} title={t("passing")}>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor={ids.pass} className="text-xs font-semibold text-foreground/80">
                {t("pass_percent")}
              </label>
              <span className="text-xl font-bold text-primary-deep tabular-nums" aria-hidden>
                {settings.pass_percent}%
              </span>
            </div>
            <input
              id={ids.pass}
              type="range"
              min={1}
              max={100}
              value={settings.pass_percent}
              onChange={(event) => onChange({ pass_percent: Number(event.target.value) })}
              aria-valuetext={t("pass_valuetext", { percent: settings.pass_percent, points: passPoints(summary.totalPoints, settings.pass_percent), total: summary.totalPoints })}
              className="h-11 w-full cursor-pointer accent-sky-700"
            />
            <span className="text-xs text-muted-foreground tabular-nums">{t("pass_points", { points: passPoints(summary.totalPoints, settings.pass_percent), total: summary.totalPoints })}</span>
          </div>
          <SwitchRow label={t("complete_on_pass")} checked={settings.complete_item_on_pass_only} onChange={(complete_item_on_pass_only) => onChange({ complete_item_on_pass_only })} />
          <SwitchRow label={t("notify_exhausted")} checked={settings.notify_teacher_on_attempts_exhausted} onChange={(notify_teacher_on_attempts_exhausted) => onChange({ notify_teacher_on_attempts_exhausted })} />
        </Section>

        <Section icon={<CalendarDays className="size-[18px]" />} title={t("availability")}>
          <div ref={placementRef} className="flex flex-col gap-4">
            <Field label={t("lesson")} htmlFor={ids.lesson}>
              <ChoiceSelect id={ids.lesson} value={settings.lesson_id === null ? "" : String(settings.lesson_id)} onChange={(value) => onChange({ lesson_id: value ? Number(value) : null, position: 0, parent_item_id: null })} options={lessons} placeholder={lessons.length ? t("lesson_placeholder") : t("no_lessons")} disabled={lessons.length === 0} />
            </Field>
            <Field label={t("placement")} htmlFor={ids.placement}>
              <ChoiceSelect
                id={ids.placement}
                value={settings.placement}
                onChange={(value) => onChange({ placement: value as TestSettings["placement"], parent_item_id: value === "inside_item" ? settings.parent_item_id : null })}
                options={[
                  { value: "standalone_item", label: t("placement_standalone") },
                  { value: "inside_item", label: t("placement_inside") },
                ]}
              />
            </Field>
            {settings.placement === "standalone_item" ? (
              <Field label={t("position")} htmlFor={ids.position}>
                <ChoiceSelect id={ids.position} value={String(Math.min(settings.position, lessonItems.length))} onChange={(value) => onChange({ position: Number(value) })} options={positionOptions} disabled={settings.lesson_id === null} />
              </Field>
            ) : (
              <Field label={t("parent_item")} htmlFor={ids.parent} error={err("parent_item_id")}>
                <ChoiceSelect id={ids.parent} value={settings.parent_item_id === null ? "" : String(settings.parent_item_id)} onChange={(value) => onChange({ parent_item_id: value ? Number(value) : null })} options={parentOptions} placeholder={t("parent_placeholder")} invalid={Boolean(err("parent_item_id"))} disabled={settings.lesson_id === null} />
              </Field>
            )}
          </div>
          <div ref={prereqRef} className="flex flex-col gap-3">
            <Field label={t("prerequisite")} htmlFor={ids.prereq}>
              <ChoiceSelect
                id={ids.prereq}
                value={settings.prerequisite}
                onChange={(value) => onChange({ prerequisite: value as Prerequisite, prerequisite_ids: value === "pass_tests" ? settings.prerequisite_ids : [] })}
                options={[
                  { value: "none", label: t("prereq_none") },
                  { value: "previous_item", label: t("prereq_previous") },
                  { value: "pass_tests", label: t("prereq_tests") },
                ]}
              />
            </Field>
            {settings.prerequisite === "pass_tests" ? (
              <fieldset className="flex flex-col gap-1 rounded-xl border border-border p-2">
                <legend className="px-1 text-xs font-semibold text-foreground/80">{t("prereq_tests_legend")}</legend>
                {otherTests.length === 0 ? <p className="px-1 py-2 text-xs text-muted-foreground">{t("prereq_no_tests")}</p> : null}
                {otherTests.map((test) => (
                  <label key={test.id} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={settings.prerequisite_ids.includes(test.id)}
                      onChange={(event) => onChange({ prerequisite_ids: event.target.checked ? [...settings.prerequisite_ids, test.id] : settings.prerequisite_ids.filter((id) => id !== test.id) })}
                      className="size-[18px] accent-sky-700"
                    />
                    <span className="truncate" dir="auto">
                      {test.title}
                    </span>
                  </label>
                ))}
                {err("prerequisite_ids") ? <p role="alert" className="px-1 text-xs font-medium text-red-700 dark:text-red-300">{err("prerequisite_ids")}</p> : null}
              </fieldset>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateTimeField id={ids.opens} label={t("opens_at")} value={settings.opens_at} onChange={(opens_at) => onChange({ opens_at })} clearLabel={t("clear_opens")} placeholder={t("opens_placeholder")} />
            <DateTimeField id={ids.closes} label={t("closes_at")} value={settings.closes_at} onChange={(closes_at) => onChange({ closes_at })} clearLabel={t("clear_closes")} placeholder={t("closes_placeholder")} invalid={Boolean(err("closes_at"))} describedBy={err("closes_at") ? ids.windowError : undefined} />
          </div>
          {err("closes_at") ? (
            <p id={ids.windowError} role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">
              {err("closes_at")}
            </p>
          ) : null}
          <span className="text-xs leading-[1.7] text-muted-foreground">{t("schedule_hint")}</span>
        </Section>

        <Section icon={<SlidersHorizontal className="size-[18px]" />} title={t("display")}>
          <SwitchRow label={t("shuffle_questions")} checked={settings.shuffle_questions} onChange={(shuffle_questions) => onChange({ shuffle_questions })} />
          <SwitchRow label={t("allow_back")} checked={settings.allow_back_navigation} onChange={(allow_back_navigation) => onChange({ allow_back_navigation })} />
          <SwitchRow
            label={t("random_pool")}
            checked={settings.random_pool_size !== null}
            onChange={(on) => {
              if (!on && settings.random_pool_size) lastPool.current = settings.random_pool_size
              onChange({ random_pool_size: on ? Math.max(1, Math.min(lastPool.current, questions.length || 1)) : null })
            }}
          />
          {settings.random_pool_size !== null ? (
            <Field label={t("pool_size")} htmlFor={ids.pool} hint={t("pool_of", { count: questions.length })} error={err("random_pool_size")}>
              <Input id={ids.pool} type="number" inputMode="numeric" min={1} max={questions.length} value={Number.isFinite(settings.random_pool_size) ? settings.random_pool_size : ""} onChange={(event) => onChange({ random_pool_size: event.target.value === "" ? Number.NaN : Number(event.target.value) })} className={cn(INPUT, "max-w-32")} />
            </Field>
          ) : null}
          <Field label={t("show_answers")} htmlFor={ids.showAnswers} className="border-t border-border pt-3">
            <ChoiceSelect
              id={ids.showAnswers}
              value={settings.show_correct_answers}
              onChange={(value) => onChange({ show_correct_answers: value as ShowCorrectAnswers })}
              options={[
                { value: "never", label: t("show_never") },
                { value: "after_submit", label: t("show_after_submit") },
                { value: "after_pass_or_exhausted", label: t("show_after_pass") },
              ]}
            />
          </Field>
          <SwitchRow label={t("show_score")} checked={settings.show_score_immediately} onChange={(show_score_immediately) => onChange({ show_score_immediately })} />
        </Section>
      </div>

      <div className="xl:sticky xl:top-4">
        <StudentPreviewPanel settings={settings} questions={questions} courseTests={courseTests} issues={issues} />
      </div>
    </div>
  )
}

function DateTimeField({ id, label, value, onChange, clearLabel, placeholder, invalid, describedBy }: { id: string; label: string; value: string | null; onChange: (value: string | null) => void; clearLabel: string; placeholder: string; invalid?: boolean; describedBy?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-foreground/80">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type="datetime-local"
          value={isoToLocalInput(value)}
          onChange={(event) => onChange(localInputToIso(event.target.value))}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-placeholder={placeholder}
          className={cn(CONTROL, "pe-11 tabular-nums md:text-sm")}
        />
        {value ? (
          <button type="button" onClick={() => onChange(null)} aria-label={clearLabel} className="absolute end-0 top-0 grid size-11 place-items-center rounded-xl text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <span className="pointer-events-none sr-only">{placeholder}</span>
        )}
      </div>
    </div>
  )
}
