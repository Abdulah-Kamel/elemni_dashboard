# Task 6: Create teacher modal dialogs (create, delete)

**Files:**
- Create: `src/features/admin/components/teacher-create-dialog.tsx`
- Create: `src/features/admin/components/teacher-delete-dialog.tsx`

## teacher-create-dialog.tsx

This is a modal version of the existing `create-teacher-form.tsx`. Key differences:
- No Link back buttons (dialog close replaces navigation)
- Uses `useTeacherMutations().create.mutateAsync()` instead of direct `createTeacher()` call
- Fetches subjects/grades on dialog open via `handleOpen`
- Result panel shown inline in dialog instead of replacing page view

Props: `{ open: boolean; onOpenChange: (open: boolean) => void }`

Complete code is in the plan at `docs/superpowers/plans/2026-07-28-admin-modal-crud-react-query.md` Task 6 Step 1.

Read that file for the exact code.

## teacher-delete-dialog.tsx

Props: `{ teacher: { id: number; name: string } | null; open: boolean; onOpenChange: (open: boolean) => void }`

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Teacher = { id: number; name: string };

type Props = {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeacherDeleteDialog({ teacher, open, onOpenChange }: Props) {
  const t = useTranslations("admin");

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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("btn_cancel")}
          </Button>
          <Button variant="destructive" onClick={() => onOpenChange(false)}>
            {t("dialog_confirm_delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Steps
- [ ] Create teacher-create-dialog.tsx (code from plan file Task 6 Step 1)
- [ ] Create teacher-delete-dialog.tsx (code above)
- [ ] Run `npx tsc --noEmit`
- [ ] Commit
