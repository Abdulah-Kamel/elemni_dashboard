// src/features/coupons/components/coupon-create-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateCoupon } from "../hooks/use-coupon-queries";
import { createCouponSchema } from "../schema";
import { listCoupons } from "../store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const EMPTY = { code: "", type: "percentage", value: "", active: true, expires: "", maxUses: "", description: "" };

export function CouponCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const t = useTranslations("coupons");
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const create = useCreateCoupon();

  const set = (key: keyof typeof EMPTY, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const reset = () => {
    setForm(EMPTY);
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    setFormError(null);
    const code = form.code.trim().toUpperCase();
    if (listCoupons().some((c) => c.code === code)) {
      setFormError(t("error_duplicate"));
      setFieldErrors({ code: t("error_duplicate") });
      return;
    }
    const payload = {
      code,
      type: form.type,
      value: Number(form.value),
      active: form.active,
      expiresAt: form.expires ? new Date(`${form.expires}T00:00:00`).toISOString() : null,
      maxUses: form.maxUses.trim() === "" ? null : Number.parseInt(form.maxUses, 10),
      description: form.description,
    };
    const parsed = createCouponSchema.safeParse(payload);
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
      await create.mutateAsync(parsed.data);
      toast.success(t("created"));
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      if (msg.includes("duplicate")) {
        setFormError(t("error_duplicate"));
        setFieldErrors({ code: t("error_duplicate") });
      } else {
        setFormError(msg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog_create_title")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-code">{t("code")}</Label>
            <Input
              id="coupon-code"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="SAVE20"
            />
            {fieldErrors.code ? <p className="text-xs text-destructive">{fieldErrors.code}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-type">{t("type")}</Label>
            <select
              id="coupon-type"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="percentage">{t("type_percentage")}</option>
              <option value="fixed">{t("type_fixed")}</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-value">{t("value")}</Label>
            <Input
              id="coupon-value"
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
              id="coupon-active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="size-4 accent-primary"
            />
            <Label htmlFor="coupon-active">{t("field_active")}</Label>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-expires">{t("expires")}</Label>
            <Input
              id="coupon-expires"
              type="date"
              value={form.expires}
              onChange={(e) => set("expires", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-max">{t("field_max_uses")}</Label>
            <Input
              id="coupon-max"
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => set("maxUses", e.target.value)}
            />
            {fieldErrors.maxUses ? <p className="text-xs text-destructive">{fieldErrors.maxUses}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coupon-desc">{t("field_description")}</Label>
            <Textarea
              id="coupon-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
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
