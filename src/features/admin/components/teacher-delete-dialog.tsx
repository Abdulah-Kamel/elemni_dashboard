"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTeacherMutations } from "@/features/admin/hooks/use-teachers-queries";

type Teacher = { id: number; name: string };

type Props = {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeacherDeleteDialog({ teacher, open, onOpenChange }: Props) {
  const t = useTranslations("admin");
  const { remove } = useTeacherMutations();

  const handleDelete = async () => {
    if (!teacher) return;
    try {
      await remove.mutateAsync(teacher.id);
      toast.success(t("deleted"));
      onOpenChange(false);
    } catch (err) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Error";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog_delete_title", { kind: t("title_teachers") })}</DialogTitle>
          <DialogDescription>
            {t("dialog_delete_confirm", { name: teacher?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-destructive">{t("dialog_delete_warning")}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={remove.isPending}>
            {t("btn_cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending} className="gap-1.5">
            {remove.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("dialog_confirm_delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
