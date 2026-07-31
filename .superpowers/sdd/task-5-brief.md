# Task 5: Create taxonomy modal dialogs (create, edit, delete)

**Files:**
- Create: `src/features/admin/components/taxonomy-create-dialog.tsx`
- Create: `src/features/admin/components/taxonomy-edit-dialog.tsx`
- Create: `src/features/admin/components/taxonomy-delete-dialog.tsx`

**Dependencies:** `useTaxonomyMutations(kind)` from Task 4, Dialog components from `@/components/ui/dialog`

## File 1: taxonomy-create-dialog.tsx

Props: `kind`, `fields`, `open`, `onOpenChange`

```tsx
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
```

## File 2: taxonomy-edit-dialog.tsx

Props: `kind`, `fields`, `item` (the row being edited), `open`, `onOpenChange`

```tsx
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
      await update.mutateAsync({ id: item.id, data });
      toast.success(t("updated"));
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
```

## File 3: taxonomy-delete-dialog.tsx

Props: `kind`, `item` (name shown for confirmation), `open`, `onOpenChange`

```tsx
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
      await remove.mutateAsync(item.id);
      toast.success(t("deleted"));
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
```

## Steps
- [ ] Create the 3 files with exact content above
- [ ] Run `npx tsc --noEmit` to verify
- [ ] Commit: `git add src/features/admin/components/taxonomy-create-dialog.tsx src/features/admin/components/taxonomy-edit-dialog.tsx src/features/admin/components/taxonomy-delete-dialog.tsx && git commit -m "feat: create taxonomy modal dialogs (create, edit, delete)"`
