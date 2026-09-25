"use client"

import { useLocale, useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { CalendarDays, Check, ClipboardList, Lock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CourseTestRow, TestSettings } from "../../types"
import { isFuture, summarize, type DraftQuestion, type Issue } from "./builder-model"
import { formatDateTime } from "./format"
import { useIssueText } from "./issue-text"
import { CARD, ENTER, ERROR_TEXT, SUCCESS_TEXT } from "./styles"

type PreviewProps = { settings: TestSettings; questions: DraftQuestion[]; courseTests: CourseTestRow[] }

/** The test as it appears in the student's course sidebar (Main.dc.html). */
export function SidebarItemPreview({ settings, questions, courseTests }: PreviewProps) {
  const t = useTranslations("courseTests.builder.student")
  const locale = useLocale()
  const count = settings.random_pool_size ?? questions.length
  const scheduled = isFuture(settings.opens_at)
  const locked = !scheduled && settings.prerequisite !== "none"
  const firstPrereq = courseTests.find((test) => settings.prerequisite_ids.includes(test.id))

  let subtitle: string
  if (scheduled) subtitle = t("opens_at", { date: formatDateTime(settings.opens_at, locale) })
  else if (settings.prerequisite === "previous_item") subtitle = t("locked_previous")
  else if (settings.prerequisite === "pass_tests") subtitle = firstPrereq ? t("locked_tests", { title: firstPrereq.title, more: settings.prerequisite_ids.length - 1 }) : t("locked_tests_generic")
  else subtitle = settings.time_limit_minutes ? t("meta_timed", { count, minutes: settings.time_limit_minutes }) : t("meta", { count })

  const Icon = scheduled ? CalendarDays : locked ? Lock : ClipboardList
  const badge = scheduled ? t("badge_soon") : locked ? null : t("badge_not_started")

  if (settings.placement === "inside_item") {
    return (
      <div key={`${scheduled}-${locked}`} className={cn(CARD, "flex flex-col gap-1.5 rounded-[14px] p-3", ENTER)}>
        <span className="text-xs text-muted-foreground">{t("inside_item_caption")}</span>
        <div className="flex h-10 items-center gap-2.5 rounded-lg bg-page px-2.5 text-[13px]">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="font-medium">{t("test")}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground tabular-nums">{scheduled || locked ? subtitle : t("questions", { count })}</span>
          {badge ? <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{badge}</span> : null}
        </div>
      </div>
    )
  }

  return (
    <div key={`${scheduled}-${locked}`} className={cn(CARD, "flex items-center gap-3 rounded-[14px] p-3.5", ENTER)}>
      <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-sm font-semibold" dir="auto">
          {settings.title || t("untitled")}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">{subtitle}</span>
      </div>
      {badge ? <span className="shrink-0 rounded-full bg-muted px-2.5 py-[3px] text-xs font-semibold text-muted-foreground">{badge}</span> : locked ? <Lock className="size-4 shrink-0 text-muted-foreground" aria-label={t("locked")} /> : null}
    </div>
  )
}

/** Rules shown on the start screen, derived from the settings (Intro.dc.html). */
export function useStartRules(settings: TestSettings, questions: readonly { type: DraftQuestion["type"] }[]) {
  const t = useTranslations("courseTests.builder.student")
  const locale = useLocale()
  const rules: string[] = []
  if (settings.time_limit_minutes) rules.push(t("rule_timer"))
  rules.push(settings.allow_back_navigation ? t("rule_autosave_back") : t("rule_autosave_no_back"))
  if (settings.time_limit_minutes) rules.push(t("rule_auto_submit"))
  if (settings.max_attempts !== 1) rules.push(t(`rule_policy_${settings.grading_policy}`))
  if (settings.cooldown_minutes > 0) rules.push(t("rule_cooldown", { minutes: settings.cooldown_minutes }))
  if (questions.some((question) => question.type === "essay")) rules.push(t("rule_essay"))
  if (settings.closes_at) rules.push(t("rule_closes", { date: formatDateTime(settings.closes_at, locale) }))
  return rules
}

export function StartCardPreview({ settings, questions }: Omit<PreviewProps, "courseTests">) {
  const t = useTranslations("courseTests.builder.student")
  const rules = useStartRules(settings, questions)
  const [rulesRef] = useAutoAnimate<HTMLUListElement>({ duration: 180 })
  const count = settings.random_pool_size ?? questions.length
  const tiles = [
    { label: t("tile_questions"), value: String(count) },
    { label: t("tile_duration"), value: settings.time_limit_minutes ? t("minutes_short", { minutes: settings.time_limit_minutes }) : t("no_limit") },
    { label: t("tile_attempts"), value: settings.max_attempts ? String(settings.max_attempts) : t("unlimited") },
    { label: t("tile_pass"), value: `${settings.pass_percent}%` },
  ]
  return (
    <div className={cn(CARD, "flex flex-col gap-3 rounded-[20px] p-[18px]")}>
      <span className="text-sm font-semibold">{t("start_card")}</span>
      <dl className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col gap-0.5 rounded-xl bg-page p-2.5">
            <dt className="text-[11px] text-muted-foreground">{tile.label}</dt>
            <dd key={tile.value} className={cn("text-base font-bold tabular-nums", ENTER)}>
              {tile.value}
            </dd>
          </div>
        ))}
      </dl>
      <ul ref={rulesRef} className="flex flex-col gap-1.5 text-xs leading-[1.7] text-muted-foreground">
        {rules.map((rule) => (
          <li key={rule} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            {rule}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ReadinessChecklist({ issues, questionCount }: { issues: Issue[]; questionCount: number }) {
  const t = useTranslations("courseTests.builder.readiness")
  const { full } = useIssueText()
  const [ref] = useAutoAnimate<HTMLUListElement>({ duration: 180 })
  const settingsIssues = issues.filter((issue) => issue.fields)
  const otherIssues = issues.filter((issue) => !issue.fields)
  return (
    <div className={cn(CARD, "flex flex-col gap-2 rounded-2xl p-3.5")}>
      <span className="text-[13px] font-semibold">{t("title")}</span>
      <ul ref={ref} className="flex flex-col gap-2 text-xs">
        {settingsIssues.length === 0 ? (
          <li className={cn("flex items-center gap-1.5", SUCCESS_TEXT)}>
            <Check className="size-3.5" aria-hidden />
            {t("settings_ok")}
          </li>
        ) : null}
        {otherIssues.length === 0 && questionCount > 0 ? (
          <li className={cn("flex items-center gap-1.5", SUCCESS_TEXT)}>
            <Check className="size-3.5" aria-hidden />
            {t("questions_ok", { count: questionCount })}
          </li>
        ) : null}
        {[...settingsIssues, ...otherIssues].map((issue, index) => (
          <li key={`${issue.code}-${issue.questionId ?? index}`} className={cn("flex items-start gap-1.5", ERROR_TEXT)}>
            <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {full(issue)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StudentPreviewPanel(props: PreviewProps & { issues: Issue[] }) {
  const t = useTranslations("courseTests.builder.student")
  const summary = summarize(props.questions)
  return (
    <aside aria-label={t("panel_label")} className="flex flex-col gap-3">
      <span className="text-[13px] font-semibold text-muted-foreground">{t("panel_label")}</span>
      <SidebarItemPreview {...props} />
      <StartCardPreview settings={props.settings} questions={props.questions} />
      <ReadinessChecklist issues={props.issues} questionCount={summary.count} />
    </aside>
  )
}
