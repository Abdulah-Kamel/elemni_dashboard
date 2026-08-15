"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTaxonomyMutations } from "@/features/admin/hooks/use-taxonomy-mutations";
import { useTaxonomyQuery } from "@/features/admin/hooks/use-taxonomy-queries";

type Props = {
  kind: "grades" | "streams" | "subjects";
  fields: { key: string; labelKey: string; required?: boolean }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaxonomyCreateDialog({ kind, fields, open, onOpenChange }: Props) {
  const t = useTranslations("admin");
  const [data, setData] = useState<Record<string, unknown>>({});
  const { create } = useTaxonomyMutations(kind);
  const grades = useTaxonomyQuery("grades");
  const streams = useTaxonomyQuery("streams");
  const toggle = (key: "grade_ids" | "stream_ids", id: number) => setData((previous) => { const values = (previous[key] as number[] | undefined) ?? []; return { ...previous, [key]: values.includes(id) ? values.filter((value) => value !== id) : [...values, id] } });

  const handleSubmit = async () => {
    try {
      const outcome = await create.mutateAsync(data);
      if (outcome.success) {
        toast.success(t("created"));
        setData({});
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
          <DialogTitle>{t("dialog_create_title", { kind: t(`title_${kind}`) })}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          {fields.map((f) => (
            <Input
              key={f.key}
              placeholder={t(f.labelKey)}
              value={String(data[f.key] ?? "")}
              onChange={(e) => setData((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          ))}
          {kind === "subjects" && <><div><p className="mb-2 text-sm font-medium">{t("table_grades")}</p><div className="flex flex-wrap gap-2">{grades.data?.map((grade) => <Button type="button" size="sm" variant={(data.grade_ids as number[] | undefined)?.includes(grade.id) ? "default" : "outline"} key={grade.id} onClick={() => toggle("grade_ids", grade.id)}>{grade.name}</Button>)}</div></div><div><p className="mb-2 text-sm font-medium">{t("title_streams")}</p><div className="flex flex-wrap gap-2">{streams.data?.map((stream) => <Button type="button" size="sm" variant={(data.stream_ids as number[] | undefined)?.includes(stream.id) ? "default" : "outline"} key={stream.id} onClick={() => toggle("stream_ids", stream.id)}>{stream.name}</Button>)}</div></div></>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            {t("btn_cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending || fields.some((field) => field.required && !data[field.key]) || (kind === "subjects" && (!(data.grade_ids as number[] | undefined)?.length || !(data.stream_ids as number[] | undefined)?.length))} className="gap-1.5">
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("btn_create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
