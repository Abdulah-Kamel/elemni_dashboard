# Admin Modal CRUD + React Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inline CRUD with modal dialogs and React Query for the admin dashboard taxonomy and teacher management.

**Architecture:** Install `@tanstack/react-query`, set up a global QueryProvider, create React Query hooks (useTaxonomyQuery, useTaxonomyMutations, useTeachersQuery, useTeacherMutations), build 5 modal dialog components, refactor TaxonomyManager and TeachersList to use them, and simplify admin pages to thin shells.

**Tech Stack:** Next.js 16, React 19, @tanstack/react-query, @base-ui/react/dialog, sonner toast, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-07-28-admin-modal-crud-react-query-design.md`

## Global Constraints

- Use existing `@/components/ui/dialog` (built on @base-ui/react/dialog) for all modals
- Use existing `toast.success()` / `toast.error()` from sonner
- Server actions remain `"use server"` — React Query calls them as queryFn/mutationFn
- Remove `revalidateTag` from admin actions (React Query's `invalidateQueries` replaces it)
- Keep `revalidateTag` in course-management actions (unchanged)
- Follow existing file naming patterns in `src/features/admin/`
- All new client components marked `"use client"`
- i18n keys in `admin` namespace for both en.json and ar.json

---

### Task 1: Install @tanstack/react-query and create QueryProvider

**Files:**
- Modify: `package.json`
- Create: `src/providers/query-provider.tsx`

**Interfaces:**
- Produces: `QueryProvider` (client component wrapping `<QueryClientProvider>`)

- [ ] **Step 1: Install @tanstack/react-query**

```bash
npm install @tanstack/react-query
```

- [ ] **Step 2: Create QueryProvider**

`src/providers/query-provider.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json src/providers/query-provider.tsx
git commit -m "feat: add @tanstack/react-query and QueryProvider"
```

---

### Task 2: Add QueryProvider to root layout and create query keys

**Files:**
- Modify: `app/[locale]/layout.tsx`
- Create: `src/features/admin/query-keys.ts`

**Interfaces:**
- Consumes: `QueryProvider` from Task 1

- [ ] **Step 1: Wrap children in QueryProvider**

In `app/[locale]/layout.tsx`, add the import and wrap children:

```tsx
import { QueryProvider } from "@/providers/query-provider";

// Inside the return:
<NextIntlClientProvider messages={messages}>
  <QueryProvider>{children}</QueryProvider>
</NextIntlClientProvider>
```

- [ ] **Step 2: Create query keys file**

`src/features/admin/query-keys.ts`:

```ts
export const adminKeys = {
  all: ["admin"] as const,
  teachers: ["admin", "teachers"] as const,
  taxonomy: (kind: string) => ["admin", kind] as const,
};
```

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/layout.tsx src/features/admin/query-keys.ts
git commit -m "feat: add QueryProvider to root layout and admin query keys"
```

---

### Task 3: Add server action wrappers and remove revalidateTag

**Files:**
- Modify: `src/features/admin/actions.ts`

**Interfaces:**
- Produces: `listTeachersAction()` — returns `Promise<AdminTeacherListItem[]>`

- [ ] **Step 1: Add import and wrapper**

```ts
import { listTeachers as listTeachersQuery } from "@/features/admin/queries";

export async function listTeachersAction(): Promise<AdminTeacherListItem[]> {
  return listTeachersQuery();
}
```

Remove `revalidateTag("teachers:all", "default")` from `createTeacher` and `revalidateTag(`${kind}:all`, "default")` from `createTaxonomyItem`, `updateTaxonomyItem`, `deleteTaxonomyItem`.

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/actions.ts
git commit -m "feat: add listTeachersAction, remove revalidateTag from admin actions"
```

---

### Task 4: Create React Query hooks

**Files:**
- Create: `src/features/admin/hooks/use-taxonomy-queries.ts`
- Create: `src/features/admin/hooks/use-taxonomy-mutations.ts`
- Create: `src/features/admin/hooks/use-teachers-queries.ts`

- [ ] **Step 1: Create `use-taxonomy-queries.ts`**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { listSubjectsAction, listGradesAction, listStreamsAction } from "@/features/course-management/actions";

type TaxonomyKind = "grades" | "streams" | "subjects";

export function useTaxonomyQuery(kind: TaxonomyKind) {
  return useQuery({
    queryKey: adminKeys.taxonomy(kind),
    queryFn: () => {
      if (kind === "subjects") return listSubjectsAction();
      if (kind === "grades") return listGradesAction();
      return listStreamsAction();
    },
  });
}
```

