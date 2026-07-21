"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Film, FileText, ClipboardList, File, Pencil, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateItem, uploadItemVideo, requestUploadUrl, confirmUpload } from "@/features/course-management/items-actions";
import { uploadToPresignedUrl } from "@/lib/upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UploadDialog } from "./upload-dialog";
import type { ItemOut } from "@/features/course-management/items-schema";

function itemType(item: ItemOut): { label: string; icon: React.ReactNode; bg: string } {
  if (item.bunny_stream_id) return { label: "type_video", icon: <Film className="size-3.5 text-white" />, bg: "bg-brand-indigo" };
  if (item.document_path) return { label: "type_document", icon: <FileText className="size-3.5 text-white" />, bg: "bg-brand-amber" };
  if (item.exam_id) return { label: "type_exam", icon: <ClipboardList className="size-3.5 text-white" />, bg: "bg-brand-rose" };
  return { label: "type_text", icon: <File className="size-3.5 text-white" />, bg: "bg-surface-strong" };
}

function itemStatus(item: ItemOut): { text: string; variant: "default" | "outline" | "secondary"; icon?: React.ReactNode } | null {
  if (item.bunny_stream_id || item.document_path) return { text: "جاهز", variant: "default" };
  if (item.exam_id) return { text: "امتحان", variant: "outline" };
  return null;
}

export function ItemCard({
  item,
  courseId,
  lessonId,
  onUpdate,
  onDelete,
}: {
  item: ItemOut;
  courseId: number;
  lessonId: number;
  onUpdate: (item: ItemOut) => void;
  onDelete: (itemId: number) => void;
}) {
  const t = useTranslations("items");
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDialogType, setUploadDialogType] = useState<"video" | "document">("video");
  const [editTitle, setEditTitle] = useState(item.title);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type = itemType(item);
  const status = itemStatus(item);

  const openUploadDialog = useCallback((uploadType: "video" | "document") => {
    setUploadDialogType(uploadType);
    setUploadDialogOpen(true);
  }, []);

  const handleVideoUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadItemVideo(courseId, lessonId, item.id, formData);
      if (result.success) {
        onUpdate(result.data);
        setUploadDialogOpen(false);
        toast.success(t("upload_success"));
      } else {
        toast.error(result.error.message || t("upload_error"));
      }
    } catch {
      toast.error(t("upload_error"));
    } finally {
      setUploading(false);
    }
  }, [courseId, lessonId, item.id, onUpdate, t]);

  const handleDocUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const urlResult = await requestUploadUrl(courseId, lessonId, item.id, file.name);
      if (!urlResult.success) { toast.error(urlResult.error.message || t("upload_error")); return; }
      await uploadToPresignedUrl(urlResult.data.url, file);
      const confirmResult = await confirmUpload(courseId, lessonId, item.id, urlResult.data.key);
      if (confirmResult.success) {
        onUpdate(confirmResult.data);
        setUploadDialogOpen(false);
        toast.success(t("upload_success"));
      } else {
        toast.error(confirmResult.error.message || t("upload_error"));
      }
    } catch {
      toast.error(t("upload_error"));
    } finally {
      setUploading(false);
    }
  }, [courseId, lessonId, item.id, onUpdate, t]);

  const handleSave = useCallback(async () => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await updateItem(courseId, item.id, { title: trimmed });
      if (result.success) {
        onUpdate(result.data);
        setEditOpen(false);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, item.id, editTitle, onUpdate]);

  const handleDelete = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { deleteItem } = await import("@/features/course-management/items-actions");
      const result = await deleteItem(courseId, item.id, lessonId);
      if (result.success) {
        onDelete(item.id);
        setDeleteOpen(false);
      } else {
        setError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [courseId, item.id, lessonId, onDelete]);

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 transition-colors hover:bg-surface-muted/30 group">

      <span className="inline-flex items-center justify-center size-[22px] rounded-md text-white shrink-0" title={t(type.label)}>
        {type.icon}
      </span>

      <span className="min-w-0 flex-1 text-sm text-foreground truncate">{item.title}</span>

      {status && (
        <Badge
          variant={status.variant}
          className={cn(
            status.variant === "default" && "bg-success-tint text-success border-success/20",
            status.variant === "secondary" && "bg-warning-tint text-warning border-warning/20",
          )}
        >
          {status.icon}
          {status.text}
        </Badge>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!item.bunny_stream_id && (
          <Button size="icon" variant="ghost" className="size-6" disabled={uploading} onClick={() => openUploadDialog("video")} aria-label={t("upload_video")} title={t("upload_video")}>
            <Upload className="size-3.5" />
          </Button>
        )}
        {!item.document_path && (
          <Button size="icon" variant="ghost" className="size-6" disabled={uploading} onClick={() => openUploadDialog("document")} aria-label={t("upload_document")} title={t("upload_document")}>
            <FileText className="size-3.5" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="size-6" onClick={() => { setEditTitle(item.title); setError(null); setEditOpen(true); }} aria-label={t("edit")}>
          <Pencil className="size-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="size-6" onClick={() => { setError(null); setDeleteOpen(true); }} aria-label={t("delete")}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        type={uploadDialogType}
        uploading={uploading}
        onUpload={uploadDialogType === "video" ? handleVideoUpload : handleDocUpload}
      />

      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if (!val) setError(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("edit")}</DialogTitle></DialogHeader>
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} disabled={submitting} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={submitting}>{t("cancel")}</Button>} />
            <Button onClick={handleSave} disabled={submitting}>{submitting ? t("saving") : t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(val) => { setDeleteOpen(val); if (!val) setError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>{t("delete_confirm")}</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={submitting}>{t("cancel")}</Button>} />
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? t("saving") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
