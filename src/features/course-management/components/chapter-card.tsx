"use client"

import { useState, useCallback, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Collapsible } from "@base-ui/react/collapsible"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import {
  updateChapter,
  deleteChapter,
} from "@/features/course-management/chapters-actions"
import { LessonList } from "./lesson-list"
import type { ChapterOut } from "@/features/course-management/chapters-schema"
import type { LessonOut } from "@/features/course-management/lessons-schema"
import { useCourseBuilderBridge } from "@/features/course-management/course-builder-bridge"

export function ChapterCard({
  chapter,
  courseId,
  initialLessons,
  lessonsError,
  defaultExpanded = false,
  onUpdate,
  onDelete,
  dragHandleProps,
}: {
  chapter: ChapterOut
  courseId: number
  initialLessons: LessonOut[]
  lessonsError: string | null
  defaultExpanded?: boolean
  onUpdate: (chapter: ChapterOut) => void
  onDelete: (chapterId: number) => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}) {
  const t = useTranslations("chapters")
  const {
    enabled,
    selectedNode,
    hoveredNode,
    setHoveredNode,
    highlightNode,
    clearSelectedNode,
    selectNode,
  } = useCourseBuilderBridge()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [lessonCount, setLessonCount] = useState(initialLessons.length)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(chapter.title)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSelected =
    selectedNode?.type === "chapter" &&
    String(selectedNode.id) === String(chapter.id)
  const isHovered =
    hoveredNode?.type === "chapter" &&
    String(hoveredNode.id) === String(chapter.id)
  const node = { type: "chapter" as const, id: chapter.id }

  useEffect(() => {
    if (!enabled || !selectedNode) return

    const selectedInChapter =
      (selectedNode.type === "chapter" &&
        String(selectedNode.id) === String(chapter.id)) ||
      (selectedNode.chapterId !== undefined &&
        String(selectedNode.chapterId) === String(chapter.id))

    if (!selectedInChapter || expanded) return

    const frame = window.requestAnimationFrame(() => setExpanded(true))
    return () => window.cancelAnimationFrame(frame)
  }, [chapter.id, enabled, expanded, selectedNode])

  const handleSave = useCallback(async () => {
    const trimmed = editTitle.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await updateChapter(courseId, chapter.id, {
        title: trimmed,
      })
      if (result.success) {
        onUpdate(result.data)
        setEditOpen(false)
      } else {
        setError(result.error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }, [courseId, chapter.id, editTitle, onUpdate])

  const handleDelete = useCallback(async () => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await deleteChapter(courseId, chapter.id)
      if (result.success) {
        onDelete(chapter.id)
        setDeleteOpen(false)
      } else {
        setError(result.error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }, [courseId, chapter.id, onDelete])

  return (
    <Collapsible.Root open={expanded} onOpenChange={setExpanded}>
      <section
        data-builder-node-type="chapter"
        data-builder-node-id={chapter.id}
        data-builder-node-state={
          isSelected ? "selected" : isHovered ? "hovered" : "idle"
        }
        tabIndex={enabled ? -1 : undefined}
        onMouseEnter={() => enabled && setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
        onFocus={(event) => {
          // Focus bubbles through nested lesson/item cards. Only treat a
          // direct focus on this chapter as a chapter selection.
          if (event.target === event.currentTarget) highlightNode(node)
        }}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget
          if (
            !(nextTarget instanceof Node) ||
            !event.currentTarget.contains(nextTarget)
          ) {
            clearSelectedNode(node)
          }
        }}
        className={`overflow-hidden rounded-xl border border-border bg-card shadow-xs ${isHovered ? "ring-2 ring-sky-400/70 ring-inset" : ""} ${isSelected ? "ring-2 ring-primary/35 ring-inset" : ""}`}
      >
        <div className="flex min-h-16 items-center gap-2 bg-muted/35 px-3 sm:px-4">
          <button
            type="button"
            className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
            aria-label={t("drag_handle_label")}
            {...(dragHandleProps ?? {})}
          >
            <GripVertical className="size-4" />
          </button>

          <Collapsible.Trigger
            className="flex min-w-0 flex-1 items-center gap-3 text-start"
            onClick={() => selectNode(node)}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-muted-foreground">
                {t("chapter_number", { n: chapter.order })}
              </span>
              <span className="block truncate text-sm font-semibold sm:text-base">
                {chapter.title}
              </span>
            </span>
            <Badge
              variant="secondary"
              className="hidden shrink-0 sm:inline-flex"
            >
              {t("lessons_count", { n: lessonCount })}
            </Badge>
            {expanded ? (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            )}
          </Collapsible.Trigger>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditTitle(chapter.title)
                  setEditOpen(true)
                }}
              >
                <Pencil className="me-2 size-4" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                <Trash2 className="me-2 size-4" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Collapsible.Panel>
          <div className="border-t border-border bg-background/60 p-3 sm:p-4">
            <LessonList
              initialLessons={initialLessons}
              courseId={courseId}
              chapterId={chapter.id}
              error={lessonsError}
              nested
              onCountChange={setLessonCount}
            />
          </div>
        </Collapsible.Panel>
      </section>

      <Dialog
        open={editOpen}
        onOpenChange={(val) => {
          setEditOpen(val)
          if (!val) setError(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("edit")}</DialogTitle>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={submitting}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSave()
              }
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={submitting}>
                  {t("cancel")}
                </Button>
              }
            />
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(val) => {
          setDeleteOpen(val)
          if (!val) setError(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>{t("delete_confirm")}</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={submitting}>
                  {t("cancel")}
                </Button>
              }
            />
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? t("saving") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible.Root>
  )
}