- [ ] **Step 2: Create `use-taxonomy-mutations.ts`**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { createTaxonomyItem, updateTaxonomyItem, deleteTaxonomyItem } from "@/features/admin/actions";

type TaxonomyKind = "grades" | "streams" | "subjects";

export function useTaxonomyMutations(kind: TaxonomyKind) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: adminKeys.taxonomy(kind) });

  const create = useMutation({
    mutationFn: (data: Record<string, string>) => createTaxonomyItem(kind, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, string> }) =>
      updateTaxonomyItem(kind, id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteTaxonomyItem(kind, id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
```

- [ ] **Step 3: Create `use-teachers-queries.ts`**

```ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { listTeachersAction, createTeacher } from "@/features/admin/actions";

export function useTeachersQuery() {
  return useQuery({
    queryKey: adminKeys.teachers,
    queryFn: () => listTeachersAction(),
  });
}

export function useTeacherMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: adminKeys.teachers });

  const create = useMutation({
    mutationFn: (data: unknown) => createTeacher(data),
    onSuccess: invalidate,
  });

  return { create };
}
```

- [ ] **Step 4: Verify typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/hooks/
git commit -m "feat: create React Query hooks for admin (taxonomy + teachers)"
```

---

### Task 5: Create taxonomy modal dialogs

**Files:**
- Create: `src/features/admin/components/taxonomy-create-dialog.tsx`
- Create: `src/features/admin/components/taxonomy-edit-dialog.tsx`
- Create: `src/features/admin/components/taxonomy-delete-dialog.tsx`

- [ ] **Step 1: Create `taxonomy-create-dialog.tsx`**

See spec Section 3 for props and behavior. Full component:

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

- [ ] **Step 2: Create `taxonomy-edit-dialog.tsx`**

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

- [ ] **Step 3: Create `taxonomy-delete-dialog.tsx`**

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

