"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTaxonomyMutations } from "@/features/admin/hooks/use-taxonomy-mutations";

type Item = { id: number; name: string; slug?: string; level?: string };

type Props = {
  kind: "grades" | "streams" | "subjects";
  fields: { key: string; labelKey: string; required?: boolean }[];
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaxonomyEditDialog({ kind, fields, item, open, onOpenChange }: Props) {
  const t = useTranslations("admin");
  const [data, setData] = useState<Record<string, string>>({});
  const { update } = useTaxonomyMutations(kind);

  useEffect(() => {
    if (item) {
      setData(Object.fromEntries(fields.map((f) => [f.key, String(item[f.key as keyof Item] ?? "")])));
    }
  }, [item, fields]);

  const handleSubmit = async () => {
    if (!item) return;
    try {
      const outcome = await update.mutateAsync({ id: item.id, data });
      if (outcome.success) {
        toast.success(t("updated"));
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
          <DialogTitle>{t("dialog_edit_title", { kind: t(`title_${kind}`) })}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          {fields.map((f) => (
            <Input
              key={f.key}
              placeholder={t(f.labelKey)}
              value={data[f.key] ?? ""}
              onChange={(e) => setData((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            {t("btn_cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={update.isPending} className="gap-1.5">
            {update.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("btn_save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
