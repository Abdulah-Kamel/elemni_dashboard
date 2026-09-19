"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { FileDropzone } from "@/components/ui/file-dropzone"
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
import { Check, Loader2 } from "lucide-react"
import {
  validateItemUploadFile,
} from "../item-upload-validation"

export type AttachmentUploadStatus =
  | "idle"
  | "uploading"
  | "uploaded"
  | "failed"

export type CreateItemPayload = {
  title: string
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

type Step = 1 | 2

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
  const locale = useLocale()
  const t = useTranslations("items")
  const [step, setStep] = useState<Step>(1)
  const [title, setTitle] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return

    wasOpenRef.current = true
    setStep(1)
    setTitle("")
    setVideoFile(null)
    setDocumentFile(null)
    setVideoError(null)
    setDocumentError(null)
  }, [open])

  const handleVideoFile = useCallback(
    (selected: File | null) => {
      if (!selected) return
      if (videoStatus === "uploaded") return
      const error = validateItemUploadFile(selected, "video")
      if (error) {
        setVideoError(t(error))
        return
      }
      setVideoError(null)
      setVideoFile(selected)
    },
    [videoStatus, t]
  )

  const handleDocumentFile = useCallback(
    (selected: File | null) => {
      if (!selected) return
      if (documentStatus === "uploaded") return
      const error = validateItemUploadFile(selected, "document")
      if (error) {
        setDocumentError(t(error))
        return
      }
      setDocumentError(null)
      setDocumentFile(selected)
    },
    [documentStatus, t]
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
    onSubmit({ title: trimmed, videoFile, documentFile })
  }, [title, uploading, hasAttachment, onSubmit, videoFile, documentFile])

  const stepTitle =
    step === 1
      ? t("create_placeholder")
      : t("create_attachments")
  const stepDescription =
    step === 1
      ? t("create_placeholder")
      : t("create_attachments_desc")

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && uploading) return
        onOpenChange(nextOpen)
        if (!nextOpen) {
          wasOpenRef.current = false
          setStep(1)
          setTitle("")
          setVideoFile(null)
          setDocumentFile(null)
          setVideoError(null)
          setDocumentError(null)
        }
      }}
    >
      <DialogContent className="!w-[calc(100vw-2rem)] !max-w-none sm:!w-[42rem]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>{stepTitle}</DialogTitle>
              <DialogDescription className="mt-1">
                {stepDescription}
              </DialogDescription>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t("create_step_count", { step })}
            </span>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2" aria-label={stepTitle}>
          {[1, 2].map((stepNumber) => {
            const complete = stepNumber < step
            const active = stepNumber === step
            return (
              <div
                key={stepNumber}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                    complete
                      ? "border-primary bg-primary text-primary-foreground"
                      : active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {complete ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </span>
                {stepNumber < 2 && (
                  <span className="h-px min-w-3 flex-1 bg-border" />
                )}
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <div className="space-y-2">
            <Label htmlFor="create-item-title">{t("create_placeholder")}</Label>
            <Input
              id="create-item-title"
              aria-label="Item title"
              value={title}
              maxLength={200}
              autoFocus
              disabled={uploading}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {error && (
              <p role="alert" className="text-sm text-destructive">{error}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t("upload_video")}
                </Label>
                {videoStatus === "uploaded" && (
                  <span className="text-xs text-muted-foreground">{t("attachment_uploaded")}</span>
                )}
                {videoStatus === "failed" && (
                  <span className="text-xs text-destructive">{t("attachment_failed")}</span>
                )}
                {videoStatus === "idle" && (
                  <span className="text-xs text-muted-foreground">
                    {videoFile ? t("attachment_selected") : t("attachment_optional")}
                  </span>
                )}
              </div>
              <FileDropzone
                onFileSelect={handleVideoFile}
                locale={locale}
                accept="video/*"
                inputId="create-item-video"
                selectedFile={videoFile}
                disabled={uploading || videoStatus === "uploaded"}
                error={videoError ?? undefined}
                description="MP4, MOV, WebM up to 500MB"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t("upload_document")}
                </Label>
                {documentStatus === "uploaded" && (
                  <span className="text-xs text-muted-foreground">{t("attachment_uploaded")}</span>
                )}
                {documentStatus === "failed" && (
                  <span className="text-xs text-destructive">{t("attachment_failed")}</span>
                )}
                {documentStatus === "idle" && (
                  <span className="text-xs text-muted-foreground">
                    {documentFile ? t("attachment_selected") : t("attachment_optional")}
                  </span>
                )}
              </div>
              <FileDropzone
                onFileSelect={handleDocumentFile}
                locale={locale}
                accept=".pdf,application/pdf"
                inputId="create-item-document"
                selectedFile={documentFile}
                disabled={uploading || documentStatus === "uploaded"}
                error={documentError ?? undefined}
                description="PDF files only"
              />
            </div>

            {!hasAttachment && (
              <p role="alert" className="text-xs text-destructive">
                {t("select_one_attachment")}
              </p>
            )}
          </div>
        )}

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
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => setStep((current) => (current - 1) as Step)}
            >
              {t("back")}
            </Button>
          )}
          {step === 1 ? (
            <Button
              type="button"
              disabled={uploading || !title.trim()}
              onClick={() => setStep(2)}
            >
              {t("next")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAction}
              disabled={!title.trim() || uploading || !hasAttachment}
              className="gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  {t("uploading")}
                </>
              ) : (
                actionLabel
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
