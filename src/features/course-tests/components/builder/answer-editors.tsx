"use client"

import { useId, useState } from "react"
import { useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  MIN_OPTIONS,
  addAcceptedAnswer,
  addMatchingPair,
  addOption,
  addRightOption,
  isCorrectOption,
  key,
  moveOption,
  removeAcceptedAnswer,
  removeOption,
  removeRightOption,
  rightOptions,
  rubricTotal,
  setCaseSensitive,
  setCorrectOption,
  setEssayKey,
  setMatch,
  setOptionText,
  setRightText,
  toggleCorrectOption,
  type DraftQuestion,
} from "./builder-model"
import { ChoiceSelect, Field, SwitchRow } from "./controls"
import { SortableRows } from "./sortable-rows"
import { CONTROL, FIELD_LABEL, SUCCESS_TEXT, WARNING_TEXT } from "./styles"

type EditorProps = { question: DraftQuestion; onChange: (update: (question: DraftQuestion) => DraftQuestion) => void }

export const OPTION_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"]
export function optionLetter(index: number) {
  return OPTION_LETTERS[index] ?? String(index + 1)
}

const OPTION_INPUT = "h-12 flex-1 rounded-xl border-[1.5px] border-border-strong bg-card px-3.5 text-[15px] transition-colors"
const SMALL_ICON = "grid size-11 shrink-0 place-items-center rounded-xl text-on-surface-subtle outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30"
const ADD_BUTTON = "flex h-11 items-center gap-1.5 self-start rounded-xl bg-muted px-3.5 text-sm font-semibold text-primary-deep outline-none hover:bg-primary-tint focus-visible:ring-3 focus-visible:ring-ring/50"

// ---------------------------------------------------------------------------
// single / multi / true_false

