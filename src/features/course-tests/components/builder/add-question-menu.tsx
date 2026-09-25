"use client"

import { useTranslations } from "next-intl"
import { ArrowUpDown, Check, CircleDot, Database, Link2, ListChecks, PenLine, Plus, Type, Upload, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { QUESTION_TYPES } from "./builder-model"
import { CARD } from "./styles"
import type { QuestionType } from "../../types"

export const TYPE_ICONS: Record<QuestionType, LucideIcon> = {
  single: CircleDot,
  multi: ListChecks,
  true_false: Check,
  short_answer: Type,
  essay: PenLine,
  ordering: ArrowUpDown,
  matching: Link2,
}

type AddProps = { onAdd: (type: QuestionType) => void; onOpenBank: () => void; onOpenExcel: () => void }

/** "إضافة سؤال" under the list: every type + bank + Excel in one menu. */
export function AddQuestionMenu({ onAdd, onOpenBank, onOpenExcel }: AddProps) {
  const t = useTranslations("courseTests.builder")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="mt-1.5 flex h-11 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-on-surface-subtle bg-card text-sm font-semibold text-primary-deep outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Plus className="size-[18px]" aria-hidden />
        {t("add.button")}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        {QUESTION_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type]
          return (
            <DropdownMenuItem key={type} onClick={() => onAdd(type)} className="min-h-10 gap-2.5">
              <Icon className="text-primary-deep" aria-hidden />
              {t(`types.${type}`)}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenBank} className="min-h-10 gap-2.5">
          <Database className="text-primary-deep" aria-hidden />
          {t("add.from_bank")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenExcel} className="min-h-10 gap-2.5">
          <Upload aria-hidden />
          {t("add.from_excel")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The side "أضف سؤالاً" panel from the design. */
export function AddQuestionPanel({ onAdd, onOpenBank, onOpenExcel }: AddProps) {
  const t = useTranslations("courseTests.builder")
  return (
    <section aria-labelledby="add-question-heading" className={cn(CARD, "flex flex-col gap-3 p-[18px]")}>
      <h2 id="add-question-heading" className="text-sm font-semibold">
        {t("add.title")}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {QUESTION_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type]
          return (
            <button
              key={type}
              type="button"
              onClick={() => onAdd(type)}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-1 text-xs font-medium outline-none transition-[transform,box-shadow,border-color] duration-150 hover:border-foreground/40 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:hover:-translate-y-px",
                type === "matching" && QUESTION_TYPES.length % 2 === 1 && "col-span-2",
              )}
            >
              <Icon className="size-[18px] text-primary-deep" aria-hidden />
              {t(`types_short.${type}`)}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onOpenBank}
        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-muted text-[13px] font-semibold text-primary-deep outline-none hover:bg-primary-tint focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Database className="size-[18px]" aria-hidden />
        {t("add.from_bank")}
      </button>
      <button
        type="button"
        onClick={onOpenExcel}
        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-[13px] font-semibold text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Upload className="size-[18px]" aria-hidden />
        {t("add.from_excel")}
      </button>
    </section>
  )
}
