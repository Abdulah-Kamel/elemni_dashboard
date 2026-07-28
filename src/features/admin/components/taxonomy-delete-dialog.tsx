"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTaxonomyMutations } from "@/features/admin/hooks/use-taxonomy-mutations";

type Item = { id: number; name: string };

type Props = {
  kind: "grades" | "streams" | "subjects";
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaxonomyDeleteDialog({ kind, item, open, onOpenChange }: Props) {
  const t = useTranslations("admin");
  const { remove } = useTaxonomyMutations(kind);

  const handleDelete = async () => {
    if (!item) return;
    try {
      const outcome = await remove.mutateAsync(item.id);
      if (outcome.success) {
        toast.success(t("deleted"));
        onOpenChange(false);
      } else {
        toast.error(outcome.error.message);
      }
    } catch (err) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Error";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog_delete_title", { kind: t(`title_${kind}`) })}</DialogTitle>
          <DialogDescription>
            {t("dialog_delete_confirm", { name: item?.name ?? "" })}
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
