"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useTranslations } from "next-intl";
import {
  DndContext,
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
import { BookOpen, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PortalDragOverlay } from "@/components/ui/portal-drag-overlay"
import { ChapterCard } from "./chapter-card";
import { applyOptimisticReorder, buildReorderPayload, rollbackReorder } from "@/features/course-management/reorder-utils";
import { toast } from "sonner";
import type { ChapterOut } from "@/features/course-management/chapters-schema";
import type { LessonOut } from "@/features/course-management/lessons-schema";
import { useCourseBuilderBridge } from "@/features/course-management/course-builder-bridge";
import {
  useChapterMutations,
  useChaptersQuery,
} from "@/features/course-management/hooks/use-course-management-queries";
import { courseManagementKeys } from "@/features/course-management/query-keys";

const EMPTY_CHAPTERS: ChapterOut[] = [];

function SortableChapterCard({
  chapter,
  courseId,
  initialLessons,
  lessonsError,
  defaultExpanded,
}: {
  chapter: ChapterOut;
  courseId: number;
  initialLessons: LessonOut[];
  lessonsError: string | null;
  defaultExpanded?: boolean;
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
        initialLessons={initialLessons}
        lessonsError={lessonsError}
        defaultExpanded={defaultExpanded}
        dragHandleProps={{
          ...(attributes as React.HTMLAttributes<HTMLButtonElement>),
          ...(listeners as React.HTMLAttributes<HTMLButtonElement>),
        }}
      />
    </div>
  );
}

export function ChapterList({
  initialChapters,
  initialLessonsByChapter = {},
  lessonErrorsByChapter = {},
  courseId,
  error: initialError,
}: {
  initialChapters: ChapterOut[];
  initialLessonsByChapter?: Record<number, LessonOut[]>;
  lessonErrorsByChapter?: Record<number, string | null>;
  courseId: number;
  error: string | null;
}) {
  const t = useTranslations("chapters");
  const { notifyCurriculumCommitted } = useCourseBuilderBridge();
  const queryClient = useQueryClient();
  const queryKey = courseManagementKeys.chapters(courseId);
  const chaptersQuery = useChaptersQuery(courseId, initialChapters, initialError);
  const { refetch: refetchChapters } = chaptersQuery;
  const chapters = chaptersQuery.data ?? EMPTY_CHAPTERS;
  const { create, reorder } = useChapterMutations(courseId);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const previousChaptersRef = useRef<ChapterOut[]>(initialChapters);
  const [parentRef] = useAutoAnimate({ duration: 200 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const chapterIds = chapters.map((ch) => String(ch.id));

  const activeChapter = activeId
    ? chapters.find((ch) => String(ch.id) === activeId) ?? null
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const oldIndex = chapters.findIndex((ch) => String(ch.id) === active.id);
      const newIndex = chapters.findIndex((ch) => String(ch.id) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      previousChaptersRef.current = chapters;
      const reordered = applyOptimisticReorder(chapters, oldIndex, newIndex);
      const payload = buildReorderPayload(reordered);
      queryClient.setQueryData(queryKey, reordered);

      try {
        const nextChapters = await reorder.mutateAsync(payload);
        queryClient.setQueryData(queryKey, nextChapters);
        toast.success(t("reorder_success"));
        void notifyCurriculumCommitted();
      } catch (mutationError) {
        queryClient.setQueryData(queryKey, rollbackReorder(previousChaptersRef.current));
        const errorType =
          mutationError && typeof mutationError === "object" && "type" in mutationError
            ? (mutationError as { type?: string }).type
            : undefined;
        if (errorType === "Conflict") {
          toast.error(t("reorder_conflict"), {
            action: {
              label: "Refresh",
              onClick: () => void refetchChapters(),
            },
          });
        } else {
          toast.error(t("reorder_error"));
        }
      }
    },
    [chapters, notifyCurriculumCommitted, queryClient, queryKey, refetchChapters, reorder, t],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleCreated = useCallback(() => {
    setCreateOpen(false);
    setCreateTitle("");
    void notifyCurriculumCommitted();
  }, [notifyCurriculumCommitted]);

  const handleCreate = useCallback(async () => {
    const trimmed = createTitle.trim();
    if (!trimmed) return;

    setError(null);
    try {
      await create.mutateAsync({ title: trimmed });
      handleCreated();
      toast.success(t("chapter_created"));
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : t("error_upstream"),
      );
    }
  }, [create, createTitle, handleCreated, t]);

  const submitting = create.isPending || reorder.isPending;
  const queryError = chaptersQuery.isError
    ? chaptersQuery.error instanceof Error
      ? chaptersQuery.error.message
      : t("error_upstream")
    : initialError && chaptersQuery.isPending
      ? initialError
      : null;
  const displayError = error ?? queryError;

  if (displayError && chapters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-destructive mb-4">{displayError}</p>
        <Button variant="outline" onClick={() => void refetchChapters()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="space-y-3">
      {chapters.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          {t("empty")}
        </p>
      ) : chapters.length === 1 ? (
        chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            courseId={courseId}
            initialLessons={initialLessonsByChapter[chapter.id] ?? []}
            lessonsError={lessonErrorsByChapter[chapter.id] ?? null}
            defaultExpanded
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
              <SortableChapterCard
                key={chapter.id}
                chapter={chapter}
                courseId={courseId}
                initialLessons={initialLessonsByChapter[chapter.id] ?? []}
                lessonsError={lessonErrorsByChapter[chapter.id] ?? null}
                defaultExpanded={chapter.id === chapters[0]?.id}
              />
            ))}
          </SortableContext>

          <PortalDragOverlay>
            {activeChapter ? (
              <div className="flex min-h-16 items-center gap-3 rounded-xl border bg-card px-4 opacity-95 shadow-lg">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("chapter_number", { n: activeChapter.order })}
                  </p>
                  <p className="font-semibold">{activeChapter.title}</p>
                </div>
              </div>
            ) : null}
          </PortalDragOverlay>
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
        <Plus className="me-2 size-4" aria-hidden="true" />
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
            aria-label={t("chapter_title")}
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
            <Button onClick={handleCreate} disabled={submitting || !createTitle.trim()} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              {submitting ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
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
