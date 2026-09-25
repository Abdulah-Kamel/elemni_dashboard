"use client"

import { useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { summarize, type DraftQuestion, type Issue } from "./builder-model"
import { useIssueText } from "./issue-text"
import { CARD, ERROR_BOX, WARNING_BOX, WARNING_TEXT } from "./styles"

/** Blocking issues; question issues jump to the question when clicked. */
export function IssueList({ issues, onSelectQuestion, onOpenSettings, className }: { issues: Issue[]; onSelectQuestion?: (id: number) => void; onOpenSettings?: () => void; className?: string }) {
  const { full } = useIssueText()
  const [ref] = useAutoAnimate<HTMLUListElement>({ duration: 180 })
  return (
    <ul ref={ref} className={cn("flex flex-col gap-2", className)}>
      {issues.map((issue, index) => {
        const action = issue.questionId !== undefined ? () => onSelectQuestion?.(issue.questionId!) : issue.fields ? onOpenSettings : undefined
        const content = (
          <>
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{full(issue)}</span>
          </>
        )
        return (
          <li key={`${issue.code}-${issue.questionId ?? index}`}>
            {action ? (
              <button type="button" onClick={action} className={cn("flex w-full gap-2 rounded-xl px-3 py-2.5 text-start text-xs leading-[1.7] outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50", ERROR_BOX)}>
                {content}
              </button>
            ) : (
              <p className={cn("flex gap-2 rounded-xl px-3 py-2.5 text-xs leading-[1.7]", ERROR_BOX)}>{content}</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function SummaryPanel({ questions, issues, onSelectQuestion, onOpenSettings }: { questions: DraftQuestion[]; issues: Issue[]; onSelectQuestion: (id: number) => void; onOpenSettings: () => void }) {
  const t = useTranslations("courseTests.builder.summary")
  const summary = summarize(questions)
  const autoShare = summary.totalPoints > 0 ? Math.round((summary.autoPoints / summary.totalPoints) * 100) : 0
  return (
    <section aria-labelledby="builder-summary-heading" className={cn(CARD, "flex flex-col gap-3 p-[18px]")}>
      <h2 id="builder-summary-heading" className="text-sm font-semibold">
        {t("title")}
      </h2>
      <dl className="flex flex-col gap-3 text-[13px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{t("total_points")}</dt>
          <dd className="font-bold tabular-nums">{summary.totalPoints}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{t("auto")}</dt>
          <dd className="font-bold tabular-nums">{t("count_points", { count: summary.autoCount, points: summary.autoPoints })}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{t("manual")}</dt>
          <dd className={cn("font-bold tabular-nums", summary.manualCount > 0 && WARNING_TEXT)}>{t("count_points", { count: summary.manualCount, points: summary.manualPoints })}</dd>
        </div>
      </dl>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950"
        role="img"
        aria-label={t("auto_share", { percent: autoShare })}
      >
        <div className="h-2 bg-primary transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${autoShare}%` }} />
      </div>
      {summary.manualCount > 0 ? <p className={cn("rounded-xl px-3 py-2.5 text-xs leading-[1.7]", WARNING_BOX)}>{t("essay_note")}</p> : null}
      {issues.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="sr-only">{t("issues_title")}</h3>
          <IssueList issues={issues} onSelectQuestion={onSelectQuestion} onOpenSettings={onOpenSettings} />
        </div>
      ) : (
        <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{t("ready")}</p>
      )}
    </section>
  )
}
