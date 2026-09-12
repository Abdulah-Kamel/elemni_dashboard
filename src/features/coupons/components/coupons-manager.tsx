// src/features/coupons/components/coupons-manager.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CouponsView } from "./coupons-view";
import { CouponCreateDialog } from "./coupon-create-dialog";
import { CouponEditDialog } from "./coupon-edit-dialog";
import { CouponDeleteDialog } from "./coupon-delete-dialog";
import { useToggleCoupon } from "../hooks/use-coupon-queries";

export function CouponsManager() {
  const t = useTranslations("coupons");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const toggle = useToggleCoupon();

  const handleToggle = (code: string) => {
    toggle.mutate(code, {
      onSuccess: () => toast.success(t("toggled")),
    });
  };

  return (
    <>
      <CouponsView
        onCreate={() => setCreateOpen(true)}
        onEdit={setEditCode}
        onDelete={setDeleteCode}
        onToggle={handleToggle}
      />
      <CouponCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CouponEditDialog
        key={editCode}
        code={editCode}
        open={editCode !== null}
        onOpenChange={(o) => {
          if (!o) setEditCode(null);
        }}
      />
      <CouponDeleteDialog
        code={deleteCode}
        open={deleteCode !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteCode(null);
        }}
      />
    </>
  );
}
