"use client"

import { useState, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Film, FileText, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  requestVideoUpload,
  confirmVideoUpload,
  requestUploadUrl,
  confirmUpload,
} from "@/features/course-management/items-actions"
import { uploadToPresignedUrl } from "@/lib/upload"
import { uploadVideoToBunnyTus } from "@/lib/tus-upload"
import type { ItemOut } from "@/features/course-management/items-schema"
import { validateItemUploadFile } from "../item-upload-validation"

type UploadType = "video" | "document"

export function AttachedFilesSection({
  item,
  onUpdate,
  courseId,
  lessonId,
  onUpdateTitle,
  itemTitle,
  onDeleteRequest,
  deletingMedia,
}: {
  item: ItemOut
  onUpdate: (item: ItemOut) => void
  courseId: number
  lessonId: number
  onUpdateTitle: (title: string) => Promise<void>
  itemTitle: string
  onDeleteRequest: (type: UploadType) => void
  deletingMedia: UploadType | null
}) {
  const t = useTranslations("items")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRefs = useRef<Record<UploadType, HTMLInputElement | null>>({
    video: null,
    document: null,
  })

  const hasVideo = Boolean(item.bunny_stream_id)
  const hasDocument = Boolean(item.document_path)
  const documentName = item.document_path?.split("/").pop()
  const videoStatus =
    item.bunny_stream_status === "ready"
      ? "status_ready"
      : item.bunny_stream_status === "failed"
        ? "status_failed"
        : "status_processing"

  const openUploadInput = useCallback(
    (type: UploadType) => {
      if (uploading || deletingMedia) return
      setValidationError(null)
      inputRefs.current[type]?.click()
    },
    [deletingMedia, uploading]
  )

  const handleUpload = useCallback(
    async (file: File, title: string, type: UploadType) => {
      setUploading(true)
      setUploadProgress(0)
      try {
        if (title !== item.title) {
          await onUpdateTitle(title)
        }

        if (type === "video") {
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
          toast.success(t("upload_success_processing"))
        } else {
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
            toast.success(t("upload_success"))
          } else {
            toast.error(confirmResult.error.message || t("upload_error"))
          }
        }
      } catch {
        toast.error(t("upload_error"))
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [courseId, lessonId, item.id, item.title, onUpdate, onUpdateTitle, t]
  )

  const handleFileSelected = useCallback(
    (type: UploadType, file: File | undefined) => {
      if (!file) return
      const validationKey = validateItemUploadFile(file, type)
      if (validationKey) {
        setValidationError(t(validationKey))
        return
      }
      setValidationError(null)
      void handleUpload(file, itemTitle, type)
    },
    [handleUpload, itemTitle, t]
  )

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{t("attached_files")}</h4>

      {(["video", "document"] as const).map((type) => (
        <input
          key={type}
          ref={(element) => {
            inputRefs.current[type] = element
          }}
          id={`item-${item.id}-${type}-upload`}
          type="file"
          accept={type === "video" ? "video/*" : ".pdf,application/pdf"}
          className="sr-only"
          disabled={uploading || deletingMedia !== null}
          onChange={(event) => {
            handleFileSelected(type, event.target.files?.[0])
            event.target.value = ""
          }}
        />
      ))}

      {validationError && (
        <p role="alert" className="text-sm text-destructive">
          {validationError}
        </p>
      )}

      {/* Video row */}
      <div className="flex items-center justify-between rounded-md border p-2">
        <div className="flex items-center gap-2">
          <Film className="size-4" />
          <span className="text-sm">{t("type_video")}</span>
          {hasVideo && (
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {item.title}
            </span>
          )}
          {hasVideo && <Badge variant="secondary">{t(videoStatus)}</Badge>}
          {!hasVideo && (
            <span className="text-xs text-muted-foreground">
              {t("not_attached")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasVideo ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-destructive hover:text-destructive"
              disabled={uploading || deletingMedia !== null}
              onClick={() => onDeleteRequest("video")}
              aria-label={t("delete_video")}
              title={t("delete_video")}
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 px-2"
              disabled={uploading || deletingMedia !== null}
              onClick={() => openUploadInput("video")}
              aria-label={t("upload_video")}
              title={t("upload_video")}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>{t("upload_video")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Document row */}
      <div className="flex items-center justify-between rounded-md border p-2">
        <div className="flex items-center gap-2">
          <FileText className="size-4" />
          <span className="text-sm">{t("type_document")}</span>
          {documentName && (
            <span
              className="min-w-0 truncate text-xs text-muted-foreground"
              title={documentName}
            >
              {documentName}
            </span>
          )}
          {hasDocument && (
            <Badge variant="secondary">{t("status_ready")}</Badge>
          )}
          {!hasDocument && (
            <span className="text-xs text-muted-foreground">
              {t("not_attached")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasDocument ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-destructive hover:text-destructive"
              disabled={uploading || deletingMedia !== null}
              onClick={() => onDeleteRequest("document")}
              aria-label={t("delete_document")}
              title={t("delete_document")}
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 px-2"
              disabled={uploading || deletingMedia !== null}
              onClick={() => openUploadInput("document")}
              aria-label={t("upload_document")}
              title={t("upload_document")}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>{t("upload_document")}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {uploading
          ? t("uploading_progress", { progress: uploadProgress })
          : null}
      </div>
    </div>
  )
}
