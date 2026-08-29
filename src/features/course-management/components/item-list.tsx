"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
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
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "./item-card";
import { listItems, createItem, reorderItems } from "@/features/course-management/items-actions";
import { applyOptimisticReorder, buildReorderPayload, rollbackReorder } from "@/features/course-management/reorder-utils";
import { toast } from "sonner";
import type { ItemOut } from "@/features/course-management/items-schema";
import { useCourseBuilderBridge } from "@/features/course-management/course-builder-bridge";

function SortableItemCard({
  item,
  courseId,
  lessonId,
  chapterId,
  onUpdate,
  onDelete,
}: {
  item: ItemOut;
  courseId: number;
  lessonId: number;
  chapterId?: number | null;
  onUpdate: (item: ItemOut) => void;
  onDelete: (itemId: number) => void;
}) {
  const t = useTranslations("items");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 px-2">
        <button
          className="cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...attributes}
          {...listeners}
          aria-label={t("drag_handle_label")}
        >
          <GripVertical className="size-3.5 text-on-surface-subtle" />
        </button>
        <div className="flex-1 min-w-0">
          <ItemCard
            item={item}
            courseId={courseId}
            lessonId={lessonId}
            chapterId={chapterId}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}

export function ItemList({
  initialItems: _initialItems,
  courseId,
  lessonId,
  chapterId,
  error: initialError,
}: {
  initialItems?: ItemOut[];
  courseId: number;
  lessonId: number;
  chapterId?: number | null;
  error: string | null;
}) {
  const [items, setItems] = useState<ItemOut[]>(_initialItems ?? []);
  const [loading, setLoading] = useState(!_initialItems);
  const [error, setError] = useState<string | null>(initialError);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const previousRef = useRef(items);
  const [parentRef] = useAutoAnimate({ duration: 200 });

  const t = useTranslations("items");
  const { notifyCurriculumCommitted } = useCourseBuilderBridge();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const itemIds = items.map((i) => String(i.id));
  const activeItem = activeId ? items.find((i) => String(i.id) === activeId) ?? null : null;

  useEffect(() => {
    if (_initialItems) {
      return;
    }
    listItems(courseId, lessonId)
      .then((result) => {
        if (result.success) {
          setItems(result.data);
        } else {
          setError(result.error.message);
        }
      })
      .catch(() => {
        setError(t("fetch_error"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId, lessonId, _initialItems, t]);

  const hasProcessingVideo = items.some(
    (item) =>
      item.bunny_stream_id !== null &&
      item.bunny_stream_status !== "ready" &&
      item.bunny_stream_status !== "failed",
  );

  useEffect(() => {
    if (!hasProcessingVideo) return;

    const interval = window.setInterval(() => {
      void listItems(courseId, lessonId).then((result) => {
        if (result.success) setItems(result.data);
      });
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [courseId, lessonId, hasProcessingVideo]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => String(i.id) === active.id);
      const newIndex = items.findIndex((i) => String(i.id) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      previousRef.current = items;
      const reordered = applyOptimisticReorder(items, oldIndex, newIndex);
      const payload = buildReorderPayload(reordered);
      setItems(reordered);

      const result = await reorderItems(courseId, lessonId, payload);
      if (!result.success) {
        setItems(rollbackReorder(previousRef.current));
        toast.error(t("reorder_error"));
      } else {
        void notifyCurriculumCommitted();
      }
    },
    [items, courseId, lessonId, notifyCurriculumCommitted, t],
  );

  const handleUpdated = useCallback((updated: ItemOut) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    void notifyCurriculumCommitted();
  }, [notifyCurriculumCommitted]);

  const handleDeleted = useCallback((itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    void notifyCurriculumCommitted();
  }, [notifyCurriculumCommitted]);

  const handleCreated = useCallback((item: ItemOut) => {
    setItems((prev) => [...prev, item]);
    setCreateOpen(false);
    setCreateTitle("");
    void notifyCurriculumCommitted();
  }, [notifyCurriculumCommitted]);

  const handleCreate = useCallback(async () => {
    const trimmed = createTitle.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createItem(courseId, lessonId, { title: trimmed });
      if (result.success) {
        handleCreated(result.data);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, lessonId, createTitle, handleCreated]);

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error && items.length === 0) {
    return <p className="text-xs text-destructive py-2">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4 py-2">
        <p className="text-xs text-muted-foreground text-center">{t("empty")}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground h-7"
          onClick={() => { setCreateTitle(""); setError(null); setCreateOpen(true); }}
        >
          <Plus className="me-1 size-3" />
          {t("create")}
        </Button>
        <Dialog open={createOpen} onOpenChange={(val) => { setCreateOpen(val); if (!val) setError(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("create")}</DialogTitle></DialogHeader>
            <Input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder={t("create_placeholder")}
              aria-label={t("create_placeholder")}
              disabled={submitting}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
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

  return (
    <div ref={parentRef} className="space-y-1.5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItemCard
              key={item.id}
              item={item}
              courseId={courseId}
              lessonId={lessonId}
              chapterId={chapterId}
              onUpdate={handleUpdated}
              onDelete={handleDeleted}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeItem ? (
            <div className="opacity-90 shadow-lg px-4 py-2 bg-surface-raised">
              <p className="text-sm font-medium">{activeItem.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground h-7"
        onClick={() => { setCreateTitle(""); setError(null); setCreateOpen(true); }}
      >
        <Plus className="me-1 size-3" />
        {t("create")}
      </Button>

      <Dialog open={createOpen} onOpenChange={(val) => { setCreateOpen(val); if (!val) setError(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("create")}</DialogTitle></DialogHeader>
          <Input
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder={t("create_placeholder")}
            aria-label={t("create_placeholder")}
            disabled={submitting}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
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
