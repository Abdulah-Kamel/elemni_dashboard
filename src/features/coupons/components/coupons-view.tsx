// src/features/coupons/components/coupons-view.tsx
"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCoupons, useToggleCoupon } from "../hooks/use-coupon-queries";
import { deriveStatus, listCoupons } from "../store";
import type { Coupon } from "../schema";
import { CouponCreateDialog } from "./coupon-create-dialog";
import { CouponEditDialog } from "./coupon-edit-dialog";
import { CouponDeleteDialog } from "./coupon-delete-dialog";

export interface CouponsViewProps {
  onCreate?: () => void;
  onEdit?: (code: string) => void;
  onDelete?: (code: string) => void;
  onToggle?: (code: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  inactive: "bg-slate-500/10 text-slate-500",
  expired: "bg-red-500/10 text-red-600",
  exhausted: "bg-amber-500/10 text-amber-600",
};

const TYPE_STYLES: Record<string, string> = {
  percentage: "bg-blue-500/10 text-blue-600",
  fixed: "bg-green-500/10 text-green-600",
};

export function CouponsView({ onCreate, onEdit, onDelete, onToggle }: CouponsViewProps) {
  const t = useTranslations("coupons");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const toggle = useToggleCoupon();

  const handleCreate = onCreate ?? (() => setCreateOpen(true));
  const handleEdit = onEdit ?? ((code: string) => setEditCode(code));
  const handleDelete = onDelete ?? ((code: string) => setDeleteCode(code));
  const handleToggle = onToggle ?? ((code: string) => toggle.mutate(code));

  const { data: coupons, isLoading } = useCoupons(search, status, type);

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
  });

  // Synchronous first-render fallback (same filter as useCoupons): useQuery
  // resolves async even for sync queryFns, so data is undefined on mount.
  const fallback = useMemo(() => {
    const q = search.trim().toUpperCase();
    return listCoupons().filter((c) => {
      if (q && !c.code.includes(q)) return false;
      if (type !== "all" && c.type !== type) return false;
      if (status !== "all" && deriveStatus(c) !== status) return false;
      return true;
    });
  }, [search, status, type]);

  const rows = coupons ?? fallback;
  const showSkeleton = isLoading && coupons === undefined && fallback.length === 0;

  return (
    <>
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant="secondary">{rows.length}</Badge>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          {t("create")}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            aria-label={t("search_placeholder")}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label={t("status")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {["all", "active", "inactive", "expired", "exhausted"].map((s) => (
              <option key={s} value={s}>
                {t(`status_${s}`)}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label={t("type")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {["all", "percentage", "fixed"].map((ty) => (
              <option key={ty} value={ty}>
                {t(`type_${ty}`)}
              </option>
            ))}
          </select>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("value")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("expires")}</TableHead>
              <TableHead>{t("uses")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              [0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-8 text-center">
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((coupon) => (
                <CouponRow
                  key={coupon.code}
                  coupon={coupon}
                  t={t}
                  dateFormatter={dateFormatter}
                  currencyFormatter={currencyFormatter}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          {t("showing")} {rows.length}
        </p>
      </CardFooter>
    </Card>
    <CouponCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    <CouponEditDialog code={editCode} open={editCode !== null} onOpenChange={(o) => { if (!o) setEditCode(null); }} />
    <CouponDeleteDialog code={deleteCode} open={deleteCode !== null} onOpenChange={(o) => { if (!o) setDeleteCode(null); }} />
    </>
  );
}

function CouponRow({
  coupon,
  t,
  dateFormatter,
  currencyFormatter,
  onEdit,
  onDelete,
  onToggle,
}: {
  coupon: Coupon;
  t: (key: string) => string;
  dateFormatter: Intl.DateTimeFormat;
  currencyFormatter: Intl.NumberFormat;
  onEdit: (code: string) => void;
  onDelete: (code: string) => void;
  onToggle: (code: string) => void;
}) {
  const status = deriveStatus(coupon);
  const value =
    coupon.type === "percentage" ? `${coupon.value}%` : currencyFormatter.format(coupon.value);

  return (
    <TableRow>
      <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
      <TableCell>
        <Badge variant="outline" className={TYPE_STYLES[coupon.type]}>
          {t(`type_${coupon.type}`)}
        </Badge>
      </TableCell>
      <TableCell>{value}</TableCell>
      <TableCell>
        <Badge variant="outline" className={STATUS_STYLES[status]}>
          {t(`status_${status}`)}
        </Badge>
      </TableCell>
      <TableCell>
        {coupon.expiresAt ? dateFormatter.format(new Date(coupon.expiresAt)) : "—"}
      </TableCell>
      <TableCell>
        {coupon.usedCount}/{coupon.maxUses ?? "∞"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("edit")}
            onClick={() => onEdit(coupon.code)}
          >
            <Pencil className="size-4" />
          </Button>
          <button
            type="button"
            role="switch"
            aria-checked={coupon.active}
            aria-label={t("toggle")}
            onClick={() => onToggle(coupon.code)}
            className="relative h-5 w-9 rounded-full bg-muted transition-colors data-[checked=true]:bg-primary"
            data-checked={coupon.active}
          >
            <span
              className="absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform data-[on=true]:translate-x-4"
              data-on={coupon.active}
            />
          </button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("delete")}
            onClick={() => onDelete(coupon.code)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
