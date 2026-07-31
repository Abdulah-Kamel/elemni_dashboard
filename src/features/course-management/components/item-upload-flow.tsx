"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import * as tus from "tus-js-client";
import { Button } from "@/components/ui/button";
import { FileVideo, FileText, Loader2, Upload, X, Film, File as FileIcon } from "lucide-react";
import { requestVideoUpload, confirmVideoUpload, requestUploadUrl, confirmUpload } from "@/features/course-management/items-actions";
import { uploadToPresignedUrl } from "@/lib/upload";
import type { ItemOut } from "@/features/course-management/items-schema";

type Props = {
  type: "video" | "document";
  item: ItemOut;
  courseId: number;
  lessonId: number;
  uploading: boolean;
  onUploadingChange: (v: boolean) => void;
  onComplete: (item: ItemOut) => void;
  onClose: () => void;
};

const BUNNY_STREAM_TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

export function ItemUploadFlow({
  type,
  item,
  courseId,
  lessonId,
  uploading,
  onUploadingChange,
  onComplete,
  onClose,
}: Props) {
  const t = useTranslations("items");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = type === "video" ? "video/*" : ".pdf,application/pdf";
  const Icon = type === "video" ? FileVideo : FileText;
  const title = type === "video" ? t("upload_video") : t("upload_document");
  const description = type === "video" ? t("upload_video_desc") : t("upload_document_desc");

  const reset = useCallback(() => {
    setFile(null);
    setProgress(0);
    setDragOver(false);
  }, []);

  const handleFile = useCallback((selected: File | null) => {
    if (!selected) return;
    if (type === "video" && !selected.type.startsWith("video/")) return;
    if (type === "document" && selected.type !== "application/pdf") return;
    setFile(selected);
  }, [type]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }, [handleFile]);

  const handleUpload = useCallback(async () => {
    if (!file || uploading) return;
    onUploadingChange(true);
    setProgress(0);

    try {
      if (type === "video") {
        const creds = await requestVideoUpload(courseId, lessonId, item.id, file.name);
        if (!creds.success) { return; }
        const c = creds.data;

        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: BUNNY_STREAM_TUS_ENDPOINT,
            headers: {
              AuthorizationSignature: c.signature,
              AuthorizationExpire: String(c.expiration_time),
              VideoId: c.video_id,
              LibraryId: String(c.library_id),
            },
            metadata: { filename: file.name, filetype: file.type },
            chunkSize: 5 * 1024 * 1024,
            onProgress: (bytesUploaded, bytesTotal) => {
              setProgress(bytesUploaded / bytesTotal);
            },
            onSuccess: () => resolve(),
            onError: (err) => {
              console.warn("TUS upload failed, continuing to confirm:", err);
              resolve();
            },
          });
          upload.start();
        });

        const confirm = await confirmVideoUpload(courseId, lessonId, item.id, c.video_id);
        if (!confirm.success) { return; }
        onComplete(confirm.data);
      } else {
        const urlResult = await requestUploadUrl(courseId, lessonId, item.id, file.name);
        if (!urlResult.success) { return; }
        await uploadToPresignedUrl(urlResult.data.url, file);
        setProgress(1);
        const confirm = await confirmUpload(courseId, lessonId, item.id, urlResult.data.key);
        if (!confirm.success) { return; }
        onComplete(confirm.data);
      }
    } finally {
      onUploadingChange(false);
      reset();
    }
  }, [type, file, uploading, courseId, lessonId, item.id, onComplete, onUploadingChange]);

  return (
    <div className="space-y-4">
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
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border bg-surface-muted/30 hover:bg-surface-muted/50"
          }`}
        >
          <Icon className="size-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">{t("drop_or_click")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {type === "video" ? t("video_accept") : t("document_accept")}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border bg-surface-muted/30 p-3">
          {type === "video" ? <Film className="size-5 shrink-0 text-muted-foreground" /> : <FileIcon className="size-5 shrink-0 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          {!uploading && (
            <Button size="icon" variant="ghost" className="size-6 shrink-0" onClick={reset}>
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      )}

      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>{t("uploading_progress")}</span>
            <span className="text-xs">({Math.round(progress * 100)}%)</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={uploading}>
          {t("cancel")}
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading} className="gap-1.5">
          {uploading ? (
            <><Loader2 className="size-3.5 animate-spin" /> {t("uploading")}</>
          ) : (
            <><Upload className="size-3.5" /> {t("upload")}</>
          )}
        </Button>
      </div>
    </div>
  );
}
