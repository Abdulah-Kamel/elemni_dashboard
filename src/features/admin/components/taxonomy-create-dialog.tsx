"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTaxonomyMutations } from "@/features/admin/hooks/use-taxonomy-mutations";

type Props = {
  kind: "grades" | "streams" | "subjects";
  fields: { key: string; labelKey: string; required?: boolean }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaxonomyCreateDialog({ kind, fields, open, onOpenChange }: Props) {
  const t = useTranslations("admin");
  const [data, setData] = useState<Record<string, string>>({});
  const { create } = useTaxonomyMutations(kind);

  const handleSubmit = async () => {
    try {
      await create.mutateAsync(data);
      toast.success(t("created"));
      setData({});
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
          <DialogTitle>{t("dialog_create_title", { kind: t(`title_${kind}`) })}</DialogTitle>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            {t("btn_cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending} className="gap-1.5">
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("btn_create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
