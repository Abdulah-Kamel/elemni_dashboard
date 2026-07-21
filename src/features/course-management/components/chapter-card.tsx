"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { GripVertical, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { updateChapter, deleteChapter } from "@/features/course-management/chapters-actions";
import type { ChapterOut } from "@/features/course-management/chapters-schema";

export function ChapterCard({
  chapter,
  courseId,
  lessonCount,
  onUpdate,
  onDelete,
}: {
  chapter: ChapterOut;
  courseId: number;
  lessonCount?: number;
  onUpdate: (chapter: ChapterOut) => void;
  onDelete: (chapterId: number) => void;
}) {
  const router = useRouter();
  const t = useTranslations("chapters");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(chapter.title);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(chapter.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : ("auto" as unknown as number),
  };

  const handleClick = useCallback(() => {
    router.push(`/courses/${courseId}/chapters/${chapter.id}`);
  }, [router, courseId, chapter.id]);

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
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg bg-surface-raised px-4 py-3 transition-all duration-300 ease-out"
    >
      <Button
        size="icon"
        variant="ghost"
        className="size-7 shrink-0 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label={t("drag_handle_label")}
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </Button>

      <button
        type="button"
        className="flex flex-1 items-center gap-2 min-w-0 text-start"
        onClick={handleClick}
      >
        <span className="text-muted-foreground">{chapter.order}.</span>
        <span className="truncate text-base font-medium">{chapter.title}</span>
      </button>

      {lessonCount !== undefined && (
        <Badge variant="secondary" className="shrink-0">
          {t("lessons_count", { n: lessonCount })}
        </Badge>
      )}

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
              setEditTitle(chapter.title);
              setEditOpen(true);
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
