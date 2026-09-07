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
import { Check, FileText, FileVideo, Loader2, Upload } from "lucide-react"

export type UploadType = "video" | "document"
const MAX_VIDEO_SIZE = 500 * 1024 * 1024
type UploadStep = 1 | 2 | 3

export function UploadDialog({
  open,
  onOpenChange,
  type,
  itemTitle,
  onUpload,
  uploading,
  progress,
  allowTypeSelection = true,
}: {
  open: boolean
  onOpenChange: (val: boolean) => void
  type: UploadType
  itemTitle: string
  onUpload: (file: File, title: string, type: UploadType) => void
  uploading: boolean
  progress: number
  allowTypeSelection?: boolean
}) {
  const locale = useLocale()
  const t = useTranslations("items")
  const [step, setStep] = useState<UploadStep>(1)
  const [title, setTitle] = useState(itemTitle)
  const [selectedType, setSelectedType] = useState<UploadType>(type)
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return

    wasOpenRef.current = true
    setStep(1)
    setTitle(itemTitle)
    setSelectedType(type)
    setFile(null)
    setValidationError(null)
  }, [itemTitle, open, type])

  const accept = selectedType === "video" ? "video/*" : ".pdf,application/pdf"

  const handleFile = useCallback(
    (selected: File | null) => {
      if (!selected) return
      if (selectedType === "video" && !selected.type.startsWith("video/")) {
        setValidationError(t("invalid_video"))
        return
      }
      if (selectedType === "video" && selected.size > MAX_VIDEO_SIZE) {
        setValidationError(t("video_too_large"))
        return
      }
      if (
        selectedType === "document" &&
        selected.type !== "application/pdf" &&
        !selected.name.toLowerCase().endsWith(".pdf")
      ) {
        setValidationError(t("invalid_document"))
        return
      }
      setValidationError(null)
      setFile(selected)
    },
    [selectedType, t]
  )

  const resetFile = useCallback(() => {
    setFile(null)
    setValidationError(null)
  }, [])

  const reset = useCallback(() => {
    setStep(1)
    setTitle(itemTitle)
    setSelectedType(type)
    resetFile()
  }, [itemTitle, resetFile, type])

  const handleUpload = useCallback(() => {
    const trimmedTitle = title.trim()
    if (!file || !trimmedTitle || uploading) return
    onUpload(file, trimmedTitle, selectedType)
  }, [file, onUpload, selectedType, title, uploading])

  const stepTitle =
    step === 1
      ? t("upload_step_name")
      : step === 2
        ? t("upload_step_type")
        : t("upload_step_file")
  const stepDescription =
    step === 1
      ? t("upload_step_name_desc")
      : step === 2
        ? t("upload_step_type_desc")
        : selectedType === "video"
          ? t("upload_video_desc")
          : t("upload_document_desc")

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && uploading) return
        onOpenChange(nextOpen)
        if (!nextOpen) reset()
      }}
    >
      <DialogContent className="!w-[calc(100vw-2rem)] !max-w-none sm:!w-[42rem]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>{t("upload_content")}</DialogTitle>
              <DialogDescription className="mt-1">
                {stepDescription}
              </DialogDescription>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t("upload_step_count", { step })}
            </span>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2" aria-label={stepTitle}>
          {[1, 2, 3].map((stepNumber) => {
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
                {stepNumber < 3 && (
                  <span className="h-px min-w-3 flex-1 bg-border" />
                )}
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <div className="space-y-2">
            <Label htmlFor="upload-item-title">{t("create_placeholder")}</Label>
            <Input
              id="upload-item-title"
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
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["video", FileVideo, t("upload_video"), t("video_accept")],
                [
                  "document",
                  FileText,
                  t("upload_document"),
                  t("document_accept"),
                ],
              ] as const
            )
              .filter(([value]) => allowTypeSelection || value === type)
              .map(([value, Icon, label, hint]) => {
                const selected = selectedType === value
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedType(value)
                      resetFile()
                    }}
                    className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    <Icon className="size-7" aria-hidden="true" />
                    <span className="text-sm font-bold">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {hint}
                    </span>
                  </button>
                )
              })}
          </div>
        )}

        {step === 3 && (
          <FileDropzone
            onFileSelect={handleFile}
            locale={locale}
            accept={accept}
            selectedFile={file}
            onClear={resetFile}
            disabled={uploading}
            error={validationError ?? undefined}
            description={
              selectedType === "video"
                ? t("video_accept")
                : t("document_accept")
            }
            className="min-h-44"
          />
        )}

        {uploading && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            aria-live="polite"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>{t("uploading_progress", { progress })}</span>
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
              onClick={() => setStep((current) => (current - 1) as UploadStep)}
            >
              {t("back")}
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              disabled={uploading || (step === 1 ? !title.trim() : false)}
              onClick={() => setStep((current) => (current + 1) as UploadStep)}
            >
              {t("next")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || !title.trim() || uploading}
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
                <>
                  <Upload className="size-3.5" aria-hidden="true" />
                  {t("upload")}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
