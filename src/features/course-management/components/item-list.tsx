"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ItemCard } from "./item-card";
import { createItem, getItems, reorderItems } from "@/features/course-management/items-actions";
import { toast } from "sonner";
import type { ItemOut } from "@/features/course-management/items-schema";

function SortableItemCard({
  item,
  courseId,
  lessonId,
  onUpdate,
  onDelete,
  index,
  total,
  onMoveUp,
  onMoveDown,
  moveUpLabel,
  moveDownLabel,
}: {
  item: ItemOut;
  courseId: number;
  lessonId: number;
  onUpdate: (item: ItemOut) => void;
  onDelete: (itemId: number) => void;
  index: number;
  total: number;
  onMoveUp: (itemId: number) => void;
  onMoveDown: (itemId: number) => void;
  moveUpLabel: string;
  moveDownLabel: string;
}) {
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
    <div ref={setNodeRef} style={style} className="transition-all duration-300 ease-out">
      <div className="flex items-center gap-1 px-2">
        <button
          className="cursor-grab active:cursor-grabbing px-0.5 touch-none"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-3.5 text-on-surface-subtle" />
        </button>
        <div className="flex flex-col gap-0.5">
          <button
            disabled={index === 0}
            onClick={() => onMoveUp(item.id)}
            aria-label={moveUpLabel}
            className="size-4 flex items-center justify-center rounded hover:bg-surface-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="size-3" />
          </button>
          <button
            disabled={index === total - 1}
            onClick={() => onMoveDown(item.id)}
            aria-label={moveDownLabel}
            className="size-4 flex items-center justify-center rounded hover:bg-surface-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="size-3" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <ItemCard
            item={item}
            courseId={courseId}
            lessonId={lessonId}
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
  error: initialError,
}: {
  initialItems?: ItemOut[];
  courseId: number;
  lessonId: number;
  error: string | null;
}) {
  const [items, setItems] = useState<ItemOut[]>(_initialItems ?? []);
  const previousRef = useRef(items);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!_initialItems) {
      getItems(courseId, lessonId).then(setItems).catch(() => {});
    }
  }, [courseId, lessonId, _initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const t = useTranslations("items");
  const [error, setError] = useState<string | null>(initialError);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const itemIds = items.map((i) => String(i.id));

  const activeItem = activeId ? items.find((i) => String(i.id) === activeId) ?? null : null;
  const canReorder = items.length > 1;

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

      const reordered = arrayMove(items, oldIndex, newIndex);
      const payload = reordered.map((i, idx) => ({ id: i.id, order: idx + 1 }));
      previousRef.current = items;
      setItems(reordered);

      const result = await reorderItems(courseId, lessonId, payload);
      if (!result.success) {
        setItems(previousRef.current);
        toast.error(t("reorder_error"));
      }
    },
    [items, courseId, lessonId, t],
  );

  const handleMoveUp = useCallback(
    async (itemId: number) => {
      const index = items.findIndex((i) => i.id === itemId);
      if (index <= 0) return;
      const reordered = arrayMove(items, index, index - 1);
      const payload = reordered.map((i, idx) => ({ id: i.id, order: idx + 1 }));
      previousRef.current = items;
      setItems(reordered);
      const result = await reorderItems(courseId, lessonId, payload);
      if (!result.success) {
        setItems(previousRef.current);
        toast.error(t("reorder_error"));
      }
    },
    [items, courseId, lessonId, t],
  );

  const handleMoveDown = useCallback(
    async (itemId: number) => {
      const index = items.findIndex((i) => i.id === itemId);
      if (index === -1 || index >= items.length - 1) return;
      const reordered = arrayMove(items, index, index + 1);
      const payload = reordered.map((i, idx) => ({ id: i.id, order: idx + 1 }));
      previousRef.current = items;
      setItems(reordered);
      const result = await reorderItems(courseId, lessonId, payload);
      if (!result.success) {
        setItems(previousRef.current);
        toast.error(t("reorder_error"));
      }
    },
    [items, courseId, lessonId, t],
  );

  const handleCreated = useCallback((item: ItemOut) => {
    setItems((prev) => [...prev, item]);
    setCreateOpen(false);
    setCreateTitle("");
  }, []);

  const handleUpdated = useCallback((updated: ItemOut) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const handleDeleted = useCallback((itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

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

  if (error && items.length === 0) {
    return <p className="text-xs text-destructive py-2">{error}</p>;
  }

  return (
    <div className="space-y-1.5">
      <div aria-live="polite" className="sr-only" />
      {canReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <SortableItemCard
                key={item.id}
                item={item}
                courseId={courseId}
                lessonId={lessonId}
                onUpdate={handleUpdated}
                onDelete={handleDeleted}
                index={idx}
                total={items.length}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                moveUpLabel={t("move_up")}
                moveDownLabel={t("move_down")}
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
      ) : (
        <div title={t("single_item_tooltip")}>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              courseId={courseId}
              lessonId={lessonId}
              onUpdate={handleUpdated}
              onDelete={handleDeleted}
            />
          ))}
        </div>
      )}

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
          <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder={t("create_placeholder")}
            disabled={submitting} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }} />
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
