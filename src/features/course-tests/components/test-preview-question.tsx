"use client"

import { useId } from "react"
import { useTranslations } from "next-intl"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { key, moveItem } from "./builder/builder-model"
import { optionLetter } from "./builder/answer-editors"
import { ChoiceSelect } from "./builder/controls"
import { SortableRows } from "./builder/sortable-rows"
import { wordCount, type PreviewQuestion, type PreviewResponse } from "./builder/preview-scoring"
import { INK } from "./builder/styles"

type Props = { question: PreviewQuestion; response: PreviewResponse; onRespond: (response: PreviewResponse) => void }

const ICON_BUTTON = "grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30"

function ChoiceAnswer({ question, response, onRespond }: Props) {
  const t = useTranslations("courseTests.builder.preview")
  const name = useId()
  const multi = question.type === "multi"
  const chosen = multi ? (Array.isArray(response) ? response : []) : typeof response === "string" ? [response] : []
  return (
    <div role="group" aria-label={t("options")} className="flex flex-col gap-3">
      {question.displayOptions.map((option, index) => {
        const on = chosen.includes(option.id)
        return (
          <label
            key={option.id}
            className={cn(
              "relative flex min-h-[60px] cursor-pointer items-center gap-3.5 rounded-2xl px-4 py-2.5 transition-[background-color,box-shadow,border-color] duration-150 focus-within:ring-3 focus-within:ring-ring/50",
              on ? cn(INK, "bg-muted") : "border-2 border-border bg-card hover:border-foreground/30",
            )}
          >
            <input
              type={multi ? "checkbox" : "radio"}
              name={name}
              checked={on}
              onChange={() => onRespond(multi ? (on ? chosen.filter((id) => id !== option.id) : [...chosen, option.id]) : option.id)}
              className="sr-only"
            />
            <span className={cn("grid size-[34px] shrink-0 place-items-center text-[15px] font-bold transition-colors", multi ? "rounded-[9px]" : "rounded-full", on ? "bg-primary-deep text-on-primary" : "bg-muted text-muted-foreground")} aria-hidden>
              {question.type === "true_false" ? (index === 0 ? "✓" : "✗") : optionLetter(index)}
            </span>
            <span dir="auto" className="text-base font-medium">
              {option.text}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function OrderingAnswer({ question, response, onRespond }: Props) {
  const t = useTranslations("courseTests.builder.preview")
  const byId = new Map(question.displayOptions.map((option) => [option.id, option]))
  const order = Array.isArray(response) && response.length === question.displayOptions.length ? response.map((id) => byId.get(id)!).filter(Boolean) : question.displayOptions
  const move = (from: number, to: number) => onRespond(moveItem(order, from, to).map((option) => option.id))
  return (
    <SortableRows items={order} onMove={move} handleLabel={(option, index) => t("drag_item", { position: index + 1 })}>
      {(option, index, handle) => (
        <div className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-border bg-card px-2 py-1.5">
          {handle}
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-tint text-sm font-bold text-primary-deep tabular-nums" aria-hidden>
            {index + 1}
          </span>
          <span dir="auto" className="min-w-0 flex-1 text-[15px] font-medium">
            {option.text}
          </span>
          <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={t("move_up", { text: option.text })} className={ICON_BUTTON}>
            <ArrowUp className="size-[18px]" aria-hidden />
          </button>
          <button type="button" onClick={() => move(index, index + 1)} disabled={index === order.length - 1} aria-label={t("move_down", { text: option.text })} className={ICON_BUTTON}>
            <ArrowDown className="size-[18px]" aria-hidden />
          </button>
        </div>
      )}
    </SortableRows>
  )
}

function MatchingAnswer({ question, response, onRespond }: Props) {
  const t = useTranslations("courseTests.builder.preview")
  const current = response && typeof response === "object" && !Array.isArray(response) ? response : {}
  const choices = question.displayRight.map((option) => ({ value: option.id, label: option.text }))
  return (
    <div className="flex flex-col gap-3">
      {question.displayOptions.map((option) => (
        <div key={option.id} className="grid items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <span dir="auto" className="text-[15px] font-semibold">
            {option.text}
          </span>
          <ChoiceSelect value={current[option.id] ?? ""} onChange={(value) => onRespond({ ...current, [option.id]: value })} options={choices} placeholder={t("match_placeholder")} ariaLabel={t("match_for", { text: option.text })} />
        </div>
      ))}
    </div>
  )
}

function ShortAnswer({ response, onRespond }: Props) {
  const t = useTranslations("courseTests.builder.preview")
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {t("your_answer")}
      </label>
      <input id={id} dir="auto" value={typeof response === "string" ? response : ""} onChange={(event) => onRespond(event.target.value)} className="h-[52px] rounded-2xl border-2 border-border bg-card px-4 text-base outline-none focus-visible:border-foreground focus-visible:ring-3 focus-visible:ring-ring/40" />
    </div>
  )
}

function EssayAnswer({ question, response, onRespond }: Props) {
  const t = useTranslations("courseTests.builder.preview")
  const id = useId()
  const text = typeof response === "string" ? response : ""
  const limit = key(question).word_limit ?? null
  const words = wordCount(text)
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {t("your_answer")}
      </label>
      <textarea id={id} dir="auto" value={text} onChange={(event) => onRespond(event.target.value)} className="min-h-40 rounded-2xl border-2 border-border bg-card px-4 py-3 text-base leading-[1.8] outline-none focus-visible:border-foreground focus-visible:ring-3 focus-visible:ring-ring/40" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t("essay_note")}</span>
        <span className={cn("tabular-nums", limit !== null && words > limit && "font-semibold text-red-700 dark:text-red-300")}>{limit !== null ? t("words_of", { words, limit }) : t("words", { words })}</span>
      </div>
    </div>
  )
}

export function PreviewAnswer(props: Props) {
  switch (props.question.type) {
    case "single":
    case "multi":
    case "true_false":
      return <ChoiceAnswer {...props} />
    case "ordering":
      return <OrderingAnswer {...props} />
    case "matching":
      return <MatchingAnswer {...props} />
    case "short_answer":
      return <ShortAnswer {...props} />
    case "essay":
      return <EssayAnswer {...props} />
  }
}
