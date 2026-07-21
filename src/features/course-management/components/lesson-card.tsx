"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { updateLesson, deleteLesson } from "@/features/course-management/lessons-actions";
import { ItemList } from "@/features/course-management/components/item-list";
import type { LessonOut } from "@/features/course-management/lessons-schema";
import type { ItemOut } from "@/features/course-management/items-schema";

export function LessonCard({
  lesson,
  courseId,
  onUpdate,
  onDelete,
  initialItems,
}: {
  lesson: LessonOut;
  courseId: number;
  onUpdate: (lesson: LessonOut) => void;
  onDelete: (lessonId: number) => void;
  initialItems?: ItemOut[];
}) {
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const t = useTranslations("lessons");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(lesson.title);
  const [editDescription, setEditDescription] = useState(lesson.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await updateLesson(courseId, lesson.id, {
        title: trimmed,
        description: editDescription.trim() || null,
      });
      if (result.success) {
        onUpdate(result.data);
        setEditOpen(false);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, lesson.id, editTitle, editDescription, onUpdate]);

  const handleDelete = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await deleteLesson(courseId, lesson.id);
      if (result.success) {
        onDelete(lesson.id);
        setDeleteOpen(false);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, lesson.id, onDelete]);

  return (
    <div className="px-4 py-2.5 transition-colors hover:bg-surface-muted/30">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium">
            <span className="text-muted-foreground me-1">{lesson.order}.</span>
            {lesson.title}
          </h4>
          {lesson.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {lesson.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => {
              setEditTitle(lesson.title);
              setEditDescription(lesson.description ?? "");
              setError(null);
              setEditOpen(true);
            }}
            aria-label={t("edit")}
          >
            <Pencil className="size-3.5 rtl:rotate-180" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => {
              setError(null);
              setDeleteOpen(true);
            }}
            aria-label={t("delete")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-1.5">
        <button
          onClick={() => setItemsExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {itemsExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          <span>{t("items")}</span>
        </button>
        {itemsExpanded && (
          <div className="mt-1.5">
            <ItemList
              initialItems={initialItems}
              courseId={courseId}
              lessonId={lesson.id}
              error={null}
            />
          </div>
        )}
      </div>

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
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("create_title_placeholder")}</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={submitting}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("description_label")}</label>
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
