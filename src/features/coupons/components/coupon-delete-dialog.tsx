// src/features/coupons/components/coupon-delete-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDeleteCoupon } from "../hooks/use-coupon-queries";

type Props = {
  code: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CouponDeleteDialog({ code, open, onOpenChange, onSuccess }: Props) {
  const t = useTranslations("coupons");
  const [formError, setFormError] = useState<string | null>(null);
  const del = useDeleteCoupon();

  const handleConfirm = async () => {
    if (!code) return;
    setFormError(null);
    try {
      await del.mutateAsync(code);
      toast.success(t("deleted"));
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
          <DialogTitle>{t("dialog_delete_title")}</DialogTitle>
          <DialogDescription>{t("delete_warning")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {t("delete_confirm")}{" "}
            <Badge variant="outline" className="font-mono font-bold">{code}</Badge>
          </p>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={del.isPending}>
            {t("btn_cancel")}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={del.isPending} className="gap-1.5">
            {del.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("btn_delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
