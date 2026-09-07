"use client"

import { useState, useCallback, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Collapsible } from "@base-ui/react/collapsible"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { ItemList } from "@/features/course-management/components/item-list"
import type { LessonOut } from "@/features/course-management/lessons-schema"
import { useCourseBuilderBridge } from "@/features/course-management/course-builder-bridge"
import { useLessonMutations } from "@/features/course-management/hooks/use-course-management-queries"

export function LessonCard({
  lesson,
  courseId,
  itemCount,
  status,
  dragHandleProps,
  nested = false,
}: {
  lesson: LessonOut
  courseId: number
  itemCount?: number
  status?: "ready" | "failed" | "mixed" | null
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  nested?: boolean
}) {
  const t = useTranslations("lessons")
  const {
    enabled,
    selectedNode,
    hoveredNode,
    setHoveredNode,
    highlightNode,
    clearSelectedNode,
    selectNode,
    notifyCurriculumCommitted,
  } = useCourseBuilderBridge()
  const { update, remove } = useLessonMutations(
    courseId,
    lesson.chapter_id ?? undefined,
  )
  const [itemsExpanded, setItemsExpanded] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(lesson.title)
  const [editDescription, setEditDescription] = useState(
    lesson.description ?? ""
  )
  const [error, setError] = useState<string | null>(null)
  const submitting = update.isPending || remove.isPending
  const isSelected =
    selectedNode?.type === "lesson" &&
    String(selectedNode.id) === String(lesson.id)
  const isHovered =
    hoveredNode?.type === "lesson" &&
    String(hoveredNode.id) === String(lesson.id)
  const node = {
    type: "lesson" as const,
    id: lesson.id,
    chapterId: lesson.chapter_id ?? undefined,
  }

  useEffect(() => {
    if (!enabled || !selectedNode) return

    const selectedInLesson =
      (selectedNode.type === "lesson" &&
        String(selectedNode.id) === String(lesson.id)) ||
      (selectedNode.lessonId !== undefined &&
        String(selectedNode.lessonId) === String(lesson.id))

    if (!selectedInLesson || itemsExpanded) return

    const frame = window.requestAnimationFrame(() => setItemsExpanded(true))
    return () => window.cancelAnimationFrame(frame)
  }, [enabled, itemsExpanded, lesson.id, selectedNode])

  const handleSave = useCallback(async () => {
    const trimmed = editTitle.trim()
    if (!trimmed) return

    setError(null)
    try {
      await update.mutateAsync({
        lessonId: lesson.id,
        data: {
          title: trimmed,
          description: editDescription.trim() || null,
        },
      })
      void notifyCurriculumCommitted()
      setEditOpen(false)
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : t("error_upstream"),
      )
    }
  }, [editDescription, editTitle, lesson.id, notifyCurriculumCommitted, t, update])

  const handleDelete = useCallback(async () => {
    setError(null)
    try {
      await remove.mutateAsync(lesson.id)
      void notifyCurriculumCommitted()
      setDeleteOpen(false)
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : t("error_upstream"),
      )
    }
  }, [lesson.id, notifyCurriculumCommitted, remove, t])

  let statusBadge = null
  if (status === "ready") {
    statusBadge = (
      <Badge
        variant="default"
        className="border-0 bg-success/10 px-2 py-px text-[11px] text-success"
      >
        {t("status_ready")}
      </Badge>
    )
  } else if (status === "failed") {
    statusBadge = (
      <Badge variant="destructive" className="px-2 py-px text-[11px]">
        {t("status_failed")}
      </Badge>
    )
  } else if (status === "mixed") {
    statusBadge = (
      <Badge variant="secondary" className="px-2 py-px text-[11px]">
        {t("status_mixed")}
      </Badge>
    )
  }

  return (
    <Collapsible.Root open={itemsExpanded} onOpenChange={setItemsExpanded}>
      <div
        data-builder-node-type="lesson"
        data-builder-node-id={lesson.id}
        data-builder-node-state={
          isSelected ? "selected" : isHovered ? "hovered" : "idle"
        }
        tabIndex={enabled ? -1 : undefined}
        onMouseEnter={() => enabled && setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
        onFocus={(event) => {
          // Focus bubbles through nested item cards; don't replace an item
          // selection when its parent receives the bubbled event.
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
        className={
          nested
            ? `overflow-hidden rounded-lg border border-border/80 bg-card transition-shadow hover:shadow-xs ${isHovered ? "ring-2 ring-sky-400/70 ring-inset" : ""} ${isSelected ? "ring-2 ring-primary/35 ring-inset" : ""}`
            : `overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-sm ${isHovered ? "ring-2 ring-sky-400/70 ring-inset" : ""} ${isSelected ? "ring-2 ring-primary/35 ring-inset" : ""}`
        }
      >
        <div className="flex min-h-14 items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md hover:bg-surface-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
            aria-label={t("drag_handle_label")}
            {...(dragHandleProps ?? {})}
          >
            <GripVertical className="size-4 text-muted-foreground" />
          </button>
          <Collapsible.Trigger
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-start"
            onClick={() => selectNode(node)}
          >
            {itemsExpanded ? (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            )}
            <span className="truncate text-sm font-medium">
              {lesson.order}. {lesson.title}
            </span>
          </Collapsible.Trigger>
          {itemCount != null && (
            <span className="shrink-0 text-[11px] whitespace-nowrap text-muted-foreground">
              {itemCount} {t("items")}
            </span>
          )}
          {statusBadge}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditTitle(lesson.title)
                  setEditDescription(lesson.description ?? "")
                  setError(null)
                  setEditOpen(true)
                }}
              >
                <Pencil className="size-3.5" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setError(null)
                  setDeleteOpen(true)
                }}
                variant="destructive"
              >
                <Trash2 className="size-3.5" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Collapsible.Panel>
          <div className="border-t border-border bg-muted/20 px-2 py-2 sm:px-3">
            <ItemList
              courseId={courseId}
              lessonId={lesson.id}
              chapterId={lesson.chapter_id}
              error={null}
            />
          </div>
        </Collapsible.Panel>
      </div>

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
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {t("create_title_placeholder")}
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={submitting}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSave()
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("description_label")}
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>
          </div>
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
