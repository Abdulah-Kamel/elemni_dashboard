# Task 7: Refactor TaxonomyManager to use React Query + dialogs

**Files:**
- Modify: `src/features/admin/components/taxonomy-manager.tsx`

Replace the entire file with this:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Placeholder } from "@/features/shell/components/placeholder";
import { useTaxonomyQuery } from "@/features/admin/hooks/use-taxonomy-queries";
import { TaxonomyCreateDialog } from "@/features/admin/components/taxonomy-create-dialog";
import { TaxonomyEditDialog } from "@/features/admin/components/taxonomy-edit-dialog";
import { TaxonomyDeleteDialog } from "@/features/admin/components/taxonomy-delete-dialog";

type Item = { id: number; name: string; slug?: string; level?: string };

type Props = {
  kind: "grades" | "streams" | "subjects";
  titleKey: string;
  fields: { key: string; labelKey: string; required?: boolean }[];
};

export function TaxonomyManager({ kind, titleKey, fields }: Props) {
  const t = useTranslations("admin");
  const { data, isLoading, isError } = useTaxonomyQuery(kind);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return <Placeholder state="error" />;
  }

  const items = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-md text-headline-md--line-height font-semibold text-foreground">
          {t(titleKey)}
        </h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          {t("btn_new")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-start text-label-sm text-label-sm--line-height font-semibold text-on-surface-muted">
              {fields.map((f) => (
                <th key={f.key} className="px-4 py-3">{t(f.labelKey)}</th>
              ))}
              <th className="px-4 py-3 text-end">{t("table_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted/30">
                {fields.map((f) => (
                  <td key={f.key} className="px-4 py-3 text-foreground">
                    {item[f.key as keyof Item] ?? "—"}
                  </td>
                ))}
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditItem(item)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => setDeleteItem(item)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TaxonomyCreateDialog kind={kind} fields={fields} open={createOpen} onOpenChange={setCreateOpen} />
      <TaxonomyEditDialog kind={kind} fields={fields} item={editItem} open={!!editItem} onOpenChange={() => setEditItem(null)} />
      <TaxonomyDeleteDialog kind={kind} item={deleteItem} open={!!deleteItem} onOpenChange={() => setDeleteItem(null)} />
    </div>
  );
}
```

## Steps
- [ ] Read the current file
- [ ] Replace with the new content above
- [ ] Run `npx tsc --noEmit`
- [ ] Commit: `git add src/features/admin/components/taxonomy-manager.tsx && git commit -m "refactor: TaxonomyManager uses React Query + modal dialogs"`
