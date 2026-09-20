"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Upload, X, FileIcon, FileVideo, FileText, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { type UploadType } from "../item-upload-validation"

export type AttachmentUploadStatus =
  "idle" | "uploading" | "uploaded" | "failed"

type ItemAttachmentsPickerProps = {
  videoFile: File | null
  documentFile: File | null
  videoStatus: AttachmentUploadStatus
  documentStatus: AttachmentUploadStatus
  videoProgress: number
  disabled: boolean
  error: string | null
  onFilesSelect: (files: File[]) => void
  onRemove: (type: UploadType) => void
  separateInputs?: boolean
}

function StatusLabel({ status }: { status: AttachmentUploadStatus }) {
  const t = useTranslations("items")

  if (status === "uploaded") {
    return (
      <span className="text-xs text-muted-foreground">
        {t("attachment_uploaded")}
      </span>
    )
  }
  if (status === "failed") {
    return (
      <span className="text-xs text-destructive">{t("attachment_failed")}</span>
    )
  }
  return null
}

function SelectedRow({
  file,
  type,
  status,
  progress,
  disabled,
  onRemove,
}: {
  file: File
  type: UploadType
  status: AttachmentUploadStatus
  progress: number
  disabled: boolean
  onRemove: (type: UploadType) => void
}) {
  const t = useTranslations("items")
  const removeLabel =
    type === "video" ? t("delete_video") : t("delete_document")
  const canRemove = status !== "uploaded" && !disabled

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <FileIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <div className="flex items-center gap-2">
          <StatusLabel status={status} />
          {status === "uploading" && (
            <span className="text-xs text-muted-foreground">{progress}%</span>
          )}
        </div>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(type)}
          aria-label={removeLabel}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export function ItemAttachmentsPicker({
  videoFile,
  documentFile,
  videoStatus,
  documentStatus,
  videoProgress,
  disabled,
  error,
  onFilesSelect,
  onRemove,
  separateInputs = false,
}: ItemAttachmentsPickerProps) {
  const t = useTranslations("items")
  const inputRef = useRef<HTMLInputElement>(null)
  const separateInputRefs = useRef<Record<UploadType, HTMLInputElement | null>>(
    {
      video: null,
      document: null,
    }
  )
  const dragDepthRef = useRef(0)
  const [dragOver, setDragOver] = useState(false)

  const handleBrowse = useCallback(() => {
    if (disabled) return
    inputRef.current?.click()
  }, [disabled])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        handleBrowse()
      }
    },
    [disabled, handleBrowse]
  )

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files.length > 0) {
        onFilesSelect(files)
      }
      event.target.value = ""
    },
    [onFilesSelect]
  )

  const handleSeparateInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) onFilesSelect([file])
      event.target.value = ""
    },
    [onFilesSelect]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      dragDepthRef.current = 0
      setDragOver(false)
      if (disabled) return
      const files = Array.from(event.dataTransfer.files)
      if (files.length > 0) {
        onFilesSelect(files)
      }
    },
    [disabled, onFilesSelect]
  )

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      if (!disabled) {
        event.dataTransfer.dropEffect = "copy"
      }
    },
    [disabled]
  )

  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      dragDepthRef.current++
      if (!disabled) setDragOver(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    dragDepthRef.current--
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0
      setDragOver(false)
    }
  }, [])

  const hasVideo = videoFile !== null
  const hasDocument = documentFile !== null

  return (
    <div className="w-full space-y-3">
      {separateInputs ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t("attached_files")}</h4>
          {(["video", "document"] as const).map((type) => {
            const isVideo = type === "video"
            const file = isVideo ? videoFile : documentFile
            const id = `create-item-${type}-upload`
            const Icon = isVideo ? FileVideo : FileText
            return (
              <div
                key={type}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <input
                  ref={(element) => {
                    separateInputRefs.current[type] = element
                  }}
                  id={id}
                  type="file"
                  accept={isVideo ? "video/*" : ".pdf,application/pdf"}
                  onChange={handleSeparateInputChange}
                  disabled={disabled}
                  className="sr-only"
                />
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0" />
                  <span className="text-sm">
                    {isVideo ? t("type_video") : t("type_document")}
                  </span>
                  {file ? (
                    <span className="min-w-0 truncate text-xs text-muted-foreground">
                      {file.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("not_attached")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {file && (
                    <button
                      type="button"
                      onClick={() => onRemove(type)}
                      aria-label={
                        isVideo ? t("delete_video") : t("delete_document")
                      }
                      disabled={disabled}
                      className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-controls={id}
                    onClick={() => separateInputRefs.current[type]?.click()}
                    disabled={disabled}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    {isVideo ? t("upload_video") : t("upload_document")}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            id="create-item-attachments"
            type="file"
            accept="video/*,.pdf,application/pdf"
            multiple
            onChange={handleInputChange}
            disabled={disabled}
            className="sr-only"
          />

          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={t("drop_or_click")}
            aria-disabled={disabled || undefined}
            onClick={handleBrowse}
            onKeyDown={handleKeyDown}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={cn(
              "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:bg-muted/40 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none",
              dragOver ? "border-primary bg-primary/5" : "border-border",
              disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
            )}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-4" />
            </span>
            <p className="text-sm font-medium text-foreground">
              {t("drop_or_click")}
            </p>
            <span className="text-xs text-muted-foreground">
              {t("video_accept")}
            </span>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!separateInputs && hasVideo && videoFile && (
        <SelectedRow
          file={videoFile}
          type="video"
          status={videoStatus}
          progress={videoProgress}
          disabled={disabled}
          onRemove={onRemove}
        />
      )}

      {!separateInputs && hasDocument && documentFile && (
        <SelectedRow
          file={documentFile}
          type="document"
          status={documentStatus}
          progress={0}
          disabled={disabled}
          onRemove={onRemove}
        />
      )}
    </div>
  )
}
