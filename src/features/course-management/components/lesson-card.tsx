"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Collapsible } from "@base-ui/react/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { updateLesson, deleteLesson } from "@/features/course-management/lessons-actions";
import { ItemList } from "@/features/course-management/components/item-list";
import type { LessonOut } from "@/features/course-management/lessons-schema";

export function LessonCard({
  lesson,
  courseId,
  itemCount,
  status,
  onUpdate,
  onDelete,
  dragHandleProps,
}: {
  lesson: LessonOut;
  courseId: number;
  itemCount?: number;
  status?: "ready" | "processing" | "failed" | "mixed" | null;
  onUpdate: (lesson: LessonOut) => void;
  onDelete: (lessonId: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const t = useTranslations("lessons");
  const [itemsExpanded, setItemsExpanded] = useState(false);
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

  let statusBadge = null;
  if (status === "ready") {
    statusBadge = (
      <Badge variant="default" className="bg-success/10 text-success border-0 text-[11px] px-2 py-px">
        {t("status_ready")}
      </Badge>
    );
  } else if (status === "processing") {
    statusBadge = (
      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning text-[11px] px-2 py-px">
        <Loader2 className="size-3 me-1 animate-spin" />
        {t("status_processing")}
      </Badge>
    );
  } else if (status === "failed") {
    statusBadge = (
      <Badge variant="destructive" className="text-[11px] px-2 py-px">
        {t("status_failed")}
      </Badge>
    );
  } else if (status === "mixed") {
    statusBadge = (
      <Badge variant="secondary" className="text-[11px] px-2 py-px">
        {t("status_mixed")}
      </Badge>
    );
  }

  return (
    <Collapsible.Root open={itemsExpanded} onOpenChange={setItemsExpanded}>
      <Card className="rounded-lg border border-border ring-0 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            className="cursor-grab active:cursor-grabbing touch-none size-7 flex items-center justify-center shrink-0 rounded-md hover:bg-surface-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Drag to reorder"
            {...(dragHandleProps ?? {})}
          >
            <GripVertical className="size-4 text-muted-foreground" />
          </button>
          <Collapsible.Trigger className="flex items-center gap-2 flex-1 min-w-0 text-start cursor-pointer">
            {itemsExpanded ? (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            )}
            <span className="text-sm font-medium truncate">
              {lesson.order}. {lesson.title}
            </span>
          </Collapsible.Trigger>
          {itemCount != null && (
            <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
              {itemCount} {t("items")}
            </span>
          )}
          {statusBadge}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="size-7 shrink-0" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditTitle(lesson.title);
                  setEditDescription(lesson.description ?? "");
                  setError(null);
                  setEditOpen(true);
                }}
              >
                <Pencil className="size-3.5" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setError(null);
                  setDeleteOpen(true);
                }}
                variant="destructive"
              >
                <Trash2 className="size-3.5" />
                {t("delete")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                {t("move_to_chapter")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Collapsible.Panel>
          <div className="border-t border-border px-3 py-2">
            <ItemList
              courseId={courseId}
              lessonId={lesson.id}
              error={null}
            />
          </div>
        </Collapsible.Panel>
      </Card>

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
    </Collapsible.Root>
  );
}
