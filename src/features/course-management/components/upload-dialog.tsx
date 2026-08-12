"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Upload, FileVideo, FileText, Loader2, X } from "lucide-react";

export type UploadType = "video" | "document";
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

export function UploadDialog({
  open,
  onOpenChange,
  type,
  onUpload,
  uploading,
  progress,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  type: UploadType;
  onUpload: (file: File) => void;
  uploading: boolean;
  progress: number;
}) {
  const t = useTranslations("items");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = type === "video" ? "video/*" : ".pdf,application/pdf";
  const icon = type === "video" ? <FileVideo className="size-8 text-muted-foreground" /> : <FileText className="size-8 text-muted-foreground" />;
  const title = type === "video" ? t("upload_video") : t("upload_document");
  const description = type === "video" ? t("upload_video_desc") : t("upload_document_desc");

  const handleFile = useCallback((selected: File | null) => {
    if (!selected) return;
    if (type === "video" && !selected.type.startsWith("video/")) {
      setValidationError(t("invalid_video"));
      return;
    }
    if (type === "video" && selected.size > MAX_VIDEO_SIZE) {
      setValidationError(t("video_too_large"));
      return;
    }
    if (
      type === "document" &&
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setValidationError(t("invalid_document"));
      return;
    }
    setValidationError(null);
    setFile(selected);
  }, [type, t]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleUpload = useCallback(() => {
    if (!file || uploading) return;
    onUpload(file);
  }, [file, uploading, onUpload]);

  const reset = useCallback(() => {
    setFile(null);
    setDragOver(false);
    setValidationError(null);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        {!file ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors
              ${dragOver ? "border-primary bg-primary/5" : "border-border bg-surface-muted/30 hover:bg-surface-muted/50"}
            `}
          >
            {icon}
            <div className="text-center">
              <p className="text-sm font-medium">{t("drop_or_click")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {type === "video" ? t("video_accept") : t("document_accept")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border bg-surface-muted/30 p-3">
            {icon}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            {!uploading && (
              <Button
                size="icon"
                variant="ghost"
                className="size-6 shrink-0"
                onClick={reset}
                aria-label={t("remove_file")}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        )}

        {validationError && (
          <p className="text-sm text-destructive" role="alert">
            {validationError}
          </p>
        )}

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>{t("uploading_progress", { progress })}</span>
          </div>
        )}

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" disabled={uploading}>
                {t("cancel")}
              </Button>
            }
          />
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="gap-1.5"
          >
            {uploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t("uploading")}
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                {t("upload")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