- [ ] **Step 4: Verify typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/taxonomy-create-dialog.tsx src/features/admin/components/taxonomy-edit-dialog.tsx src/features/admin/components/taxonomy-delete-dialog.tsx
git commit -m "feat: create taxonomy modal dialogs (create, edit, delete)"
```

---

### Task 6: Create teacher modal dialogs

**Files:**
- Create: `src/features/admin/components/teacher-create-dialog.tsx`
- Create: `src/features/admin/components/teacher-delete-dialog.tsx`

- [ ] **Step 1: Create `teacher-create-dialog.tsx`**

Port the form from `create-teacher-form.tsx` into a Dialog. Key differences from the old form:
- No `Link` to `/admin/teachers` (dialog close replaces navigation)
- Uses `useTeacherMutations().create` instead of calling `createTeacher` directly
- Fetches subjects/grades on dialog open via `handleOpen`
- Result panel shown inline in the dialog instead of replacing the page view

```tsx
"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { listSubjectsAction, listGradesAction } from "@/features/course-management/actions";
import { useTeacherMutations } from "@/features/admin/hooks/use-teachers-queries";
import { sendSetPasswordEmail } from "@/features/admin/actions";
import type { SubjectOut, GradeOut } from "@/features/course-management/schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeacherCreateDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("admin");
  const [subjects, setSubjects] = useState<SubjectOut[]>([]);
  const [grades, setGrades] = useState<GradeOut[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<Record<string, string | number | boolean | number[]>>({
    name: "", email: "", phone_number: "", location: "", estimated_students: "", experience: "",
    cost_value: "", cost_type: "", current_platform: "", social_media: "", interest_level: "",
    call_status: "", call_date: "", follow_up_date: "", follow_up_count: 0, demo_scheduled: "",
    signed_up: false, next_step: "", closed: false, feedback: "", description: "",
    subject_ids: [] as number[], grade_ids: [] as number[],
  });
  const [result, setResult] = useState<{ id: number; name: string; slug: string; email: string } | null>(null);
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  const { create } = useTeacherMutations();

  const set = useCallback((key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleArray = useCallback((key: string, id: number) => {
    setForm((prev) => {
      const arr = (prev[key] as number[]) ?? [];
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      return { ...prev, [key]: next };
    });
  }, []);

  const handleOpen = useCallback(async () => {
    if (!loaded) {
      const [s, g] = await Promise.all([listSubjectsAction(), listGradesAction()]);
      setSubjects(s);
      setGrades(g);
      setLoaded(true);
    }
  }, [loaded]);

  const handleSubmit = async () => {
    try {
      const payload: Record<string, unknown> = { ...form };
      for (const k of ["estimated_students", "experience", "cost_value", "follow_up_count"]) {
        if (payload[k] === "" || payload[k] === undefined) payload[k] = null;
        else payload[k] = Number(payload[k]);
      }
      for (const k of ["phone_number", "location", "cost_type", "current_platform", "social_media", "interest_level", "call_status", "call_date", "follow_up_date", "demo_scheduled", "next_step", "feedback", "description"]) {
        if (payload[k] === "") payload[k] = null;
      }
      const outcome = await create.mutateAsync(payload);
      setResult(outcome.data);
      toast.success(t("result_created"));
    } catch (err) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Error";
      toast.error(msg);
    }
  };

  const handleInvite = async () => {
    if (!result) return;
    setInviting(true);
    try {
      await sendSetPasswordEmail(result.id);
      setInvited(true);
      toast.success(t("result_invite_sent"));
    } catch {
      toast.error(t("error_upstream"));
    } finally {
      setInviting(false);
    }
  };

  const labelClass = "block text-sm font-medium text-on-surface-muted mb-1";
  const sectionClass = "space-y-3";

  if (result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[36rem]">
          <DialogHeader>
            <DialogTitle>{t("result_created")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 text-sm">
            <p><span className="text-on-surface-muted">{t("table_name")}:</span> {result.name}</p>
            <p><span className="text-on-surface-muted">{t("table_email")}:</span> {result.email}</p>
            <p><span className="text-on-surface-muted">{t("table_slug")}:</span> {result.slug}</p>
          </div>
          <DialogFooter>
            {!invited && (
              <Button onClick={handleInvite} disabled={inviting} className="gap-1.5">
                {inviting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                {t("btn_send_invite")}
              </Button>
            )}
            <Button variant="outline" onClick={() => { setResult(null); setForm({ ...form, name: "", email: "" }); onOpenChange(false); }}>
              {t("btn_cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) handleOpen(); }}>
      <DialogContent className="sm:max-w-[36rem] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title_new_teacher")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_basic_info")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>{t("field_name")} *</label>
                <Input value={form.name as string} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{t("field_email")} *</label>
                <Input value={form.email as string} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{t("field_phone")}</label>
                <Input value={form.phone_number as string} onChange={(e) => set("phone_number", e.target.value)} />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_assignment")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t("field_subject_ids")}</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <button key={s.id} type="button" onClick={() => toggleArray("subject_ids", s.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${(form.subject_ids as number[]).includes(s.id) ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-on-surface-muted border-border hover:border-primary"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("field_grade_ids")}</label>
                <div className="flex flex-wrap gap-2">
                  {grades.map((g) => (
                    <button key={g.id} type="button" onClick={() => toggleArray("grade_ids", g.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${(form.grade_ids as number[]).includes(g.id) ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-on-surface-muted border-border hover:border-primary"}`}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_crm")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className={labelClass}>{t("field_location")}</label><Input value={form.location as string} onChange={(e) => set("location", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_estimated_students")}</label><Input type="number" value={form.estimated_students as string} onChange={(e) => set("estimated_students", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_experience")}</label><Input type="number" value={form.experience as string} onChange={(e) => set("experience", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_cost_value")}</label><Input type="number" value={form.cost_value as string} onChange={(e) => set("cost_value", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_cost_type")}</label><Input value={form.cost_type as string} onChange={(e) => set("cost_type", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_current_platform")}</label><Input value={form.current_platform as string} onChange={(e) => set("current_platform", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_social_media")}</label><Input value={form.social_media as string} onChange={(e) => set("social_media", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_interest_level")}</label><Input value={form.interest_level as string} onChange={(e) => set("interest_level", e.target.value)} /></div>
            </div>
          </div>

          <hr className="border-border" />

          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_pipeline")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className={labelClass}>{t("field_call_status")}</label><Input value={form.call_status as string} onChange={(e) => set("call_status", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_call_date")}</label><Input type="date" value={form.call_date as string} onChange={(e) => set("call_date", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_follow_up_date")}</label><Input type="date" value={form.follow_up_date as string} onChange={(e) => set("follow_up_date", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_follow_up_count")}</label><Input type="number" value={form.follow_up_count as number} onChange={(e) => set("follow_up_count", parseInt(e.target.value) || 0)} /></div>
              <div><label className={labelClass}>{t("field_demo_scheduled")}</label><Input type="date" value={form.demo_scheduled as string} onChange={(e) => set("demo_scheduled", e.target.value)} /></div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.signed_up} onChange={(e) => set("signed_up", e.target.checked)} /> {t("field_signed_up")}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.closed} onChange={(e) => set("closed", e.target.checked)} /> {t("field_closed")}</label>
              </div>
              <div><label className={labelClass}>{t("field_next_step")}</label><Input value={form.next_step as string} onChange={(e) => set("next_step", e.target.value)} /></div>
            </div>
          </div>

          <hr className="border-border" />

          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_notes")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className={labelClass}>{t("field_feedback")}</label><textarea value={form.feedback as string} onChange={(e) => set("feedback", e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors resize-none" /></div>
              <div><label className={labelClass}>{t("field_description")}</label><textarea value={form.description as string} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors resize-none" /></div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setResult(null); onOpenChange(false); }}>{t("btn_cancel")}</Button>
          <Button onClick={handleSubmit} disabled={create.isPending || !form.name || !form.email} className="gap-1.5">
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("btn_create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `teacher-delete-dialog.tsx`**

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

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/teacher-create-dialog.tsx src/features/admin/components/teacher-delete-dialog.tsx
git commit -m "feat: create teacher modal dialogs (create, delete)"
```

---

### Task 7: Refactor TaxonomyManager to use React Query + dialogs

**Files:**
- Modify: `src/features/admin/components/taxonomy-manager.tsx`

- [ ] **Step 1: Rewrite TaxonomyManager**

Replace the entire file content with:

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

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/components/taxonomy-manager.tsx
git commit -m "refactor: TaxonomyManager uses React Query + modal dialogs"
```

---

### Task 8: Refactor TeachersList to use React Query

**Files:**
- Modify: `src/features/admin/components/teachers-list.tsx`

- [ ] **Step 1: Rewrite TeachersList**

Replace with a version that fetches its own data via `useTeachersQuery()` and opens `TeacherCreateDialog` / `TeacherDeleteDialog` modals. Key changes from the previous version:
- No `teachers` prop
- Calls `useTeachersQuery()` for data
- "New Teacher" button opens `<TeacherCreateDialog>` instead of navigating to `/admin/teachers/new`
- Loading skeleton and error placeholder states
- Search + pagination operates on `data` from query

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/components/teachers-list.tsx
git commit -m "refactor: TeachersList uses React Query + modal dialogs"
```

---

### Task 9: Simplify admin pages

**Files:**
- Modify: `app/[locale]/(admin)/admin/teachers/page.tsx`
- Modify: `app/[locale]/(admin)/admin/grades/page.tsx`
- Modify: `app/[locale]/(admin)/admin/streams/page.tsx`
- Modify: `app/[locale]/(admin)/admin/subjects/page.tsx`

- [ ] **Step 1: Simplify each page**

`teachers/page.tsx`:
```tsx
import { setRequestLocale } from "next-intl/server";
import { verifySession } from "@/lib/auth/dal";
import { TeachersList } from "@/features/admin/components/teachers-list";
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager";

export const dynamic = "force-dynamic";

export default async function TeachersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await verifySession();
  if (!user) return null;

  return (
    <div className="space-y-10">
      <TeachersList />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaxonomyManager kind="subjects" titleKey="title_subjects" fields={[{ key: "name", labelKey: "table_name", required: true }, { key: "slug", labelKey: "table_slug" }]} />
        <TaxonomyManager kind="grades" titleKey="title_grades" fields={[{ key: "name", labelKey: "table_name", required: true }, { key: "level", labelKey: "table_level" }]} />
      </div>
    </div>
  );
}
```

`grades/page.tsx`:
```tsx
import { setRequestLocale } from "next-intl/server";
import { verifySession } from "@/lib/auth/dal";
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager";

export const dynamic = "force-dynamic";

export default async function GradesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await verifySession();
  if (!user) return null;

  return (
    <TaxonomyManager kind="grades" titleKey="title_grades" fields={[{ key: "name", labelKey: "table_name", required: true }, { key: "level", labelKey: "table_level" }]} />
  );
}
```

`streams/page.tsx`:
```tsx
import { setRequestLocale } from "next-intl/server";
import { verifySession } from "@/lib/auth/dal";
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager";

export const dynamic = "force-dynamic";

export default async function StreamsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await verifySession();
  if (!user) return null;

  return (
    <TaxonomyManager kind="streams" titleKey="title_streams" fields={[{ key: "name", labelKey: "table_name", required: true }, { key: "slug", labelKey: "table_slug" }]} />
  );
}
```

`subjects/page.tsx`:
```tsx
import { setRequestLocale } from "next-intl/server";
import { verifySession } from "@/lib/auth/dal";
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager";

export const dynamic = "force-dynamic";

export default async function SubjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await verifySession();
  if (!user) return null;

  return (
    <TaxonomyManager kind="subjects" titleKey="title_subjects" fields={[{ key: "name", labelKey: "table_name", required: true }, { key: "slug", labelKey: "table_slug" }]} />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/(admin)/admin/teachers/page.tsx app/[locale]/(admin)/admin/grades/page.tsx app/[locale]/(admin)/admin/streams/page.tsx app/[locale]/(admin)/admin/subjects/page.tsx
git commit -m "refactor: simplify admin pages to thin shells"
```

---

### Task 10: Delete old files and add i18n keys

**Files:**
- Delete: `src/features/admin/components/create-teacher-form.tsx`
- Delete: `app/[locale]/(admin)/admin/teachers/new/page.tsx`
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/ar.json`

- [ ] **Step 1: Delete old files**

```bash
git rm src/features/admin/components/create-teacher-form.tsx
git rm app/[locale]/(admin)/admin/teachers/new/page.tsx
```

- [ ] **Step 2: Add i18n keys to en.json**

In the `admin` section, add:
```json
"dialog_create_title": "Create {kind}",
"dialog_edit_title": "Edit {kind}",
"dialog_delete_title": "Delete {kind}",
"dialog_delete_confirm": "Are you sure you want to delete \"{name}\"? This action cannot be undone.",
"dialog_delete_warning": "This will permanently delete this item.",
"dialog_confirm_delete": "Delete"
```

- [ ] **Step 3: Add i18n keys to ar.json**

In the `admin` section, add:
```json
"dialog_create_title": "إنشاء {kind}",
"dialog_edit_title": "تعديل {kind}",
"dialog_delete_title": "حذف {kind}",
"dialog_delete_confirm": "هل أنت متأكد من حذف \"{name}\"؟ لا يمكن التراجع عن هذا الإجراء.",
"dialog_delete_warning": "سيتم حذف هذا العنصر نهائيًا.",
"dialog_confirm_delete": "حذف"
```

- [ ] **Step 4: Verify i18n parity**

```bash
npx vitest run tests/unit/i18n-parity.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add i18n keys for admin dialog modals"
```

---

### Task 11: Final verification

- [ ] **Step 1: Full test suite**

```bash
npx vitest run
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
