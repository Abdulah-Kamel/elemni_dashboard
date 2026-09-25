"use client"

import { useId, useState } from "react"
import { useTranslations } from "next-intl"
import { ArrowDown, ArrowUp, Code2, Copy, ImageIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { CourseItemOption, QuestionType } from "../../types"
import { QUESTION_TYPES, validateQuestion, type DraftQuestion } from "./builder-model"
import { ChoiceOptionsEditor, EssayEditor, MatchingEditor, OrderingEditor, ShortAnswerEditor } from "./answer-editors"
import { ChoiceSelect, Field, FieldError, SwitchRow } from "./controls"
import { useIssueText } from "./issue-text"
import { CARD, CONTROL, ENTER, FIELD_LABEL, ICON_BUTTON } from "./styles"

type Props = {
  question: DraftQuestion
  number: number
  total: number
  courseItems: CourseItemOption[]
  onChange: (update: (question: DraftQuestion) => DraftQuestion) => void
  onTypeChange: (type: QuestionType) => void
  onMove: (delta: -1 | 1) => void
  onDuplicate: () => void
  onDelete: () => void
}

const TOOL_BUTTON = "flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-muted-foreground outline-none hover:bg-card hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-card aria-pressed:text-primary-deep"

export function QuestionEditor({ question, number, total, courseItems, onChange, onTypeChange, onMove, onDuplicate, onDelete }: Props) {
  const t = useTranslations("courseTests.builder")
  const { message } = useIssueText()
  const ids = { type: useId(), points: useId(), text: useId(), code: useId(), image: useId(), explanation: useId(), topic: useId(), pointsError: useId(), textError: useId() }
  const [showCode, setShowCode] = useState(Boolean(question.code_snippet))
  const [showImage, setShowImage] = useState(Boolean(question.image_url))
  const issues = validateQuestion(question)
  const pointsInvalid = issues.includes("points_invalid")
  const textMissing = issues.includes("text_required")
  const answerIssues = issues.filter((code) => code !== "points_invalid" && code !== "text_required")
  const topicOptions = [{ value: "none", label: t("editor.topic_none") }, ...courseItems.filter((item) => item.kind !== "test").map((item) => ({ value: String(item.id), label: `${item.lesson_title} — ${item.title}` }))]
  const bankSaved = question.bank_question_id !== null

  return (
    <section aria-label={t("editor.label", { number })} className={cn(CARD, "flex min-w-0 flex-col gap-5 rounded-3xl p-4 sm:p-6", ENTER)}>
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("editor.type_label", { number, total })} htmlFor={ids.type} className="min-w-52 flex-1">
          <ChoiceSelect id={ids.type} value={question.type} onChange={(value) => onTypeChange(value as QuestionType)} options={QUESTION_TYPES.map((type) => ({ value: type, label: t(`types.${type}`) }))} />
        </Field>
        <Field label={t("editor.points")} htmlFor={ids.points} className="w-[110px]">
          <Input
            id={ids.points}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={Number.isFinite(question.points) ? question.points : ""}
            onChange={(event) => onChange((current) => ({ ...current, points: event.target.value === "" ? Number.NaN : Number(event.target.value) }))}
            aria-invalid={pointsInvalid || undefined}
            aria-describedby={pointsInvalid ? ids.pointsError : undefined}
            className={cn(CONTROL, "text-[15px] tabular-nums md:text-[15px]")}
          />
        </Field>
        <div className="flex gap-2">
          <button type="button" onClick={() => onMove(-1)} disabled={number === 1} aria-label={t("editor.move_up")} className={cn(ICON_BUTTON, "grid place-items-center disabled:opacity-40")}>
            <ArrowUp className="size-[18px]" aria-hidden />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={number === total} aria-label={t("editor.move_down")} className={cn(ICON_BUTTON, "grid place-items-center disabled:opacity-40")}>
            <ArrowDown className="size-[18px]" aria-hidden />
          </button>
          <button type="button" onClick={onDuplicate} aria-label={t("editor.duplicate")} className={cn(ICON_BUTTON, "grid place-items-center")}>
            <Copy className="size-[18px]" aria-hidden />
          </button>
          <button type="button" onClick={onDelete} aria-label={t("editor.delete")} className={cn(ICON_BUTTON, "grid place-items-center border-destructive/30 text-destructive hover:bg-error-tint hover:text-destructive")}>
            <Trash2 className="size-[18px]" aria-hidden />
          </button>
        </div>
      </div>
      {pointsInvalid ? <FieldError id={ids.pointsError}>{message("points_invalid")}</FieldError> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.text} className={FIELD_LABEL}>
          {t("editor.text")}
        </label>
        <div className="overflow-hidden rounded-[14px] border-[1.5px] border-border-strong transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-4 focus-within:ring-primary-tint">
          <div role="toolbar" aria-label={t("editor.toolbar")} className="flex h-11 items-center gap-1 border-b border-border bg-page px-2">
            <button type="button" aria-pressed={showCode} onClick={() => setShowCode((value) => !value)} className={TOOL_BUTTON}>
              <Code2 className="size-4" aria-hidden />
              {t("editor.code_toggle")}
            </button>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <button type="button" aria-pressed={showImage} onClick={() => setShowImage((value) => !value)} className={TOOL_BUTTON}>
              <ImageIcon className="size-4" aria-hidden />
              {t("editor.image_toggle")}
            </button>
          </div>
          <textarea
            id={ids.text}
            dir="auto"
            value={question.text}
            onChange={(event) => onChange((current) => ({ ...current, text: event.target.value }))}
            placeholder={t("editor.text_placeholder")}
            aria-invalid={textMissing || undefined}
            aria-describedby={textMissing ? ids.textError : undefined}
            className="block min-h-[84px] w-full resize-y border-none bg-card px-4 py-3.5 text-base leading-[1.8] outline-none"
          />
        </div>
        {textMissing ? <FieldError id={ids.textError}>{message("text_required")}</FieldError> : null}
      </div>

      {showCode ? (
        <Field label={t("editor.code")} htmlFor={ids.code} hint={t("editor.code_hint")} className={ENTER}>
          <textarea
            id={ids.code}
            dir="ltr"
            spellCheck={false}
            value={question.code_snippet ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, code_snippet: event.target.value }))}
            className="min-h-24 resize-y rounded-xl border-[1.5px] border-border-strong bg-foreground/[0.03] px-4 py-3 text-start font-mono text-sm leading-7 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </Field>
      ) : null}

      {showImage ? (
        <div className={cn("flex flex-col gap-2", ENTER)}>
          <Field label={t("editor.image_url")} htmlFor={ids.image} hint={t("editor.image_hint")}>
            <Input id={ids.image} type="url" dir="ltr" inputMode="url" value={question.image_url ?? ""} onChange={(event) => onChange((current) => ({ ...current, image_url: event.target.value }))} placeholder="https://" className={cn(CONTROL, "md:text-sm")} />
          </Field>
          {question.image_url?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary teacher-provided URL; next/image needs allow-listed hosts
            <img src={question.image_url} alt={t("editor.image_alt", { number })} className="max-h-56 w-fit max-w-full rounded-xl border border-border object-contain" />
          ) : null}
        </div>
      ) : null}

      <div key={question.type} className={cn("flex flex-col gap-2", ENTER)}>
        {question.type === "single" || question.type === "multi" || question.type === "true_false" ? <ChoiceOptionsEditor question={question} onChange={onChange} /> : null}
        {question.type === "ordering" ? <OrderingEditor question={question} onChange={onChange} /> : null}
        {question.type === "matching" ? <MatchingEditor question={question} onChange={onChange} /> : null}
        {question.type === "short_answer" ? <ShortAnswerEditor question={question} onChange={onChange} /> : null}
        {question.type === "essay" ? <EssayEditor question={question} onChange={onChange} /> : null}
        {answerIssues.length > 0 ? (
          <ul className="flex flex-col gap-1" aria-label={t("editor.answer_issues")}>
            {answerIssues.map((code) => (
              <li key={code}>
                <FieldError>{message(code)}</FieldError>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Field label={t("editor.explanation")} htmlFor={ids.explanation} hint={t("editor.explanation_hint")}>
        <Textarea id={ids.explanation} dir="auto" value={question.explanation ?? ""} onChange={(event) => onChange((current) => ({ ...current, explanation: event.target.value }))} className="min-h-[76px] rounded-xl border-[1.5px] border-border-strong px-3.5 py-3 leading-[1.8]" />
      </Field>

      <Field label={t("editor.topic")} htmlFor={ids.topic} hint={t("editor.topic_hint")}>
        <ChoiceSelect id={ids.topic} value={question.topic_ref === null ? "none" : String(question.topic_ref)} onChange={(value) => onChange((current) => ({ ...current, topic_ref: value === "none" || !value ? null : Number(value) }))} options={topicOptions} />
      </Field>

      <div className="grid gap-x-6 gap-y-1 border-t border-border pt-4 sm:grid-cols-2">
        {question.type === "single" || question.type === "multi" || question.type === "matching" ? (
          <SwitchRow label={t("editor.shuffle_options")} checked={question.shuffle_options} onChange={(value) => onChange((current) => ({ ...current, shuffle_options: value }))} />
        ) : null}
        <SwitchRow
          label={t("editor.save_to_bank")}
          hint={bankSaved ? t("editor.saved_in_bank") : undefined}
          checked={bankSaved || Boolean(question.save_to_bank)}
          disabled={bankSaved}
          onChange={(value) => onChange((current) => ({ ...current, save_to_bank: value }))}
        />
      </div>
    </section>
  )
}
