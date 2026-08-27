"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { LessonCard } from "./lesson-card";
import { createLesson, reorderLessons } from "@/features/course-management/lessons-actions";
import { listItems } from "@/features/course-management/items-actions";
import { toast } from "sonner";
import {
  applyOptimisticReorder,
  buildReorderPayload,
  rollbackReorder,
} from "@/features/course-management/reorder-utils";
import type { LessonOut } from "@/features/course-management/lessons-schema";

function SortableLessonCard({
  lesson,
  courseId,
  onUpdate,
  onDelete,
  itemCount,
  status,
  nested,
}: {
  lesson: LessonOut;
  courseId: number;
  onUpdate: (lesson: LessonOut) => void;
  onDelete: (lessonId: number) => void;
  itemCount?: number;
  status?: "ready" | null;
  nested?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(lesson.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LessonCard
        lesson={lesson}
        courseId={courseId}
        onUpdate={onUpdate}
        onDelete={onDelete}
        itemCount={itemCount}
        status={status}
        nested={nested}
        dragHandleProps={{
          ...(attributes as React.HTMLAttributes<HTMLButtonElement>),
          ...(listeners as React.HTMLAttributes<HTMLButtonElement>),
        }}
      />
    </div>
  );
}

export function LessonList({
  initialLessons,
  courseId,
  chapterId,
  error: initialError,
  nested = false,
  onCountChange,
}: {
  initialLessons: LessonOut[];
  courseId: number;
  chapterId?: number;
  error: string | null;
  nested?: boolean;
  onCountChange?: (count: number) => void;
}) {
  const t = useTranslations("lessons");
  const [lessons, setLessons] = useState(initialLessons);
  const [error, setError] = useState<string | null>(initialError);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [itemsMap, setItemsMap] = useState<
    Record<number, { count: number; status: "ready" | null }>
  >({});
  const previousLessonsRef = useRef(initialLessons);
  const [parentRef] = useAutoAnimate({ duration: 200 });

  useEffect(() => {
    onCountChange?.(lessons.length);
  }, [lessons.length, onCountChange]);

  useEffect(() => {
    async function fetchItems() {
      const results: Record<
        number,
        { count: number; status: "ready" | null }
      > = {};

      await Promise.all(
        initialLessons.map(async (lesson) => {
          const result = await listItems(courseId, lesson.id);
          if (result.success) {
            const items = result.data;
            const allReady = items.length > 0 && items.every(
              (item) =>
                item.bunny_stream_id !== null ||
                item.document_path !== null ||
                item.exam_id !== null,
            );
            const status = allReady ? "ready" as const : null;
            results[lesson.id] = { count: items.length, status };
          }
        }),
      );

      setItemsMap(results);
    }

    fetchItems();
  }, [courseId, initialLessons]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const lessonIds = lessons.map((l) => String(l.id));
  const activeLesson =
    activeId != null
      ? lessons.find((l) => String(l.id) === activeId) ?? null
      : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const oldIndex = lessons.findIndex((l) => String(l.id) === active.id);
      const newIndex = lessons.findIndex((l) => String(l.id) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      previousLessonsRef.current = [...lessons];
      const reordered = applyOptimisticReorder(lessons, oldIndex, newIndex);
      const payload = buildReorderPayload(reordered);

      setLessons(reordered);

      const result = await reorderLessons(courseId, payload, chapterId);
      if (!result.success) {
        setLessons(rollbackReorder(previousLessonsRef.current));
        toast.error(result.error.message);
      }
    },
    [lessons, courseId, chapterId],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleUpdated = useCallback((updated: LessonOut) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === updated.id ? updated : l)),
    );
  }, []);

  const handleDeleted = useCallback((lessonId: number) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  }, []);

  const handleCreated = useCallback((lesson: LessonOut) => {
    setLessons((prev) => [...prev, lesson]);
    setCreateOpen(false);
    setCreateTitle("");
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmed = createTitle.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await createLesson(
        courseId,
        { title: trimmed },
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
  }, [courseId, chapterId, createTitle, handleCreated]);

  if (error && lessons.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div ref={parentRef} className={nested ? "space-y-2" : "space-y-3"}>
      {lessons.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-3">
            {t("empty")}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setCreateTitle("");
              setError(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="me-1 size-3.5" />
            {t("create")}
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={lessonIds}
            strategy={verticalListSortingStrategy}
          >
            {lessons.map((lesson) => (
              <SortableLessonCard
                key={lesson.id}
                lesson={lesson}
                courseId={courseId}
                onUpdate={handleUpdated}
                onDelete={handleDeleted}
                itemCount={itemsMap[lesson.id]?.count}
                status={itemsMap[lesson.id]?.status ?? null}
                nested={nested}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeLesson ? (
              <div className="opacity-90 shadow-lg px-4 py-2.5 bg-surface-raised rounded-lg">
                <span className="text-sm font-medium">
                  {activeLesson.title}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {lessons.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => {
            setCreateTitle("");
            setError(null);
            setCreateOpen(true);
          }}
        >
          <Plus className="me-1 size-3.5" />
          {t("create")}
        </Button>
      )}

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
              <label htmlFor="lesson-title" className="text-sm font-medium">{t("title_label")}</label>
              <Input
                id="lesson-title"
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
            <Button
              onClick={handleCreate}
              disabled={submitting || !createTitle.trim()}
            >
              {submitting ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
