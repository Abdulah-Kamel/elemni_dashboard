"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Teacher = { id: number; name: string };

type Props = {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeacherDeleteDialog({ teacher, open, onOpenChange }: Props) {
  const t = useTranslations("admin");

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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("btn_cancel")}
          </Button>
          <Button variant="destructive" onClick={() => onOpenChange(false)}>
            {t("dialog_confirm_delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
