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
import { Plus, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ChapterCard } from "./chapter-card";
import { createChapter, reorderChapters } from "@/features/course-management/chapters-actions";
import { toast } from "sonner";
import type { ChapterOut } from "@/features/course-management/chapters-schema";
import type { LessonOut } from "@/features/course-management/lessons-schema";

function SortableChapterCard({
  chapter,
  courseId,
  lessons,
  lessonError,
  onUpdate,
  onDelete,
  dragHandleLabel,
  chapters,
  onMoveUp,
  onMoveDown,
  expanded,
  onToggle,
}: {
  chapter: ChapterOut;
  courseId: number;
  lessons: LessonOut[];
  lessonError: string | null;
  onUpdate: (chapter: ChapterOut) => void;
  onDelete: (chapterId: number) => void;
  dragHandleLabel: string;
  chapters: ChapterOut[];
  onMoveUp: (chapterId: number) => void;
  onMoveDown: (chapterId: number) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(chapter.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : "auto" as unknown as number,
  };

  return (
    <div ref={setNodeRef} style={style} className="transition-all duration-300 ease-out">
      <ChapterCard
        chapter={chapter}
        courseId={courseId}
        lessons={lessons}
        lessonError={lessonError}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners, "aria-label": dragHandleLabel }}
        chapters={chapters}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        expanded={expanded}
        onToggle={onToggle}
      />
    </div>
  );
}

