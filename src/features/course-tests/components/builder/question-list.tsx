"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type Announcements, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { PortalDragOverlay } from "@/components/ui/portal-drag-overlay"
import { stableKey, summarize, validateQuestion, type DraftQuestion } from "./builder-model"
import { useIssueText } from "./issue-text"
import { AddQuestionMenu } from "./add-question-menu"
import { CARD, ERROR_TEXT, INK, WARNING_BOX } from "./styles"
import type { QuestionType } from "../../types"

type RowProps = { question: DraftQuestion; number: number; selected: boolean; onSelect: () => void; overlay?: boolean }

function RowContent({ question, number, selected }: Omit<RowProps, "onSelect">) {
  const t = useTranslations("courseTests.builder")
  const { message } = useIssueText()
  const issues = validateQuestion(question)
  const invalid = issues.length > 0
  return (
    <>
      <span className={cn("w-[22px] shrink-0 text-[13px] font-bold tabular-nums", selected ? "text-primary-deep" : invalid ? ERROR_TEXT : "text-muted-foreground")}>{number}</span>
      <span className={cn("min-w-0 flex-1 truncate text-start text-[13px]", invalid && !selected && ERROR_TEXT, selected && "font-semibold")} dir="auto">
        {invalid ? message(issues[0]) : question.text}
      </span>
      {question.type === "essay" ? <span className={cn("shrink-0 rounded-full px-[7px] py-px text-[11px] font-semibold", WARNING_BOX)}>{t("manual_badge")}</span> : null}
      <span className={cn("shrink-0 text-xs tabular-nums", selected ? "text-primary-deep" : "text-muted-foreground")}>{Number.isFinite(question.points) ? question.points : "–"}</span>
    </>
  )
}

function SortableRow({ question, number, selected, onSelect }: RowProps) {
  const t = useTranslations("courseTests.builder")
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })
  const invalid = validateQuestion(question).length > 0
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex h-12 items-center gap-1 rounded-xl pe-2 text-[13px] transition-[background-color,border-color] duration-150",
        selected ? cn(INK, "bg-muted") : invalid ? "border-[1.5px] border-destructive/50 bg-error-tint/60" : "border border-transparent hover:bg-muted/60",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t("list.drag_handle", { number })}
        className={cn("grid h-11 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing", selected ? "text-primary-deep" : "text-on-surface-subtle")}
      >
        <GripVertical className="size-4" />
      </button>
      <button type="button" onClick={onSelect} aria-current={selected ? "true" : undefined} className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <RowContent question={question} number={number} selected={selected} />
      </button>
    </li>
  )
}

export function QuestionList({
  questions,
  selectedId,
  onSelect,
  onMove,
  onAdd,
  onOpenBank,
  onOpenExcel,
}: {
  questions: DraftQuestion[]
  selectedId: number | null
  onSelect: (id: number) => void
  onMove: (from: number, to: number) => void
  onAdd: (type: QuestionType) => void
  onOpenBank: () => void
  onOpenExcel: () => void
}) {
  const t = useTranslations("courseTests.builder")
  const [listRef, setAnimate] = useAutoAnimate<HTMLOListElement>({ duration: 200 })
  const [activeId, setActiveId] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const summary = summarize(questions)
  const ids = useMemo(() => questions.map((question) => question.id), [questions])
  const numberOf = (id: string | number) => ids.indexOf(Number(id)) + 1

  const announcements: Announcements = {
    onDragStart: ({ active }) => t("list.announce_start", { number: numberOf(active.id) }),
    onDragOver: ({ over }) => (over ? t("list.announce_over", { number: numberOf(over.id) }) : undefined),
    onDragEnd: ({ over }) => (over ? t("list.announce_end", { number: numberOf(over.id) }) : t("list.announce_cancel")),
    onDragCancel: () => t("list.announce_cancel"),
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    window.setTimeout(() => setAnimate(true), 0)
    const { active, over } = event
    if (!over || active.id === over.id) return
    onMove(ids.indexOf(Number(active.id)), ids.indexOf(Number(over.id)))
  }

  const active = activeId === null ? null : questions.find((question) => question.id === activeId)

  return (
    <aside aria-label={t("list.label")} className={cn(CARD, "flex flex-col gap-1.5 p-3.5")}>
      <div className="flex items-center justify-between px-1.5 pt-1 pb-2">
        <h2 className="text-sm font-semibold">{t("list.title")}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{t("list.count", { count: summary.count, points: summary.totalPoints })}</span>
      </div>
      {questions.length === 0 ? <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("list.empty")}</p> : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements, screenReaderInstructions: { draggable: t("list.instructions") } }}
        onDragStart={(event) => {
          setAnimate(false)
          setActiveId(Number(event.active.id))
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null)
          setAnimate(true)
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol ref={listRef} className="flex flex-col gap-1.5">
            {questions.map((question, index) => (
              <SortableRow key={stableKey(question)} question={question} number={index + 1} selected={question.id === selectedId} onSelect={() => onSelect(question.id)} />
            ))}
          </ol>
        </SortableContext>
        <PortalDragOverlay>
          {active ? (
            <div className={cn(INK, "flex h-12 items-center gap-2 rounded-xl bg-card px-3 text-[13px]")}>
              <GripVertical className="size-4 text-primary-deep" />
              <RowContent question={active} number={numberOf(active.id)} selected />
            </div>
          ) : null}
        </PortalDragOverlay>
      </DndContext>
      <AddQuestionMenu onAdd={onAdd} onOpenBank={onOpenBank} onOpenExcel={onOpenExcel} />
    </aside>
  )
}
