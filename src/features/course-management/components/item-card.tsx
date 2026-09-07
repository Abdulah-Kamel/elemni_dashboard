"use client"

import { useState, useCallback, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Film,
  FileText,
  ClipboardList,
  File,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  confirmUpload,
  confirmVideoUpload,
  deleteItemDocument,
  deleteItemVideo,
  requestUploadUrl,
  requestVideoUpload,
} from "@/features/course-management/items-actions"
import { uploadToPresignedUrl } from "@/lib/upload"
import { uploadVideoToBunnyTus } from "@/lib/tus-upload"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { UploadDialog } from "./upload-dialog"
import type { ItemOut } from "@/features/course-management/items-schema"
import { useCourseBuilderBridge } from "@/features/course-management/course-builder-bridge"
import { useItemMutations } from "@/features/course-management/hooks/use-course-management-queries"

function itemType(item: ItemOut): {
  label: string
  icon: React.ReactNode
  bg: string
} {
  if (item.bunny_stream_id)
    return {
      label: "type_video",
      icon: <Film className="size-3.5 text-white" />,
      bg: "bg-brand-indigo",
    }
  if (item.document_path)
    return {
      label: "type_document",
      icon: <FileText className="size-3.5 text-white" />,
      bg: "bg-brand-amber",
    }
  if (item.exam_id)
    return {
      label: "type_exam",
      icon: <ClipboardList className="size-3.5 text-white" />,
      bg: "bg-brand-rose",
    }
  return {
    label: "type_text",
    icon: <File className="size-3.5 text-white" />,
    bg: "bg-surface-strong",
  }
}

function itemStatus(item: ItemOut): {
  text: string
  variant: "default" | "outline" | "secondary"
  error?: boolean
} | null {
  if (item.bunny_stream_id) {
    if (item.bunny_stream_status === "ready")
      return { text: "status_ready", variant: "default" }
    if (item.bunny_stream_status === "failed")
      return { text: "status_failed", variant: "outline", error: true }
    if (item.bunny_stream_status === "uploading")
      return { text: "status_uploading", variant: "secondary" }
    return { text: "status_processing", variant: "secondary" }
  }
  if (item.document_path) return { text: "status_ready", variant: "default" }
  if (item.exam_id) return { text: "status_exam", variant: "outline" }
  return null
}

