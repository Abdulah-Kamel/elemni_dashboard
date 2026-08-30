"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useTranslations } from "next-intl";
import {
  DndContext,
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
import { Plus, GripVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalDragOverlay } from "@/components/ui/portal-drag-overlay"
import { ItemCard } from "./item-card";
import { UploadDialog, type UploadType } from "./upload-dialog";
import {
  confirmUpload,
  confirmVideoUpload,
  requestUploadUrl,
  requestVideoUpload,
} from "@/features/course-management/items-actions";
import { uploadToPresignedUrl } from "@/lib/upload";
import { uploadVideoToBunnyTus } from "@/lib/tus-upload";
import { applyOptimisticReorder, buildReorderPayload, rollbackReorder } from "@/features/course-management/reorder-utils";
import { toast } from "sonner";
import type { ItemOut } from "@/features/course-management/items-schema";
import { useCourseBuilderBridge } from "@/features/course-management/course-builder-bridge";
import {
  useItemMutations,
  useItemsQuery,
} from "@/features/course-management/hooks/use-course-management-queries";
import { courseManagementKeys } from "@/features/course-management/query-keys";

function SortableItemCard({
  item,
  courseId,
  lessonId,
  chapterId,
  onUpdate,
}: {
  item: ItemOut;
  courseId: number;
  lessonId: number;
  chapterId?: number | null;
  onUpdate: (item: ItemOut) => void;
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
          type="button"
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
  const queryClient = useQueryClient();
  const queryKey = courseManagementKeys.items(courseId, lessonId);
  const itemsQuery = useItemsQuery(
    courseId,
    lessonId,
    _initialItems,
    initialError,
  );
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const { create, update, reorder } = useItemMutations(courseId, lessonId);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createUploadOpen, setCreateUploadOpen] = useState(false);
  const [createUploadType, setCreateUploadType] = useState<UploadType>("video");
  const [createUploading, setCreateUploading] = useState(false);
  const [createUploadProgress, setCreateUploadProgress] = useState(0);
  const createdUploadItemRef = useRef<ItemOut | null>(null);
  const previousRef = useRef(_initialItems ?? []);
  const [parentRef] = useAutoAnimate({ duration: 200 });

  const t = useTranslations("items");
  const { notifyCurriculumCommitted } = useCourseBuilderBridge();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const itemIds = items.map((i) => String(i.id));
  const activeItem = activeId ? items.find((i) => String(i.id) === activeId) ?? null : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
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
      queryClient.setQueryData(queryKey, reordered);

      try {
        await reorder.mutateAsync(payload);
        void notifyCurriculumCommitted();
      } catch (mutationError) {
        queryClient.setQueryData(queryKey, rollbackReorder(previousRef.current));
        toast.error(
          mutationError instanceof Error
            ? mutationError.message
            : t("reorder_error"),
        );
      }
    },
    [items, notifyCurriculumCommitted, queryClient, queryKey, reorder, t],
  );

  const handleUpdated = useCallback((updated: ItemOut) => {
    queryClient.setQueryData<ItemOut[]>(queryKey, (current) =>
      current?.map((item) => (item.id === updated.id ? updated : item)),
    );
    void notifyCurriculumCommitted();
  }, [notifyCurriculumCommitted, queryClient, queryKey]);

  const openCreateUpload = useCallback(() => {
    setError(null);
    createdUploadItemRef.current = null;
    setCreateUploadType("video");
    setCreateUploadOpen(true);
  }, []);

  const handleCreateUpload = useCallback(
    async (file: File, title: string, uploadType: UploadType) => {
      if (createUploading) return;

      setCreateUploading(true);
      setCreateUploadProgress(0);
      setError(null);

      try {
        let item = createdUploadItemRef.current;

        if (!item) {
          item = await create.mutateAsync({ title });
          createdUploadItemRef.current = item;
          void notifyCurriculumCommitted();
        } else if (item.title !== title) {
          item = await update.mutateAsync({ itemId: item.id, data: { title } });
          createdUploadItemRef.current = item;
        }

        if (uploadType === "video") {
          const credentialsResult = await requestVideoUpload(
            courseId,
            lessonId,
            item.id,
            title,
          );
          if (!credentialsResult.success) {
            throw new Error(credentialsResult.error.message || t("upload_error"));
          }

          await uploadVideoToBunnyTus(
            file,
            credentialsResult.data,
            setCreateUploadProgress,
          );
          const confirmResult = await confirmVideoUpload(
            courseId,
            lessonId,
            item.id,
            credentialsResult.data.video_id,
          );
          if (!confirmResult.success) {
            throw new Error(confirmResult.error.message || t("upload_error"));
          }
          item = confirmResult.data;
        } else {
          const urlResult = await requestUploadUrl(
            courseId,
            lessonId,
            item.id,
            file.name,
          );
          if (!urlResult.success) {
            throw new Error(urlResult.error.message || t("upload_error"));
          }
          const uploadResponse = await uploadToPresignedUrl(
            urlResult.data.upload_url,
            file,
          );
          if (!uploadResponse.ok) {
            throw new Error(t("upload_error"));
          }
          const confirmResult = await confirmUpload(
            courseId,
            lessonId,
            item.id,
            urlResult.data.key,
          );
          if (!confirmResult.success) {
            throw new Error(confirmResult.error.message || t("upload_error"));
          }
          item = confirmResult.data;
        }

        queryClient.setQueryData<ItemOut[]>(queryKey, (current) =>
          current?.map((candidate) =>
            candidate.id === item.id ? item : candidate,
          ),
        );
        createdUploadItemRef.current = null;
        setCreateUploadOpen(false);
        void notifyCurriculumCommitted();
        toast.success(
          uploadType === "video"
            ? t("upload_success_processing")
            : t("upload_success"),
        );
      } catch (uploadError) {
        toast.error(
          uploadError instanceof Error ? uploadError.message : t("upload_error"),
        );
      } finally {
        setCreateUploading(false);
        setCreateUploadProgress(0);
      }
    },
    [
      courseId,
      create,
      createUploading,
      lessonId,
      notifyCurriculumCommitted,
      queryClient,
      queryKey,
      t,
      update,
    ],
  );

  const queryError = itemsQuery.isError
    ? itemsQuery.error instanceof Error
      ? itemsQuery.error.message
      : t("fetch_error")
    : initialError && itemsQuery.isPending
      ? initialError
      : null;
  const displayError = error ?? queryError;

  if (itemsQuery.isPending) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (displayError && items.length === 0) {
    return <p className="text-xs text-destructive py-2">{displayError}</p>;
  }

  return (
    <div
      ref={parentRef}
      className={items.length === 0 ? "space-y-4 py-2" : "space-y-1.5"}
    >
      {items.length === 0 ? (
        <>
          <p className="text-center text-xs text-muted-foreground">{t("empty")}</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs text-muted-foreground"
            onClick={openCreateUpload}
          >
            <Plus className="me-1 size-3" />
            {t("create")}
          </Button>
        </>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
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
                />
              ))}
            </SortableContext>
            <PortalDragOverlay>
              {activeItem ? (
                <div className="bg-surface-raised px-4 py-2 opacity-90 shadow-lg">
                  <p className="text-sm font-medium">{activeItem.title}</p>
                </div>
              ) : null}
            </PortalDragOverlay>
          </DndContext>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs text-muted-foreground"
            onClick={openCreateUpload}
          >
            <Plus className="me-1 size-3" />
            {t("create")}
          </Button>
        </>
      )}

      <UploadDialog
        open={createUploadOpen}
        onOpenChange={(nextOpen) => {
          setCreateUploadOpen(nextOpen);
          if (!nextOpen) {
            createdUploadItemRef.current = null;
            setError(null);
          }
        }}
        type={createUploadType}
        itemTitle=""
        uploading={createUploading}
        progress={createUploadProgress}
        onUpload={handleCreateUpload}
      />
    </div>
  );
}
