"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, X, FileIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const COPY = {
  ar: {
    browse: "اختيار ملف",
    dragDrop: "اسحب وأفلت الملف هنا",
    clickToBrowse: "أو اضغط لاختيار ملف",
    replace: "اضغط لتغيير الملف",
    removeFile: "إزالة الملف",
  },
  en: {
    browse: "Choose a file",
    dragDrop: "Drag & drop a file here",
    clickToBrowse: "or click to browse",
    replace: "Click to replace the file",
    removeFile: "Remove file",
  },
}

function resolveLocale(locale: string): "ar" | "en" {
  return locale.toLowerCase().startsWith("ar") ? "ar" : "en"
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Props for the reusable drag-and-drop file picker. */
export interface FileDropzoneProps {
  /** Called with the selected File when the user picks or drops one. */
  onFileSelect: (file: File) => void
  /** Current locale string; drives Arabic/English copy. */
  locale: string
  /** HTML `accept` attribute forwarded to the hidden file input. */
  accept?: string
  /** Optional `id` for the hidden `<input type="file">`, used to wire a visible `<label htmlFor>`. */
  inputId?: string
  /** Currently selected file, if any. When set, shows file metadata instead of the drop prompt. */
  selectedFile?: File | null
  /** Called when the user clicks the clear/remove action. Callers own the state reset. */
  onClear?: () => void
  /** Disables browse and drop. The component does not own validation or toast logic — callers handle that. */
  disabled?: boolean
  /** Error message rendered below the drop region. Callers own error copy. */
  error?: string
  /** Optional helper text shown inside the drop region (e.g. accepted types, size limit). */
  description?: string
  /** Additional CSS classes for the root wrapper. */
  className?: string
}

/**
 * Accessible drag-and-drop file picker.
 *
 * **Validation and toasts are caller-owned** — this component only renders the
 * clickable drop region, selected-file metadata, and clear action.
 * It does not enforce file type, size, or count limits.
 *
 * Structure:
 * - Keyboard-accessible `role="button"` drop region (no nested controls).
 * - Separate shadcn `Button` for clearing an existing file.
 * - Depth-tracked drag enter/leave for reliable visual feedback.
 */

export function FileDropzone({
  onFileSelect,
  locale,
  accept,
  inputId,
  selectedFile,
  onClear,
  disabled = false,
  error,
  description,
  className,
}: FileDropzoneProps) {
  const lang = resolveLocale(locale)
  const copy = COPY[lang]
  const dir = lang === "ar" ? "rtl" : "ltr"
  const inputRef = useRef<HTMLInputElement>(null)
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
      const file = event.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
      event.target.value = ""
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      dragDepthRef.current = 0
      setDragOver(false)
      if (disabled) return
      const file = event.dataTransfer.files[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [disabled, onFileSelect]
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

  const hasFile = selectedFile != null

  return (
    <div dir={dir} className={cn("w-full", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        disabled={disabled}
        tabIndex={-1}
      />

      {/* The whole region is the browse target; keep controls outside it. */}
      <div
        data-testid="drop-region"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={hasFile ? copy.replace : copy.browse}
        aria-disabled={disabled || undefined}
        onClick={handleBrowse}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:bg-muted/40 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none",
          dragOver ? "border-primary bg-primary/5" : "border-border",
          disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
          error && "border-destructive/50"
        )}
      >
        {hasFile ? (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileIcon className="size-5" />
            </span>
            <div className="min-w-0 text-start">
              <p className="truncate text-sm font-medium">
                {selectedFile!.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile!.size)}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {copy.replace}
            </span>
          </div>
        ) : (
          <>
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-5" />
            </span>
            <p className="text-sm font-medium text-foreground">
              {copy.dragDrop}
            </p>
            <span className="text-xs text-muted-foreground">
              {copy.clickToBrowse}
            </span>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </div>

      {/* Clear remains a separate control so the drop target has no nested actions. */}
      {hasFile && onClear && (
        <div className="mt-2 flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label={copy.removeFile}
          >
            <X className="me-1 size-3.5" />
            {copy.removeFile}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
