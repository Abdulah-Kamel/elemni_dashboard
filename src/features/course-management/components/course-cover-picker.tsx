"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { ImagePlus, Images } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export const MAX_COURSE_COVER_SIZE = 5 * 1024 * 1024
export const ALLOWED_COURSE_COVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

export function CourseCoverPicker({
  currentImageUrl,
  file,
  onChange,
  disabled,
}: {
  currentImageUrl?: string | null
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}) {
  const t = useTranslations("courses")
  const fileRef = useRef<HTMLInputElement>(null)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function selectFile(nextFile: File | undefined) {
    if (!nextFile) return
    if (!ALLOWED_COURSE_COVER_TYPES.has(nextFile.type)) {
      toast.error(t("cover_invalid_type"))
      return
    }
    if (nextFile.size > MAX_COURSE_COVER_SIZE) {
      toast.error(t("cover_too_large"))
      return
    }
    onChange(nextFile)
  }

  const candidateImageUrl = previewUrl ?? currentImageUrl
  const imageUrl =
    candidateImageUrl === failedImageUrl ? null : candidateImageUrl

  return (
    <div className="space-y-2">
      <Label>{t("cover_label")}</Label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
        className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-surface-muted text-on-surface-muted transition-colors hover:border-primary hover:bg-primary-tint/30 disabled:pointer-events-none disabled:opacity-50"
        aria-label={imageUrl ? t("cover_replace") : t("cover_upload")}
      >
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 640px) 90vw, 480px"
              className="object-cover"
              onError={() => setFailedImageUrl(imageUrl ?? null)}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-on-surface/55 text-sm font-semibold text-on-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <ImagePlus className="me-2 size-4" aria-hidden="true" />
              {t("cover_replace")}
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 p-6">
            <span className="rounded-xl bg-primary-tint p-3 text-primary">
              <Images className="size-6" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-on-surface">
              {t("cover_upload")}
            </span>
            <span className="text-label-sm">{t("cover_hint")}</span>
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          selectFile(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      {file && (
        <div className="flex items-center justify-between gap-3 text-label-sm text-on-surface-muted">
          <span className="truncate">{file.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            {t("cover_clear_selection")}
          </Button>
        </div>
      )}
    </div>
  )
}
