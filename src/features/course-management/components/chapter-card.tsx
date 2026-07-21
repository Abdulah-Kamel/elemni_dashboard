"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Pencil, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { updateChapter, deleteChapter } from "@/features/course-management/chapters-actions";
import { LessonList } from "@/features/course-management/components/lesson-list";
import { ReorderButtons } from "@/features/course-management/components/reorder-buttons";
import type { ChapterOut } from "@/features/course-management/chapters-schema";
import type { LessonOut } from "@/features/course-management/lessons-schema";

export function ChapterCard({
  chapter,
  courseId,
  lessons = [],
  lessonError = null,
  onUpdate,
  onDelete,
  dragHandleProps,
  showReorderControls = true,
  chapters,
  onMoveUp,
  onMoveDown,
  expanded,
  onToggle,
}: {
  chapter: ChapterOut;
  courseId: number;
  lessons?: LessonOut[];
  lessonError?: string | null;
  onUpdate: (chapter: ChapterOut) => void;
  onDelete: (chapterId: number) => void;
  dragHandleProps?: Record<string, unknown>;
  showReorderControls?: boolean;
  chapters?: ChapterOut[];
  onMoveUp?: (chapterId: number) => void;
  onMoveDown?: (chapterId: number) => void;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const isExpanded = expanded ?? false;
  const t = useTranslations("chapters");
  const lt = useTranslations("lessons");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(chapter.title);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await updateChapter(courseId, chapter.id, { title: trimmed });
      if (result.success) {
        onUpdate(result.data);
        setEditOpen(false);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, chapter.id, editTitle, onUpdate]);

  const handleDelete = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await deleteChapter(courseId, chapter.id);
      if (result.success) {
        onDelete(chapter.id);
        setDeleteOpen(false);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, chapter.id, onDelete]);

  return (
    <div className="bg-surface-raised rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-surface-muted/20"
        onClick={() => { onToggle?.(); }}
        role="button"
        tabIndex={0}
        aria-label={t("chapter_title")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle?.();
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {showReorderControls && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              {...(dragHandleProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            >
              <GripVertical className="size-4 text-muted-foreground" />
            </Button>
          )}
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronDown className="size-4 text-muted-foreground rtl:rotate-180" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-medium truncate">
              <span className="text-muted-foreground me-1.5">{chapter.order}.</span>
              {chapter.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {lessons.length > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap me-1">
              {t("lessons_count", { n: lessons.length })}
            </span>
          )}
          {showReorderControls && chapters && onMoveUp && onMoveDown && (
            <ReorderButtons
              chapter={chapter}
              chapters={chapters}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              moveUpLabel={t("move_up")}
              moveDownLabel={t("move_down")}
            />
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setEditTitle(chapter.title);
              setError(null);
              setEditOpen(true);
            }}
            aria-label={t("edit")}
          >
            <Pencil className="size-4 rtl:rotate-180" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setError(null);
              setDeleteOpen(true);
            }}
            aria-label={t("delete")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/50 px-4 py-2">
          <LessonList
            initialLessons={lessons}
            courseId={courseId}
            chapterId={chapter.id}
            error={lessonError}
          />
        </div>
      )}

      <Dialog
        open={editOpen}
        onOpenChange={(val) => {
          setEditOpen(val);
          if (!val) setError(null);
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
                e.preventDefault();
                handleSave();
              }
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={submitting}>{t("cancel")}</Button>} />
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(val) => {
          setDeleteOpen(val);
          if (!val) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>{t("delete_confirm")}</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={submitting}>{t("cancel")}</Button>} />
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? t("saving") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
