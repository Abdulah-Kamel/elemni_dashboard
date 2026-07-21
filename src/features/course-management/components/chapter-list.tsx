"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChapterCard } from "./chapter-card";
import { listChapters } from "@/features/course-management/chapters-queries";
import { listLessons } from "@/features/course-management/lessons-queries";
import { createChapter } from "@/features/course-management/chapters-actions";
import { toast } from "sonner";
import type { ChapterOut } from "@/features/course-management/chapters-schema";

function SortableLessonCard({
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
    zIndex: isDragging ? 1 : ("auto" as unknown as number),
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ChapterCard
        chapter={chapter}
        courseId={courseId}
        lessonCount={lessonCount}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}

export function ChapterList({
  initialChapters,
  courseId,
  error: initialError,
}: {
  initialChapters: ChapterOut[];
  courseId: number;
  error: string | null;
}) {
  const t = useTranslations("chapters");
  const [chapters, setChapters] = useState<ChapterOut[]>(initialChapters);
  const [error, setError] = useState<string | null>(initialError);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lessonCounts, setLessonCounts] = useState<Map<number, number>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const chapterIds = chapters.map((ch) => String(ch.id));

  const activeChapter = activeId
    ? chapters.find((ch) => String(ch.id) === activeId) ?? null
    : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listChapters(courseId),
      listLessons(courseId),
    ])
      .then(([chaptersData, lessonsData]) => {
        if (cancelled) return;
        setChapters(chaptersData);
        setError(null);
        const counts = new Map<number, number>();
        for (const lesson of lessonsData) {
          if (lesson.chapter_id != null) {
            counts.set(lesson.chapter_id, (counts.get(lesson.chapter_id) ?? 0) + 1);
          }
        }
        setLessonCounts(counts);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load chapters";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [courseId]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const oldIndex = chapters.findIndex((ch) => String(ch.id) === active.id);
      const newIndex = chapters.findIndex((ch) => String(ch.id) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      setChapters(arrayMove(chapters, oldIndex, newIndex));
    },
    [chapters],
  );

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveId(null);
  }, []);

  const handleUpdated = useCallback((updated: ChapterOut) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === updated.id ? updated : ch)),
    );
  }, []);

  const handleDeleted = useCallback((chapterId: number) => {
    setChapters((prev) => prev.filter((ch) => ch.id !== chapterId));
  }, []);

  const handleCreated = useCallback((chapter: ChapterOut) => {
    setChapters((prev) => [...prev, chapter]);
    setCreateOpen(false);
    setCreateTitle("");
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
        toast.success(t("created"));
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, createTitle, handleCreated, t]);

  if (loading && chapters.length === 0) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

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

  return (
    <div className="space-y-3">
      {chapters.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          {t("no_chapters")}
        </p>
      ) : chapters.length === 1 ? (
        chapters.map((chapter) => (
          <SortableLessonCard
            key={chapter.id}
            chapter={chapter}
            courseId={courseId}
            lessonCount={lessonCounts.get(chapter.id)}
            onUpdate={handleUpdated}
            onDelete={handleDeleted}
          />
        ))
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
            {chapters.map((chapter) => (
              <SortableLessonCard
                key={chapter.id}
                chapter={chapter}
                courseId={courseId}
                lessonCount={lessonCounts.get(chapter.id)}
                onUpdate={handleUpdated}
                onDelete={handleDeleted}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeChapter ? (
              <div className="opacity-90 shadow-lg rounded-lg border bg-card">
                <ChapterCard
                  chapter={activeChapter}
                  courseId={courseId}
                  lessonCount={lessonCounts.get(activeChapter.id)}
                  onUpdate={handleUpdated}
                  onDelete={handleDeleted}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Button
        variant="ghost"
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
              {submitting ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("create")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
