// src/features/coupons/components/coupon-edit-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUpdateCoupon } from "../hooks/use-coupon-queries";
import { updateCouponSchema } from "../schema";
import { listCoupons } from "../store";

type Props = {
  code: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CouponEditDialog({ code, open, onOpenChange, onSuccess }: Props) {
  const t = useTranslations("coupons");
  const [form, setForm] = useState({ type: "percentage", value: "", active: true, expires: "", maxUses: "", description: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const update = useUpdateCoupon();

  useEffect(() => {
    if (!code) return;
    const coupon = listCoupons().find((c) => c.code === code);
    if (!coupon) return;
    setForm({
      type: coupon.type,
      value: String(coupon.value),
      active: coupon.active,
      expires: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      maxUses: coupon.maxUses != null ? String(coupon.maxUses) : "",
      description: coupon.description ?? "",
    });
    setFieldErrors({});
    setFormError(null);
  }, [code, open]);

  const set = (key: keyof typeof form, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async () => {
    if (!code) return;
    setFieldErrors({});
    setFormError(null);
    const patch = {
      code,
      type: form.type,
      value: Number(form.value),
      active: form.active,
      expiresAt: form.expires ? new Date(`${form.expires}T00:00:00`).toISOString() : null,
      maxUses: form.maxUses.trim() === "" ? null : Number.parseInt(form.maxUses, 10),
      description: form.description,
    };
    const parsed = updateCouponSchema.safeParse(patch);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errors[key]) errors[key] = t(issue.message ?? "error_invalid");
      }
      setFieldErrors(errors);
      setFormError(t("error_invalid"));
      return;
    }
    try {
      await update.mutateAsync({ code, patch: parsed.data });
      toast.success(t("updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog_edit_title")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("code")}</span>
            <Badge variant="outline" className="font-mono font-bold">{code}</Badge>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-edit-type">{t("type")}</Label>
            <select
              id="coupon-edit-type"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="percentage">{t("type_percentage")}</option>
              <option value="fixed">{t("type_fixed")}</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-edit-value">{t("value")}</Label>
            <Input
              id="coupon-edit-value"
              type="number"
              min={1}
              value={form.value}
              onChange={(e) => set("value", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {form.type === "percentage" ? t("hint_percentage") : t("hint_fixed")}
            </p>
            {fieldErrors.value ? <p className="text-xs text-destructive">{fieldErrors.value}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="coupon-edit-active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="size-4 accent-primary"
            />
            <Label htmlFor="coupon-edit-active">{t("field_active")}</Label>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-edit-expires">{t("expires")}</Label>
            <Input
              id="coupon-edit-expires"
              type="date"
              value={form.expires}
              onChange={(e) => set("expires", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-edit-max">{t("field_max_uses")}</Label>
            <Input
              id="coupon-edit-max"
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => set("maxUses", e.target.value)}
            />
            {fieldErrors.maxUses ? <p className="text-xs text-destructive">{fieldErrors.maxUses}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-edit-desc">{t("field_description")}</Label>
            <Textarea
              id="coupon-edit-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
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
