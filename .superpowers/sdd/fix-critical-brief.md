# Fix all Critical findings from final review

## Fix 1: TeacherDeleteDialog should actually delete (C1)

Replace `src/features/admin/components/teacher-delete-dialog.tsx` with a functional version:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTeacherMutations } from "@/features/admin/hooks/use-teachers-queries";

type Teacher = { id: number; name: string };

type Props = {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeacherDeleteDialog({ teacher, open, onOpenChange }: Props) {
  const t = useTranslations("admin");
  const { remove } = useTeacherMutations();

  const handleDelete = async () => {
    if (!teacher) return;
    try {
      await remove.mutateAsync(teacher.id);
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
          <DialogTitle>{t("dialog_delete_title", { kind: t("title_teachers") })}</DialogTitle>
          <DialogDescription>
            {t("dialog_delete_confirm", { name: teacher?.name ?? "" })}
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

Also add the `remove` mutation to `useTeacherMutations` in `src/features/admin/hooks/use-teachers-queries.ts`:

```ts
import { deleteTeacher } from "@/features/admin/actions";

// Add to the return:
const remove = useMutation({
  mutationFn: (id: number) => deleteTaxonomyItem("TEMP", id), // TODO: add deleteTeacher action when backend supports it
  onSuccess: invalidate,
});
```

Actually, `deleteTeacher` doesn't exist as a server action yet. Create it in `src/features/admin/actions.ts`:

```ts
export async function deleteTeacher(id: number): Promise<ActionResult<void>> {
  const start = performance.now();
  logger.action("deleteTeacher", { id });
  try {
    await apiFetch(`/api/v1/admin/teachers/${id}`, z.void(), { method: "DELETE" });
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("deleteTeacher", { id }, elapsed);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    return handleActionResultErr(err, elapsed, "deleteTeacher");
  }
}
```

Then use it in the hook:
```ts
const remove = useMutation({
  mutationFn: (id: number) => deleteTeacher(id),
  onSuccess: invalidate,
});
```

Also add the delete mutation export to use-teachers-queries.ts:
```ts
return { create, remove };
```

Also add a delete button to each teacher row in `src/features/admin/components/teachers-list.tsx` so the dialog can be triggered.

## Fix 2: Taxonomy dialogs must check ActionResult.success (C2)

In `src/features/admin/components/taxonomy-create-dialog.tsx`, change the handleSubmit:

```tsx
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
```

In `src/features/admin/components/taxonomy-edit-dialog.tsx`, change handleSubmit:

```tsx
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
```

In `src/features/admin/components/taxonomy-delete-dialog.tsx`, change handleDelete:

```tsx
const handleDelete = async () => {
  if (!item) return;
  try {
    const outcome = await remove.mutateAsync(item.id);
    if (outcome.success) {
      toast.success(t("deleted"));
      onOpenChange(false);
    } else {
      toast.error(outcome.error.message);
    }
  } catch (err) {
    const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Error";
    toast.error(msg);
  }
};
```

## Fix 3: Use listTeachers (public) instead of listAdminTeachers (C3)

In `src/features/admin/actions.ts`, change the import and return type:

```ts
import { listTeachers as listTeachersQuery } from "@/features/admin/queries";
import type { PublicTeacherOut } from "@/features/admin/schema";

export async function listTeachersAction(): Promise<PublicTeacherOut[]> {
  return listTeachersQuery();
}
```

## Steps
- [ ] Apply Fix 1 (delete dialog + deleteTeacher action + hook + delete button in table)
- [ ] Apply Fix 2 (check outcome.success in 3 taxonomy dialogs)
- [ ] Apply Fix 3 (use listTeachers instead of listAdminTeachers)
- [ ] Run `npx tsc --noEmit`
- [ ] Run `npx vitest run`
- [ ] Commit
