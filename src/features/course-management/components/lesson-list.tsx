"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragCancelEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GripVertical, ChevronUp, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { LessonCard } from "./lesson-card";
import { ItemList } from "./item-list";
import { createLesson, reorderLessons, updateLesson, deleteLesson } from "@/features/course-management/lessons-actions";
import { toast } from "sonner";
import type { LessonOut } from "@/features/course-management/lessons-schema";

function SortableLessonCard({
  lesson,
  courseId,
  onUpdate,
  onDelete,
  lessons,
  onMoveUp,
  onMoveDown,
  dragHandleLabel,
  moveUpLabel,
  moveDownLabel,
}: {
  lesson: LessonOut;
  courseId: number;
  onUpdate: (lesson: LessonOut) => void;
  onDelete: (lessonId: number) => void;
  lessons: LessonOut[];
  onMoveUp: (lessonId: number) => void;
  onMoveDown: (lessonId: number) => void;
  dragHandleLabel: string;
  moveUpLabel: string;
  moveDownLabel: string;
}) {
  const lt = useTranslations("lessons");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(lesson.id) });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(false);
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : "auto" as unknown as number,
  };

  const index = lessons.findIndex((l) => l.id === lesson.id);
  const isFirst = index === 0;
  const isLast = index === lessons.length - 1;

  return (
    <div ref={setNodeRef} style={style} className="transition-all duration-300 ease-out">
      <div className="px-4 py-2.5 transition-colors hover:bg-surface-muted/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-6 shrink-0 cursor-grab active:cursor-grabbing"
              {...(attributes as React.ButtonHTMLAttributes<HTMLButtonElement>)}
              {...(listeners as React.ButtonHTMLAttributes<HTMLButtonElement>)}
              aria-label={dragHandleLabel}
            >
              <GripVertical className="size-3.5 text-muted-foreground" />
            </Button>
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
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="size-6"
              disabled={isFirst}
              onClick={() => onMoveUp(lesson.id)}
              aria-label={moveUpLabel}
            >
              <ChevronUp className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-6"
              disabled={isLast}
              onClick={() => onMoveDown(lesson.id)}
              aria-label={moveDownLabel}
            >
              <ChevronDown className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-6"
              onClick={() => {
                setEditTitle(lesson.title);
                setEditDescription(lesson.description ?? "");
                setError(null);
                setEditOpen(true);
              }}
              aria-label={lt("edit")}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-6"
              onClick={() => {
                setError(null);
                setDeleteOpen(true);
              }}
              aria-label={lt("delete")}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-2">
        <button
          onClick={() => setItemsExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {itemsExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          <span>{lt("items")}</span>
        </button>
        {itemsExpanded && (
          <div className="mt-1.5">
            <ItemList
              courseId={courseId}
              lessonId={lesson.id}
              error={null}
            />
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if (!val) setError(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{lt("edit")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{lt("create_title_placeholder")}</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} disabled={submitting} autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); } }} />
            </div>
            <div>
              <label className="text-sm font-medium">{lt("description_label")}</label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} disabled={submitting} rows={3} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={submitting}>{lt("cancel")}</Button>} />
            <Button onClick={handleSave} disabled={submitting}>{submitting ? lt("saving") : lt("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(val) => { setDeleteOpen(val); if (!val) setError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lt("delete")}</DialogTitle>
            <DialogDescription>{lt("delete_confirm")}</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={submitting}>{lt("cancel")}</Button>} />
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? lt("saving") : lt("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LessonList({
  initialLessons,
  courseId,
  chapterId,
  error: initialError,
}: {
  initialLessons: LessonOut[];
  courseId: number;
  chapterId?: number;
  error: string | null;
}) {
  const t = useTranslations("lessons");
  const [lessons, setLessons] = useState(initialLessons);
  const [error, setError] = useState<string | null>(initialError);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const previousLessonsRef = useRef<LessonOut[]>(initialLessons);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const lessonIds = lessons.map((l) => String(l.id));
  const activeLesson = activeId
    ? lessons.find((l) => String(l.id) === activeId) ?? null
    : null;
  const canReorder = lessons.length > 1;

  const announce = useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(String(event.active.id));
      const ls = lessons.find((l) => String(l.id) === event.active.id);
      if (ls) announce(t("reorder_success")); // placeholder
    },
    [lessons, announce, t],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const oldIndex = lessons.findIndex((l) => String(l.id) === active.id);
      const newIndex = lessons.findIndex((l) => String(l.id) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      previousLessonsRef.current = lessons;
      const reordered = arrayMove(lessons, oldIndex, newIndex);
      const items = reordered.map((ls, idx) => ({ id: ls.id, order: idx + 1 }));

      setLessons(reordered);

      const result = await reorderLessons(courseId, items, chapterId);
      if (result.success) {
        toast.success(t("reorder_success"));
      } else {
        setLessons(previousLessonsRef.current);
        if (result.error.type === "Conflict") {
          toast.error(t("reorder_conflict"), {
            action: { label: "Refresh", onClick: () => window.location.reload() },
          });
        } else {
          toast.error(t("reorder_error"));
        }
      }
    },
    [lessons, courseId, chapterId, t],
  );

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveId(null);
  }, []);

  const handleMoveUp = useCallback(
    async (lessonId: number) => {
      const index = lessons.findIndex((l) => l.id === lessonId);
      if (index <= 0) return;

      previousLessonsRef.current = lessons;
      const reordered = arrayMove(lessons, index, index - 1);
      const items = reordered.map((ls, idx) => ({ id: ls.id, order: idx + 1 }));

      setLessons(reordered);

      const result = await reorderLessons(courseId, items, chapterId);
      if (result.success) {
        toast.success(t("reorder_success"));
      } else {
        setLessons(previousLessonsRef.current);
        if (result.error.type === "Conflict") {
          toast.error(t("reorder_conflict"), {
            action: { label: "Refresh", onClick: () => window.location.reload() },
          });
        } else {
          toast.error(t("reorder_error"));
        }
      }
    },
    [lessons, courseId, chapterId, t],
  );

  const handleMoveDown = useCallback(
    async (lessonId: number) => {
      const index = lessons.findIndex((l) => l.id === lessonId);
      if (index === -1 || index >= lessons.length - 1) return;

      previousLessonsRef.current = lessons;
      const reordered = arrayMove(lessons, index, index + 1);
      const items = reordered.map((ls, idx) => ({ id: ls.id, order: idx + 1 }));

      setLessons(reordered);

      const result = await reorderLessons(courseId, items, chapterId);
      if (result.success) {
        toast.success(t("reorder_success"));
      } else {
        setLessons(previousLessonsRef.current);
        if (result.error.type === "Conflict") {
          toast.error(t("reorder_conflict"), {
            action: { label: "Refresh", onClick: () => window.location.reload() },
          });
        } else {
          toast.error(t("reorder_error"));
        }
      }
    },
    [lessons, courseId, chapterId, t],
  );

  const handleCreated = useCallback((lesson: LessonOut) => {
    setLessons((prev) => [...prev, lesson]);
    setCreateOpen(false);
    setCreateTitle("");
    setCreateDescription("");
  }, []);

  const handleUpdated = useCallback((updated: LessonOut) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === updated.id ? updated : l)),
    );
  }, []);

  const handleDeleted = useCallback((lessonId: number) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmed = createTitle.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await createLesson(
        courseId,
        {
          title: trimmed,
          description: createDescription.trim() || null,
        },
        chapterId,
      );
      if (result.success) {
        handleCreated(result.data);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, chapterId, createTitle, createDescription, handleCreated]);

  if (error && lessons.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("error_upstream")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={liveRegionRef} aria-live="polite" className="sr-only" />
      {canReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
            {lessons.map((lesson) => (
              <SortableLessonCard
                key={lesson.id}
                lesson={lesson}
                courseId={courseId}
                onUpdate={handleUpdated}
                onDelete={handleDeleted}
                lessons={lessons}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                dragHandleLabel={t("drag_handle_label")}
                moveUpLabel={t("move_up")}
                moveDownLabel={t("move_down")}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeLesson ? (
              <div className="opacity-90 shadow-lg px-4 py-2.5 bg-surface-raised">
                <h4 className="text-sm font-medium">{activeLesson.title}</h4>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div title={t("single_lesson_tooltip")}>
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              onUpdate={handleUpdated}
              onDelete={handleDeleted}
            />
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
        onClick={() => {
          setCreateTitle("");
          setCreateDescription("");
          setError(null);
          setCreateOpen(true);
        }}
      >
        <Plus className="me-1 size-3.5" />
        {t("create")}
      </Button>

      <Dialog
        open={createOpen}
        onOpenChange={(val) => {
          setCreateOpen(val);
          if (!val) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("create_title_placeholder")}</label>
              <Input
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder={t("create_title_placeholder")}
                disabled={submitting}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("description_label")}</label>
              <Textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder={t("create_desc_placeholder")}
                disabled={submitting}
                rows={3}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={submitting}>{t("cancel")}</Button>} />
            <Button onClick={handleCreate} disabled={submitting || !createTitle.trim()}>
              {submitting ? t("saving") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
