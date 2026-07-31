"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Film, FileText, Loader2, ArrowRight, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { createItem } from "@/features/course-management/items-actions";
import { ItemUploadFlow } from "./item-upload-flow";
import type { ItemOut } from "@/features/course-management/items-schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  lessonId: number;
  onCreated: (item: ItemOut) => void;
};

const UPLOAD_TYPES = [
  { type: "video" as const, icon: Film, key: "type_video" },
  { type: "document" as const, icon: FileText, key: "type_document" },
];

export function CreateItemDialog({
  open,
  onOpenChange,
  courseId,
  lessonId,
  onCreated,
}: Props) {
  const t = useTranslations("items");
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdItem, setCreatedItem] = useState<ItemOut | null>(null);
  const [uploadType, setUploadType] = useState<"video" | "document" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep(1);
    setTitle("");
    setCreatedItem(null);
    setUploadType(null);
    setError(null);
    setUploading(false);
  }, []);

  const handleNext = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    try {
      const result = await createItem(courseId, lessonId, { title: trimmed });
      if (result.success) {
        setCreatedItem(result.data);
        setStep(2);
      } else {
        setError(result.error.message);
      }
    } finally {
      setCreating(false);
    }
  }, [courseId, lessonId, title]);

  const handleBack = useCallback(() => {
    if (uploadType) {
      setUploadType(null);
    } else {
      setStep(1);
    }
  }, [uploadType]);

  const handleComplete = useCallback((item: ItemOut) => {
    onCreated(item);
    toast.success(t("item_created"));
    reset();
    onOpenChange(false);
  }, [onCreated, reset, onOpenChange, t]);

  const handleSkip = useCallback(() => {
    if (createdItem) handleComplete(createdItem);
  }, [createdItem, handleComplete]);

  const handleClose = useCallback(() => {
    if (createdItem) onCreated(createdItem);
    reset();
    onOpenChange(false);
  }, [createdItem, onCreated, reset, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 1 ? t("create") : t("choose_type")}</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("create_placeholder")}
              disabled={creating}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={creating}>
                {t("cancel")}
              </Button>
              <Button onClick={handleNext} disabled={creating || !title.trim()} className="gap-1.5">
                {creating ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              </Button>
            </div>
          </div>
        ) : createdItem && !uploadType ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {UPLOAD_TYPES.map(({ type: ut, icon: Icon, key }) => (
                <button
                  key={ut}
                  type="button"
                  onClick={() => setUploadType(ut)}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-border bg-surface-muted/20 p-6 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <Icon className="size-10 text-muted-foreground" />
                  <span className="text-sm font-medium">{t(key)}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleSkip}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
                Skip
              </button>
              <Button variant="ghost" onClick={handleBack} className="gap-1">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : createdItem && uploadType ? (
          <ItemUploadFlow
            type={uploadType}
            item={createdItem}
            courseId={courseId}
            lessonId={lessonId}
            uploading={uploading}
            onUploadingChange={setUploading}
            onComplete={handleComplete}
            onClose={handleClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
