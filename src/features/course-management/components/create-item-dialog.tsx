"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { parseWatchLimit } from "../watch-limit"
import { Loader2 } from "lucide-react"
import {
  mergeItemAttachmentFiles,
  getItemAttachmentType,
  type UploadType,
} from "../item-upload-validation"
import {
  ItemAttachmentsPicker,
  type AttachmentUploadStatus,
} from "./item-attachments-picker"

export type { AttachmentUploadStatus } from "./item-attachments-picker"

export type CreateItemPayload = {
  title: string
  max_watch_count?: number
  videoFile: File | null
  documentFile: File | null
}

type CreateItemDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CreateItemPayload) => void
  uploading: boolean
  videoStatus: AttachmentUploadStatus
  documentStatus: AttachmentUploadStatus
  videoProgress: number
  error: string | null
}

export function CreateItemDialog({
  open,
  onOpenChange,
  onSubmit,
  uploading,
  videoStatus,
  documentStatus,
  videoProgress,
  error,
}: CreateItemDialogProps) {
  const t = useTranslations("items")
  const [title, setTitle] = useState("")
  const [watchLimit, setWatchLimit] = useState("")
  const [watchLimitError, setWatchLimitError] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return

    wasOpenRef.current = true
    setTitle("")
    setWatchLimit("")
    setWatchLimitError(false)
    setVideoFile(null)
    setDocumentFile(null)
    setAttachmentError(null)
  }, [open])

  const handleFilesSelect = useCallback(
    (files: File[]) => {
      if (
        videoStatus === "uploaded" &&
        files.some((file) => getItemAttachmentType(file) === "video")
      ) {
        setAttachmentError(t("video_already_uploaded"))
        return
      }
      if (
        documentStatus === "uploaded" &&
        files.some((file) => getItemAttachmentType(file) === "document")
      ) {
        setAttachmentError(t("document_already_uploaded"))
        return
      }

      const result = mergeItemAttachmentFiles(
        { videoFile, documentFile },
        files
      )
      if (result.error) {
        setAttachmentError(t(result.error))
        return
      }
      setAttachmentError(null)
      setVideoFile(result.selection.videoFile)
      setDocumentFile(result.selection.documentFile)
    },
    [documentFile, documentStatus, t, videoFile, videoStatus]
  )

  const handleRemove = useCallback(
    (type: UploadType) => {
      if (type === "video" && videoStatus === "uploaded") return
      if (type === "document" && documentStatus === "uploaded") return
      setAttachmentError(null)
      if (type === "video") setVideoFile(null)
      else setDocumentFile(null)
    },
    [videoStatus, documentStatus]
  )

  const hasAttachment = videoFile !== null || documentFile !== null

  const actionLabel = (() => {
    const bothFailed = videoStatus === "failed" && documentStatus === "failed"
    if (bothFailed) return t("retry_failed_uploads")
    if (videoStatus === "failed") return t("retry_video")
    if (documentStatus === "failed") return t("retry_document")
    if (videoFile && documentFile) return t("create_item_with_two_files")
    return t("create_item")
  })()

  const handleAction = useCallback(() => {
    const trimmed = title.trim()
    if (!trimmed || uploading || !hasAttachment) return
    const limit = parseWatchLimit(watchLimit)
    if (videoFile && !limit.ok) {
      setWatchLimitError(true)
      return
    }
    setWatchLimitError(false)
    onSubmit({
      title: trimmed,
      videoFile,
      documentFile,
      ...(videoFile && limit.ok && limit.value !== null
        ? { max_watch_count: limit.value }
        : {}),
    })
  }, [title, watchLimit, uploading, hasAttachment, onSubmit, videoFile, documentFile])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && uploading) return
        onOpenChange(nextOpen)
        if (!nextOpen) {
          wasOpenRef.current = false
          setTitle("")
          setVideoFile(null)
          setDocumentFile(null)
          setAttachmentError(null)
        }
      }}
    >
      <DialogContent className="!w-[calc(100vw-2rem)] !max-w-none sm:!w-[42rem]">
        <DialogHeader>
          <DialogTitle>{t("create")}</DialogTitle>
          <DialogDescription className="mt-1">
            {t("create_attachments_desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-item-title">{t("create_placeholder")}</Label>
            <Input
              id="create-item-title"
              maxLength={200}
              value={title}
              autoFocus
              disabled={uploading}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <ItemAttachmentsPicker
            videoFile={videoFile}
            documentFile={documentFile}
            videoStatus={videoStatus}
            documentStatus={documentStatus}
            videoProgress={videoProgress}
            disabled={uploading}
            error={attachmentError}
            onFilesSelect={handleFilesSelect}
            onRemove={handleRemove}
            separateInputs
          />

          {videoFile && (
            <div className="space-y-2">
              <Label htmlFor="create-item-watch-limit">{t("watchLimit.label")}</Label>
              <Input
                id="create-item-watch-limit"
                type="number"
                min={1}
                max={1000}
                step={1}
                value={watchLimit}
                disabled={uploading}
                aria-invalid={watchLimitError}
                aria-describedby={`create-item-watch-limit-hint${watchLimitError ? " create-item-watch-limit-error" : ""}`}
                onChange={(event) => {
                  setWatchLimit(event.target.value)
                  setWatchLimitError(false)
                }}
              />
              <p id="create-item-watch-limit-hint" className="text-xs text-muted-foreground">
                {t("watchLimit.hint")}
              </p>
              {watchLimitError && (
                <p id="create-item-watch-limit-error" role="alert" className="text-sm text-destructive">
                  {t("watchLimit.invalid")}
                </p>
              )}
            </div>
          )}

          {!hasAttachment && (
            <p role="alert" className="text-xs text-destructive">
              {t("select_one_attachment")}
            </p>
          )}
        </div>

        {uploading && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            aria-live="polite"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>{t("uploading_progress", { progress: videoProgress })}</span>
          </div>
        )}

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline" disabled={uploading}>
                {t("cancel")}
              </Button>
            }
          />
          <Button
            type="button"
            onClick={handleAction}
            disabled={!title.trim() || uploading || !hasAttachment}
            className="gap-1.5"
          >
            {uploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                {t("uploading")}
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