export function ChapterList({
  initialChapters,
  courseId,
  lessons = [],
  lessonError = null,
  error: initialError,
}: {
  initialChapters: ChapterOut[];
  courseId: number;
  lessons?: LessonOut[];
  lessonError?: string | null;
  error: string | null;
}) {
  const t = useTranslations("chapters");
  const [chapters, setChapters] = useState(initialChapters);
  const [error, setError] = useState<string | null>(initialError);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const previousChaptersRef = useRef<ChapterOut[]>(initialChapters);
  const lastFailedReorderRef = useRef<{ courseId: number; items: Array<{ id: number; order: number }> } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const chapterIds = chapters.map((ch) => String(ch.id));

  const activeChapter = activeId
    ? chapters.find((ch) => String(ch.id) === activeId) ?? null
    : null;

  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  }, []);

  const toggleExpanded = useCallback((chapterId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(String(event.active.id));
      setExpandedChapters(new Set());
      const ch = chapters.find((c) => String(c.id) === event.active.id);
      if (ch) announce(t("sr_picked_up", { title: ch.title }));
    },
    [chapters, announce, t],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const oldIndex = chapters.findIndex((ch) => String(ch.id) === active.id);
      const newIndex = chapters.findIndex((ch) => String(ch.id) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      previousChaptersRef.current = chapters;
      const reordered = arrayMove(chapters, oldIndex, newIndex);
      const items = reordered.map((ch, idx) => ({ id: ch.id, order: idx + 1 }));

      setChapters(reordered);

      lastFailedReorderRef.current = { courseId, items };
      const activeChapter = chapters.find((c) => String(c.id) === active.id);

      const result = await reorderChapters(courseId, items);
      if (result.success) {
        lastFailedReorderRef.current = null;
        toast.success(t("reorder_success"));
        const newIndex = reordered.findIndex((c) => String(c.id) === active.id);
        if (activeChapter) {
          announce(t("sr_dropped", { title: activeChapter.title, position: newIndex + 1 }));
        }
      } else {
        setChapters(previousChaptersRef.current);
        if (result.error.type === "Conflict") {
          announce(t("sr_failed"));
          toast.error(t("reorder_conflict"), {
            action: { label: t("refresh"), onClick: () => window.location.reload() },
          });
        } else {
          const retryData = lastFailedReorderRef.current;
          announce(t("sr_failed"));
          toast.error(t("reorder_error"), {
            action: retryData ? {
              label: t("retry"),
              onClick: async () => {
                const r = await reorderChapters(retryData.courseId, retryData.items);
                if (r.success) {
                  setChapters(r.data);
                  lastFailedReorderRef.current = null;
                  toast.success(t("reorder_success"));
                }
              },
            } : undefined,
          });
        }
      }
    },
    [chapters, courseId, t, announce],
  );

  const handleDragCancel = useCallback(
    (_event: DragCancelEvent) => {
      setActiveId(null);
      announce(t("sr_cancelled"));
    },
    [announce, t],
  );

  const handleMoveUp = useCallback(
    async (chapterId: number) => {
      const index = chapters.findIndex((ch) => ch.id === chapterId);
      if (index <= 0) return;

      previousChaptersRef.current = chapters;
      const reordered = arrayMove(chapters, index, index - 1);
      const items = reordered.map((ch, idx) => ({ id: ch.id, order: idx + 1 }));

      setChapters(reordered);

      const result = await reorderChapters(courseId, items);
      if (result.success) {
        toast.success(t("reorder_success"));
      } else {
        setChapters(previousChaptersRef.current);
        if (result.error.type === "Conflict") {
          toast.error(t("reorder_conflict"));
        } else {
          toast.error(t("reorder_error"));
        }
      }
    },
    [chapters, courseId, t],
  );

  const handleMoveDown = useCallback(
    async (chapterId: number) => {
      const index = chapters.findIndex((ch) => ch.id === chapterId);
      if (index === -1 || index >= chapters.length - 1) return;

      previousChaptersRef.current = chapters;
      const reordered = arrayMove(chapters, index, index + 1);
      const items = reordered.map((ch, idx) => ({ id: ch.id, order: idx + 1 }));

      setChapters(reordered);

      const result = await reorderChapters(courseId, items);
      if (result.success) {
        toast.success(t("reorder_success"));
      } else {
        setChapters(previousChaptersRef.current);
        if (result.error.type === "Conflict") {
          toast.error(t("reorder_conflict"));
        } else {
          toast.error(t("reorder_error"));
        }
      }
    },
    [chapters, courseId, t],
  );

  const handleCreated = useCallback((chapter: ChapterOut) => {
    setChapters((prev) => [...prev, chapter]);
    setCreateOpen(false);
    setCreateTitle("");
  }, []);

  const handleUpdated = useCallback((updated: ChapterOut) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === updated.id ? updated : ch)),
    );
  }, []);

  const handleDeleted = useCallback((chapterId: number) => {
    setChapters((prev) => prev.filter((ch) => ch.id !== chapterId));
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmed = createTitle.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await createChapter(courseId, { title: trimmed });
      if (result.success) {
        handleCreated(result.data);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, createTitle, handleCreated]);

  if (error && chapters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("error_upstream")}
        </Button>
      </div>
    );
  }

  const canReorder = chapters.length > 1;

  return (
    <div className="space-y-3">
      <div aria-live="polite" className="sr-only" />
      {canReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
            {chapters.map((chapter) => (
              <SortableChapterCard
                key={chapter.id}
                chapter={chapter}
                courseId={courseId}
                lessons={lessons.filter((l) => l.chapter_id === chapter.id)}
                lessonError={lessonError}
                onUpdate={handleUpdated}
                onDelete={handleDeleted}
                dragHandleLabel={t("drag_handle_label")}
                chapters={chapters}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                expanded={expandedChapters.has(chapter.id)}
                onToggle={() => toggleExpanded(chapter.id)}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeChapter ? (
              <div className="opacity-90 shadow-lg rounded-lg border bg-card">
                <ChapterCard
                  chapter={activeChapter}
                  courseId={courseId}
                  lessons={lessons.filter((l) => l.chapter_id === activeChapter.id)}
                  lessonError={lessonError}
                  onUpdate={handleUpdated}
                  onDelete={handleDeleted}
                  showReorderControls={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        chapters.map((chapter) => (
          <div key={chapter.id} className="relative" title={t("single_chapter_tooltip")}>
            <ChapterCard
              chapter={chapter}
              courseId={courseId}
              lessons={lessons.filter((l) => l.chapter_id === chapter.id)}
              lessonError={lessonError}
              onUpdate={handleUpdated}
              onDelete={handleDeleted}
              showReorderControls={false}
              expanded={expandedChapters.has(chapter.id)}
              onToggle={() => toggleExpanded(chapter.id)}
            />
          </div>
        ))
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setCreateTitle("");
          setError(null);
          setCreateOpen(true);
        }}
      >
        <Plus className="me-2 size-4" />
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
          <Input
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder={t("create_placeholder")}
            disabled={submitting}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
          />
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
