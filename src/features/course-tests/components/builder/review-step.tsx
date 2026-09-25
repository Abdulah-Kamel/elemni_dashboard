"use client"

import { useLocale, useTranslations } from "next-intl"
import { CircleCheck, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { CourseItemOption, CourseTestRow, PublishIssue, TestSettings, TestStatus } from "../../types"
import { passPoints, summarize, type DraftQuestion, type Issue } from "./builder-model"
import { formatDateTime } from "./format"
import { IssueList } from "./summary-panel"
import { StartCardPreview, SidebarItemPreview } from "./student-preview-panel"
import { CARD, ENTER_UP, ERROR_BOX, PRIMARY_INK_BUTTON, SUCCESS_TEXT } from "./styles"

type Props = {
  status: TestStatus
  settings: TestSettings
  questions: DraftQuestion[]
  courseItems: CourseItemOption[]
  courseTests: CourseTestRow[]
  issues: Issue[]
  serverIssues: PublishIssue[]
  publishing: boolean
  onPublish: () => void
  onSelectQuestion: (id: number) => void
  onOpenSettings: () => void
}

export function ReviewStep({ status, settings, questions, courseItems, courseTests, issues, serverIssues, publishing, onPublish, onSelectQuestion, onOpenSettings }: Props) {
  const t = useTranslations("courseTests.builder.review")
  const ts = useTranslations("courseTests.builder.settings")
  const locale = useLocale()
  const summary = summarize(questions)
  const lesson = courseItems.find((item) => item.lesson_id === settings.lesson_id)?.lesson_title
  const parent = courseItems.find((item) => item.id === settings.parent_item_id)?.title
  const prereqTitles = courseTests.filter((test) => settings.prerequisite_ids.includes(test.id)).map((test) => test.title)

  const rows: { label: string; value: string }[] = [
    { label: ts("duration"), value: settings.time_limit_minutes ? t("minutes", { minutes: settings.time_limit_minutes }) : ts("no_limit") },
    { label: ts("attempts"), value: settings.max_attempts ? String(settings.max_attempts) : ts("unlimited") },
    { label: ts("grading_policy"), value: ts(`policy_${settings.grading_policy}`) },
    { label: ts("pass_percent"), value: `${settings.pass_percent}% · ${ts("pass_points", { points: passPoints(summary.totalPoints, settings.pass_percent), total: summary.totalPoints })}` },
    { label: ts("placement"), value: [lesson, settings.placement === "inside_item" ? t("inside", { title: parent ?? "—" }) : ts("placement_standalone")].filter(Boolean).join(" · ") },
    { label: ts("prerequisite"), value: settings.prerequisite === "pass_tests" ? `${ts("prereq_tests")}: ${prereqTitles.join("، ") || "—"}` : ts(settings.prerequisite === "none" ? "prereq_none" : "prereq_previous") },
    { label: t("window"), value: settings.opens_at || settings.closes_at ? t("window_value", { from: settings.opens_at ? formatDateTime(settings.opens_at, locale) : t("now"), to: settings.closes_at ? formatDateTime(settings.closes_at, locale) : t("no_close") }) : t("always_open") },
    { label: ts("show_answers"), value: ts(settings.show_correct_answers === "never" ? "show_never" : settings.show_correct_answers === "after_submit" ? "show_after_submit" : "show_after_pass") },
    { label: ts("show_score"), value: settings.show_score_immediately ? t("yes") : t("no") },
  ]

  const tiles = [
    { label: t("questions"), value: settings.random_pool_size ? t("pool", { pool: settings.random_pool_size, count: summary.count }) : String(summary.count) },
    { label: t("points"), value: String(summary.totalPoints) },
    { label: t("auto"), value: t("count_points", { count: summary.autoCount, points: summary.autoPoints }) },
    { label: t("manual"), value: t("count_points", { count: summary.manualCount, points: summary.manualPoints }) },
  ]

  const published = status === "published"
  const ready = issues.length === 0

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-5">
        <section aria-labelledby="review-summary" className={cn(CARD, "flex flex-col gap-4 rounded-[20px] p-5", ENTER_UP)}>
          <h2 id="review-summary" className="text-base font-semibold">
            {t("summary")}
          </h2>
          <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="flex flex-col gap-1 rounded-xl bg-page p-3">
                <dt className="text-xs text-muted-foreground">{tile.label}</dt>
                <dd className="text-base font-bold tabular-nums">{tile.value}</dd>
              </div>
            ))}
          </dl>
          <dl className="divide-y divide-border rounded-xl border border-border">
            {rows.map((row) => (
              <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-medium tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
          <Button type="button" variant="link" onClick={onOpenSettings} className="h-11 self-start px-0 text-sm">
            {t("edit_settings")}
          </Button>
        </section>

        <section aria-labelledby="review-issues" className={cn(CARD, "flex flex-col gap-4 rounded-[20px] p-5", ENTER_UP)}>
          <h2 id="review-issues" className="text-base font-semibold">
            {t("issues_title")}
          </h2>
          {ready ? (
            <p className={cn("flex items-center gap-2 text-sm font-medium", SUCCESS_TEXT)}>
              <CircleCheck className="size-5" aria-hidden />
              {published ? t("published_ok") : t("ready")}
            </p>
          ) : (
            <IssueList issues={issues} onSelectQuestion={onSelectQuestion} onOpenSettings={onOpenSettings} />
          )}
          {serverIssues.length > 0 ? (
            <div role="alert" className={cn("flex flex-col gap-2 rounded-xl p-3 text-sm", ERROR_BOX)}>
              <p className="font-semibold">{t("server_issues")}</p>
              <ul className="list-inside list-disc text-xs leading-[1.8]">
                {serverIssues.map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>
                    {issue.question_id && questions.some((question) => question.id === issue.question_id) ? (
                      <button type="button" className="underline underline-offset-2" onClick={() => onSelectQuestion(issue.question_id!)}>
                        {issue.message}
                      </button>
                    ) : (
                      issue.message
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {!published ? (
            <Button type="button" onClick={onPublish} disabled={!ready || publishing} className={cn(PRIMARY_INK_BUTTON, "self-start gap-2")}>
              <Rocket className="size-[18px]" aria-hidden />
              {publishing ? t("publishing") : t("publish")}
            </Button>
          ) : null}
        </section>
      </div>
      <aside aria-label={t("student_view")} className="flex flex-col gap-3 xl:sticky xl:top-4">
        <span className="text-[13px] font-semibold text-muted-foreground">{t("student_view")}</span>
        <SidebarItemPreview settings={settings} questions={questions} courseTests={courseTests} />
        <StartCardPreview settings={settings} questions={questions} />
      </aside>
    </div>
  )
}