export function ItemCard({
  item,
  courseId,
  lessonId,
  chapterId,
  onUpdate,
}: {
  item: ItemOut
  courseId: number
  lessonId: number
  chapterId?: number | null
  onUpdate: (item: ItemOut) => void
}) {
  const t = useTranslations("items")
  const {
    enabled,
    selectedNode,
    hoveredNode,
    setHoveredNode,
    highlightNode,
    clearSelectedNode,
    selectNode,
  } = useCourseBuilderBridge()
  const { update, remove } = useItemMutations(courseId, lessonId)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<
    "video" | "document" | null
  >(null)
  const [deletingMedia, setDeletingMedia] = useState<
    "video" | "document" | null
  >(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadDialogType, setUploadDialogType] = useState<
    "video" | "document"
  >("video")
  const [editTitle, setEditTitle] = useState(item.title)
  const [error, setError] = useState<string | null>(null)
  const submitting = update.isPending || remove.isPending || deletingMedia !== null

  const type = itemType(item)
  const status = itemStatus(item)
  const hasVideo = Boolean(item.bunny_stream_id)
  const hasDocument = Boolean(item.document_path)
  const isSelected =
    selectedNode?.type === "item" && String(selectedNode.id) === String(item.id)
  const isHovered =
    hoveredNode?.type === "item" && String(hoveredNode.id) === String(item.id)
  const node = {
    type: "item" as const,
    id: item.id,
    chapterId: chapterId ?? undefined,
    lessonId,
  }

  useEffect(() => {
    if (!enabled || !isSelected) return

    const frame = window.requestAnimationFrame(() => {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>("[data-builder-node-type]")
      ).find(
        (element) =>
          element.dataset.builderNodeType === "item" &&
          element.dataset.builderNodeId === String(item.id)
      )
      target?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [enabled, isSelected, item.id])

  const openUploadDialog = useCallback(
    (uploadType: "video" | "document") => {
      const alreadyAttached =
        uploadType === "video" ? hasVideo : hasDocument
      if (alreadyAttached || uploading || deletingMedia) return
      setUploadDialogType(uploadType)
      setUploadDialogOpen(true)
    },
    [deletingMedia, hasDocument, hasVideo, uploading]
  )

  const handleVideoUpload = useCallback(
    async (file: File, title: string) => {
      setUploading(true)
      setUploadProgress(0)
      try {
        if (title !== item.title) {
          await update.mutateAsync({ itemId: item.id, data: { title } })
        }

        const credentialsResult = await requestVideoUpload(
          courseId,
          lessonId,
          item.id,
          title
        )
        if (!credentialsResult.success) {
          toast.error(credentialsResult.error.message || t("upload_error"))
          return
        }

        await uploadVideoToBunnyTus(
          file,
          credentialsResult.data,
          setUploadProgress
        )
        const confirmResult = await confirmVideoUpload(
          courseId,
          lessonId,
          item.id,
          credentialsResult.data.video_id
        )
        if (!confirmResult.success) {
          toast.error(confirmResult.error.message || t("upload_error"))
          return
        }

        onUpdate(confirmResult.data)
        setUploadDialogOpen(false)
        toast.success(t("upload_success_processing"))
      } catch {
        toast.error(t("upload_error"))
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [courseId, lessonId, item.id, item.title, onUpdate, t, update]
  )

  const handleDocUpload = useCallback(
    async (file: File, title: string) => {
      setUploading(true)
      setUploadProgress(0)
      try {
        if (title !== item.title) {
          await update.mutateAsync({ itemId: item.id, data: { title } })
        }

        const urlResult = await requestUploadUrl(
          courseId,
          lessonId,
          item.id,
          file.name
        )
        if (!urlResult.success) {
          toast.error(urlResult.error.message || t("upload_error"))
          return
        }
        const uploadResponse = await uploadToPresignedUrl(
          urlResult.data.upload_url,
          file
        )
        if (!uploadResponse.ok) {
          toast.error(t("upload_error"))
          return
        }
        const confirmResult = await confirmUpload(
          courseId,
          lessonId,
          item.id,
          urlResult.data.key
        )
        if (confirmResult.success) {
          onUpdate(confirmResult.data)
          setUploadDialogOpen(false)
          toast.success(t("upload_success"))
        } else {
          toast.error(confirmResult.error.message || t("upload_error"))
        }
      } catch {
        toast.error(t("upload_error"))
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [courseId, lessonId, item.id, item.title, onUpdate, t, update]
  )

  const handleUpload = useCallback(
    (file: File, title: string, uploadType: "video" | "document") => {
      if (uploadType === "video") {
        void handleVideoUpload(file, title)
      } else {
        void handleDocUpload(file, title)
      }
    },
    [handleDocUpload, handleVideoUpload]
  )

  const handleSave = useCallback(async () => {
    const trimmed = editTitle.trim()
    if (!trimmed) return
    setError(null)
    try {
      await update.mutateAsync({ itemId: item.id, data: { title: trimmed } })
      setEditOpen(false)
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : t("upload_error"),
      )
    }
  }, [editTitle, item.id, t, update])

  const handleDelete = useCallback(async () => {
    setError(null)
    try {
      await remove.mutateAsync(item.id)
      setDeleteOpen(false)
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : t("upload_error"),
      )
    }
  }, [item.id, remove, t])

  const handleDeleteMedia = useCallback(async () => {
    if (!mediaToDelete || deletingMedia) return

    setError(null)
    setDeletingMedia(mediaToDelete)
    try {
      const result =
        mediaToDelete === "video"
          ? await deleteItemVideo(courseId, lessonId, item.id)
          : await deleteItemDocument(courseId, lessonId, item.id)

      if (!result.success) {
        setError(result.error.message || t("media_delete_error"))
        return
      }

      onUpdate(result.data)
      setMediaToDelete(null)
      toast.success(
        mediaToDelete === "video" ? t("video_deleted") : t("document_deleted")
      )
    } catch {
      setError(t("media_delete_error"))
    } finally {
      setDeletingMedia(null)
    }
  }, [courseId, deletingMedia, item.id, lessonId, mediaToDelete, onUpdate, t])

  return (
    <div
      data-builder-node-type="item"
      data-builder-node-id={item.id}
      data-builder-node-state={
        isSelected ? "selected" : isHovered ? "hovered" : "idle"
      }
      tabIndex={enabled ? -1 : undefined}
      onMouseEnter={() => enabled && setHoveredNode(node)}
      onMouseLeave={() => setHoveredNode(null)}
      onFocus={(event) => {
        if (event.target === event.currentTarget) highlightNode(node)
      }}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget
        if (
          !(nextTarget instanceof Node) ||
          !event.currentTarget.contains(nextTarget)
        ) {
          clearSelectedNode(node)
        }
      }}
      className={`group flex items-center gap-2.5 px-3.5 py-2 transition-colors hover:bg-surface-muted/30 ${isHovered ? "bg-sky-500/10 ring-2 ring-sky-400/70 ring-inset" : ""} ${isSelected ? "bg-primary/10 ring-2 ring-primary/35 ring-inset" : ""}`}
      onClick={() => selectNode(node)}
    >
      <span
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-white",
          type.bg
        )}
        title={t(type.label)}
      >
        {type.icon}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {item.title}
      </span>

      {status && (
        <Badge
          variant={status.variant}
          className={cn(
            status.variant === "default" &&
              "border-success/20 bg-success-tint text-success",
            status.variant === "secondary" &&
              "border-warning/20 bg-warning-tint text-warning",
            status.error &&
              "border-destructive/20 bg-destructive/10 text-destructive"
          )}
        >
          {t(status.text)}
        </Badge>
      )}

      <div className="flex items-center gap-0.5 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        {!hasVideo && (
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={uploading || deletingMedia !== null}
            onClick={() => openUploadDialog("video")}
            aria-label={t("upload_video")}
            title={t("upload_video")}
          >
            <Upload className="size-3.5" />
          </Button>
        )}
        {!hasDocument && (
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={uploading || deletingMedia !== null}
            onClick={() => openUploadDialog("document")}
            aria-label={t("upload_document")}
            title={t("upload_document")}
          >
            <FileText className="size-3.5" />
          </Button>
        )}
        {hasVideo && (
          <Button
            size="icon"
            variant="ghost"
            className="size-6 text-destructive hover:text-destructive"
            disabled={uploading || deletingMedia !== null}
            onClick={() => {
              setError(null)
              setMediaToDelete("video")
            }}
            aria-label={t("delete_video")}
            title={t("delete_video")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
        {hasDocument && (
          <Button
            size="icon"
            variant="ghost"
            className="size-6 text-destructive hover:text-destructive"
            disabled={uploading || deletingMedia !== null}
            onClick={() => {
              setError(null)
              setMediaToDelete("document")
            }}
            aria-label={t("delete_document")}
            title={t("delete_document")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          onClick={() => {
            setEditTitle(item.title)
            setError(null)
            setEditOpen(true)
          }}
          aria-label={t("edit")}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          onClick={() => {
            setError(null)
            setDeleteOpen(true)
          }}
          aria-label={t("delete")}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        type={uploadDialogType}
        itemTitle={item.title}
        uploading={uploading}
        progress={uploadProgress}
        onUpload={handleUpload}
      />

      <Dialog
        open={mediaToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingMedia) {
            setMediaToDelete(null)
            setError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mediaToDelete === "video"
                ? t("delete_video")
                : t("delete_document")}
            </DialogTitle>
            <DialogDescription>
              {mediaToDelete === "video"
                ? t("delete_video_confirm")
                : t("delete_document_confirm")}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={deletingMedia !== null}>
                  {t("cancel")}
                </Button>
              }
            />
            <Button
              variant="destructive"
              onClick={handleDeleteMedia}
              disabled={deletingMedia !== null}
            >
              {deletingMedia ? t("saving") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(val) => {
          setEditOpen(val)
          if (!val) setError(null)
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
                e.preventDefault()
                handleSave()
              }
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={submitting}>
                  {t("cancel")}
                </Button>
              }
            />
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(val) => {
          setDeleteOpen(val)
          if (!val) setError(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>{t("delete_confirm")}</DialogDescription>
          </DialogHeader>
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
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? t("saving") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