export function ChoiceOptionsEditor({ question, onChange }: EditorProps) {
  const t = useTranslations("courseTests.builder.options")
  const groupName = useId()
  const multi = question.type === "multi"
  const fixed = question.type === "true_false"
  const legend = multi ? t("legend_multi") : fixed ? t("legend_true_false") : t("legend_single")
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className={cn(FIELD_LABEL, "mb-2.5")}>{legend}</legend>
      <SortableRows items={question.options} onMove={(from, to) => onChange((current) => moveOption(current, from, to))} handleLabel={(_, index) => t("drag", { letter: optionLetter(index) })}>
        {(option, index, handle) => {
          const correct = isCorrectOption(question, option.id)
          const letter = optionLetter(index)
          return (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {fixed ? <span className="w-7 shrink-0" aria-hidden /> : handle}
              <label className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl hover:bg-muted">
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={groupName}
                  checked={correct}
                  onChange={() => onChange((current) => (multi ? toggleCorrectOption(current, option.id) : setCorrectOption(current, option.id)))}
                  aria-label={t("mark_correct", { letter })}
                  className="size-5 accent-emerald-600"
                />
              </label>
              <input
                type="text"
                dir="auto"
                value={option.text}
                readOnly={fixed}
                onChange={(event) => onChange((current) => setOptionText(current, option.id, event.target.value))}
                aria-label={t("option", { letter })}
                placeholder={t("option_placeholder", { letter })}
                className={cn(OPTION_INPUT, "min-w-0 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40", correct && "border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40", fixed && "cursor-default")}
              />
              {correct ? <span className={cn("hidden shrink-0 rounded-full bg-emerald-100 px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap sm:inline dark:bg-emerald-950", SUCCESS_TEXT)}>{t("correct_badge")}</span> : null}
              {!fixed ? (
                <button type="button" onClick={() => onChange((current) => removeOption(current, option.id))} disabled={question.options.length <= MIN_OPTIONS} aria-label={t("remove", { letter })} className={SMALL_ICON}>
                  <X className="size-[18px]" aria-hidden />
                </button>
              ) : null}
            </div>
          )
        }}
      </SortableRows>
      {!fixed ? (
        <button type="button" onClick={() => onChange((current) => addOption(current))} className={cn(ADD_BUTTON, "ms-0 sm:ms-[70px]")}>
          <Plus className="size-[18px]" aria-hidden />
          {t("add")}
        </button>
      ) : null}
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// ordering — options are kept in the correct order

export function OrderingEditor({ question, onChange }: EditorProps) {
  const t = useTranslations("courseTests.builder.ordering")
  const count = question.options.length
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className={cn(FIELD_LABEL, "mb-1")}>{t("legend")}</legend>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      <SortableRows items={question.options} onMove={(from, to) => onChange((current) => moveOption(current, from, to))} handleLabel={(_, index) => t("drag", { position: index + 1 })}>
        {(option, index, handle) => (
          <div className="flex items-center gap-1.5">
            {handle}
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-tint text-sm font-bold text-primary-deep tabular-nums" aria-hidden>
              {index + 1}
            </span>
            <input
              type="text"
              dir="auto"
              value={option.text}
              onChange={(event) => onChange((current) => setOptionText(current, option.id, event.target.value))}
              aria-label={t("item", { position: index + 1 })}
              placeholder={t("item_placeholder", { position: index + 1 })}
              className={cn(OPTION_INPUT, "min-w-0 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40")}
            />
            <button type="button" onClick={() => onChange((current) => moveOption(current, index, index - 1))} disabled={index === 0} aria-label={t("move_up", { position: index + 1 })} className={SMALL_ICON}>
              <ArrowUp className="size-[18px]" aria-hidden />
            </button>
            <button type="button" onClick={() => onChange((current) => moveOption(current, index, index + 1))} disabled={index === count - 1} aria-label={t("move_down", { position: index + 1 })} className={SMALL_ICON}>
              <ArrowDown className="size-[18px]" aria-hidden />
            </button>
            <button type="button" onClick={() => onChange((current) => removeOption(current, option.id))} disabled={count <= MIN_OPTIONS} aria-label={t("remove", { position: index + 1 })} className={SMALL_ICON}>
              <X className="size-[18px]" aria-hidden />
            </button>
          </div>
        )}
      </SortableRows>
      <button type="button" onClick={() => onChange((current) => addOption(current))} className={ADD_BUTTON}>
        <Plus className="size-[18px]" aria-hidden />
        {t("add")}
      </button>
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// matching — options are the items; right_options are what they match

export function MatchingEditor({ question, onChange }: EditorProps) {
  const t = useTranslations("courseTests.builder.matching")
  const [leftRef] = useAutoAnimate<HTMLOListElement>({ duration: 180 })
  const [rightRef] = useAutoAnimate<HTMLOListElement>({ duration: 180 })
  const rights = rightOptions(question)
  const matches = key(question).matches ?? {}
  const choices = rights.map((option, index) => ({ value: option.id, label: option.text.trim() || t("right_untitled", { number: index + 1 }) }))
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2.5">
        <legend className={cn(FIELD_LABEL, "mb-1")}>{t("pairs_legend")}</legend>
        <p className="text-xs text-muted-foreground">{t("pairs_hint")}</p>
        <ol ref={leftRef} className="flex flex-col gap-2.5">
          {question.options.map((option, index) => (
            <li key={option.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input
                type="text"
                dir="auto"
                value={option.text}
                onChange={(event) => onChange((current) => setOptionText(current, option.id, event.target.value))}
                aria-label={t("item", { number: index + 1 })}
                placeholder={t("item_placeholder", { number: index + 1 })}
                className={cn(OPTION_INPUT, "min-w-0 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40")}
              />
              <div className="order-last col-span-2 sm:order-none sm:col-span-1">
                <ChoiceSelect
                  value={matches[option.id] ?? ""}
                  onChange={(value) => onChange((current) => setMatch(current, option.id, value || null))}
                  options={choices}
                  placeholder={t("match_placeholder")}
                  invalid={!matches[option.id]}
                  ariaLabel={t("match_label", { number: index + 1 })}
                />
              </div>
              <button type="button" onClick={() => onChange((current) => removeOption(current, option.id))} disabled={question.options.length <= MIN_OPTIONS} aria-label={t("remove_item", { number: index + 1 })} className={SMALL_ICON}>
                <X className="size-[18px]" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => onChange((current) => addMatchingPair(current))} className={ADD_BUTTON}>
          <Plus className="size-[18px]" aria-hidden />
          {t("add_pair")}
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5 border-t border-border pt-4">
        <legend className={cn(FIELD_LABEL, "mb-1")}>{t("right_legend")}</legend>
        <p className="text-xs text-muted-foreground">{t("right_hint")}</p>
        <ol ref={rightRef} className="flex flex-col gap-2.5">
          {rights.map((option, index) => (
            <li key={option.id} className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold text-muted-foreground tabular-nums" aria-hidden>
                {index + 1}
              </span>
              <input
                type="text"
                dir="auto"
                value={option.text}
                onChange={(event) => onChange((current) => setRightText(current, option.id, event.target.value))}
                aria-label={t("right_item", { number: index + 1 })}
                placeholder={t("right_placeholder", { number: index + 1 })}
                className={cn(OPTION_INPUT, "min-w-0 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40")}
              />
              <button type="button" onClick={() => onChange((current) => removeRightOption(current, option.id))} disabled={rights.length <= MIN_OPTIONS} aria-label={t("remove_right", { number: index + 1 })} className={SMALL_ICON}>
                <X className="size-[18px]" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => onChange((current) => addRightOption(current))} className={ADD_BUTTON}>
          <Plus className="size-[18px]" aria-hidden />
          {t("add_right")}
        </button>
      </fieldset>
    </div>
  )
}

// ---------------------------------------------------------------------------
// short answer

export function ShortAnswerEditor({ question, onChange }: EditorProps) {
  const t = useTranslations("courseTests.builder.short_answer")
  const [draft, setDraft] = useState("")
  const [chipsRef] = useAutoAnimate<HTMLUListElement>({ duration: 160 })
  const inputId = useId()
  const accepted = key(question).accepted ?? []
  const add = () => {
    if (!draft.trim()) return
    onChange((current) => addAcceptedAnswer(current, draft))
    setDraft("")
  }
  return (
    <div className="flex flex-col gap-3">
      <Field label={t("label")} htmlFor={inputId} hint={t("hint")}>
        <div className="flex gap-2">
          <Input
            id={inputId}
            dir="auto"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                add()
              }
            }}
            placeholder={t("placeholder")}
            className={cn(CONTROL, "md:text-sm")}
          />
          <button type="button" onClick={add} className={cn(ADD_BUTTON, "shrink-0")}>
            <Plus className="size-[18px]" aria-hidden />
            {t("add")}
          </button>
        </div>
      </Field>
      <ul ref={chipsRef} aria-label={t("list_label")} className="flex flex-wrap gap-2">
        {accepted.length === 0 ? <li className="text-xs text-muted-foreground">{t("empty")}</li> : null}
        {accepted.map((answer) => (
          <li key={answer} className="flex h-9 items-center gap-1 rounded-full border border-emerald-600/40 bg-emerald-50 ps-3 pe-1 text-sm dark:bg-emerald-950/40">
            <span dir="auto">{answer}</span>
            <button type="button" onClick={() => onChange((current) => removeAcceptedAnswer(current, answer))} aria-label={t("remove", { answer })} className="grid size-7 place-items-center rounded-full outline-none hover:bg-emerald-100 focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-emerald-900">
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <SwitchRow label={t("case_sensitive")} hint={t("case_hint")} checked={Boolean(key(question).case_sensitive)} onChange={(value) => onChange((current) => setCaseSensitive(current, value))} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// essay

export function EssayEditor({ question, onChange }: EditorProps) {
  const t = useTranslations("courseTests.builder.essay")
  const [rubricRef] = useAutoAnimate<HTMLOListElement>({ duration: 180 })
  const modelId = useId()
  const limitId = useId()
  const answer = key(question)
  const rubric = answer.rubric ?? []
  const total = rubricTotal(question)
  const matchesPoints = total === question.points
  const setRow = (index: number, patch: Partial<{ criterion: string; points: number }>) => onChange((current) => setEssayKey(current, { rubric: (key(current).rubric ?? []).map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)) }))
  return (
    <div className="flex flex-col gap-5">
      <Field label={t("model_answer")} htmlFor={modelId} hint={t("model_hint")}>
        <Textarea id={modelId} dir="auto" value={answer.model_answer ?? ""} onChange={(event) => onChange((current) => setEssayKey(current, { model_answer: event.target.value }))} className="min-h-24 rounded-xl border-[1.5px] border-border-strong px-3.5 py-3 leading-7" />
      </Field>

      <fieldset className="flex flex-col gap-2.5">
        <legend className={cn(FIELD_LABEL, "mb-1")}>{t("rubric")}</legend>
        <ol ref={rubricRef} className="flex flex-col gap-2">
          {rubric.map((row, index) => (
            <li key={index} className="flex items-center gap-2">
              <input
                type="text"
                dir="auto"
                value={row.criterion}
                onChange={(event) => setRow(index, { criterion: event.target.value })}
                aria-label={t("criterion", { number: index + 1 })}
                placeholder={t("criterion_placeholder")}
                className={cn(OPTION_INPUT, "h-11 min-w-0 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40")}
              />
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={Number.isFinite(row.points) ? row.points : ""}
                onChange={(event) => setRow(index, { points: event.target.value === "" ? Number.NaN : Number(event.target.value) })}
                aria-label={t("criterion_points", { number: index + 1 })}
                className={cn(CONTROL, "w-20 shrink-0 tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40")}
              />
              <button type="button" onClick={() => onChange((current) => setEssayKey(current, { rubric: (key(current).rubric ?? []).filter((_, rowIndex) => rowIndex !== index) }))} aria-label={t("remove_criterion", { number: index + 1 })} className={SMALL_ICON}>
                <X className="size-[18px]" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => onChange((current) => setEssayKey(current, { rubric: [...(key(current).rubric ?? []), { criterion: "", points: 1 }] }))} className={ADD_BUTTON}>
            <Plus className="size-[18px]" aria-hidden />
            {t("add_criterion")}
          </button>
          {rubric.length > 0 ? (
            <span className={cn("text-xs tabular-nums", matchesPoints ? SUCCESS_TEXT : WARNING_TEXT)} aria-live="polite">
              {matchesPoints ? t("rubric_sum_ok", { total, points: question.points }) : t("rubric_sum_mismatch", { total, points: question.points })}
            </span>
          ) : null}
        </div>
      </fieldset>

      <Field label={t("word_limit")} htmlFor={limitId} hint={t("word_limit_hint")} className="max-w-56">
        <Input
          id={limitId}
          type="number"
          inputMode="numeric"
          min={1}
          value={answer.word_limit ?? ""}
          onChange={(event) => onChange((current) => setEssayKey(current, { word_limit: event.target.value === "" ? null : Number(event.target.value) }))}
          placeholder={t("word_limit_placeholder")}
          className={cn(CONTROL, "tabular-nums md:text-sm")}
        />
      </Field>
    </div>
  )
}
