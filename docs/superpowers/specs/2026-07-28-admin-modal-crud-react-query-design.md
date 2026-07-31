# Admin Dashboard: Modal CRUD + React Query Migration

**Date**: 2026-07-28
**Branch**: main
**Status**: Approved (all sections)

## Summary

Two changes to the admin dashboard:

1. **Modal CRUD** — Replace inline editing, inline create panels, and native `confirm()` dialogs with proper modal `Dialog` components for all create/edit/delete operations across taxonomy management (grades/streams/subjects) and teacher management.
2. **React Query** — Introduce `@tanstack/react-query` for admin dashboard data fetching and mutations. Server actions remain the transport layer (queryFn + mutationFn), but client-side state management, caching, and refetching are handled by React Query instead of manual `useState` copies + `revalidateTag`.

React Query is set up globally (provider in root layout) but adopted only by admin pages for now. Other features keep their existing server-side fetching pattern.

---

## Section 1: React Query Setup

### Package

Install `@tanstack/react-query`.

### Provider

Create `src/providers/query-provider.tsx` — a `"use client"` component wrapping `<QueryClientProvider>` with a `QueryClient` instance:

- `staleTime: 30_000` (30 seconds)
- `refetchOnWindowFocus: false`

Place it in `app/[locale]/layout.tsx` alongside `NextIntlClientProvider`:

```tsx
<NextIntlClientProvider messages={messages}>
  <QueryProvider>{children}</QueryProvider>
</NextIntlClientProvider>
```

### Query Key Factory

`src/features/admin/query-keys.ts`:

```ts
export const adminKeys = {
  all: ["admin"] as const,
  teachers: ["admin", "teachers"] as const,
  taxonomy: (kind: string) => ["admin", kind] as const,
};
```

### Server Action Wrappers

The existing `listAdminTeachers()`, `listSubjects()`, `listGrades()`, `listStreams()` are `"server-only"`. Add thin `"use server"` wrappers in `src/features/admin/actions.ts`:

- `listTeachersAction()` — delegates to `listTeachers()` (public endpoint, works now). When the backend adds `GET /api/v1/admin/teachers`, switch to `listAdminTeachers()` for full CRM fields.
- `listSubjectsAction()` — re-export from `course-management/actions` (already exists)
- `listGradesAction()` — re-export from `course-management/actions` (already exists)
- `listStreamsAction()` — re-export from `course-management/actions` (already exists)

### Mutation Changes

Existing admin actions (`createTaxonomyItem`, `updateTaxonomyItem`, `deleteTaxonomyItem`, `createTeacher`) currently call `revalidateTag` after successful mutations. Remove these `revalidateTag` calls — React Query's `invalidateQueries` replaces them. The actions just return the result; the hooks handle invalidation.

---

## Section 2: React Query Hooks

### `src/features/admin/hooks/use-taxonomy-queries.ts`

```ts
type TaxonomyKind = "grades" | "streams" | "subjects";

export function useTaxonomyQuery(kind: TaxonomyKind) {
  return useQuery({
    queryKey: adminKeys.taxonomy(kind),
    queryFn: () => {
      if (kind === "subjects") return listSubjectsAction();
      if (kind === "grades")  return listGradesAction();
      return listStreamsAction();
    },
  });
}
```

### `src/features/admin/hooks/use-taxonomy-mutations.ts`

```ts
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

### `src/features/admin/hooks/use-teachers-queries.ts`

```ts
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

### Key decisions

- One file per hook domain (taxonomy vs teachers)
- `invalidateQueries` on success auto-refetches the list — no manual state management
- Hooks return raw React Query objects so components access `isLoading`, `isError`, `isPending`
- Hooks live in `src/features/admin/hooks/`

---

## Section 3: Modal Dialog Components

All dialogs use the existing `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogFooter` components from `@/components/ui/dialog` (built on `@base-ui/react/dialog`).

Shared patterns:
- Controlled open state (`open` + `onOpenChange`) — parent owns state
- `toast.success()` / `toast.error()` from sonner
- `Loader2` spinner on submit buttons while `isPending`
- All are `"use client"` components

### Taxonomy Dialogs

#### `taxonomy-create-dialog.tsx`

Props: `kind`, `fields`, `open`, `onOpenChange`

Behavior:
- Field inputs rendered from `fields` prop (name required, slug/level optional)
- Submit calls `useTaxonomyMutations(kind).create.mutateAsync(data)`
- On success: toast + close dialog (auto-refetch via invalidation)
- On error: toast with error message
- Cancel button closes dialog
- Loading spinner while `isPending`

#### `taxonomy-edit-dialog.tsx`

Props: `kind`, `fields`, `item` (row being edited), `open`, `onOpenChange`

Behavior:
- Pre-fills inputs from `item` when dialog opens
- Submit calls `useTaxonomyMutations(kind).update.mutateAsync({ id, data })`
- Same success/error/loading pattern

#### `taxonomy-delete-dialog.tsx`

Props: `kind`, `item` (name shown for confirmation), `open`, `onOpenChange`

Behavior:
- Shows "Are you sure you want to delete \"{name}\"?"
- Confirm calls `useTaxonomyMutations(kind).remove.mutateAsync(id)`
- Destructive variant on confirm button
- Loading state while deleting

### Teacher Dialogs

#### `teacher-create-dialog.tsx`

Props: `open`, `onOpenChange`

Behavior:
- Adapts `create-teacher-form.tsx` content into `DialogContent`
- Fetches subjects + grades on dialog open via `listSubjectsAction` / `listGradesAction` (local state — same pattern as course-management create-course-dialog)
- Submit calls `useTeacherMutations().create.mutateAsync(data)`
- On success: shows inline result panel (slug/email + "send invite" button) within the dialog
- "Send invite" calls `sendSetPasswordEmail` server action
- Dialog uses `max-w-[36rem]` for form space
- Link back buttons removed (dialog close replaces them)

#### `teacher-delete-dialog.tsx`

Props: `teacher` (row data), `open`, `onOpenChange`

Behavior:
- Same pattern as taxonomy delete dialog, adapted for teacher name

---

## Section 4: Refactored Components

### TaxonomyManager (refactored)

**Removed:**
- `useState(items)` local list — replaced by `useTaxonomyQuery(kind)`
- `useCallback` handlers for create/update/delete — replaced by `useTaxonomyMutations(kind)`
- Inline create panel (div above table)
- Inline row editing (input replacing text in table cell)
- `confirm()` for delete

**Kept:**
- `kind`, `titleKey`, `fields` props (same interface)

**Changed:**
- `items` prop removed — data from `useTaxonomyQuery`
- Manages dialog open state: `createOpen` (boolean), `editItem` (Item | null), `deleteItem` (Item | null)
- Renders table (read-only) + action buttons per row that open dialogs
- Shows `Skeleton` rows when `isLoading`, `Placeholder` error state when `isError`
- "New" button opens `<TaxonomyCreateDialog>`
- Pencil button opens `<TaxonomyEditDialog>` with the row item
- Trash button opens `<TaxonomyDeleteDialog>` with the row item
- Renders the 3 dialog components as children

### TeachersList (refactored)

**Removed:**
- `teachers` prop (no longer prop-driven)
- `<Link>` to `/admin/teachers/new`

**Changed:**
- Calls `useTeachersQuery()` for data
- "New Teacher" button opens `<TeacherCreateDialog>`
- Loading skeleton + error placeholder states
- Search + pagination operates on `data` from query

### Admin Pages (simplified)

**`teachers/page.tsx`** — thin shell:
- No `Promise.all` fetching, no manual mapping
- Renders `<TeachersList />` + two `<TaxonomyManager>` in grid
- No `items` props passed (components fetch their own)

**`grades/page.tsx`, `streams/page.tsx`, `subjects/page.tsx`** — thin shell:
- Just `<TaxonomyManager kind="..." titleKey="..." fields={[...]} />`
- No server-side data fetching or try/catch

**`teachers/new/page.tsx`** — deleted

---

## Section 5: i18n Keys

New keys in the `admin` namespace (both `en.json` and `ar.json`):

| Key | EN | AR |
|-----|----|----|
| `dialog_create_title` | Create {kind} | إنشاء {kind} |
| `dialog_edit_title` | Edit {kind} | تعديل {kind} |
| `dialog_delete_title` | Delete {kind} | حذف {kind} |
| `dialog_delete_confirm` | Are you sure you want to delete "{name}"? This action cannot be undone. | هل أنت متأكد من حذف "{name}"؟ لا يمكن التراجع عن هذا الإجراء. |
| `dialog_delete_warning` | This will permanently delete this item. | سيتم حذف هذا العنصر نهائيًا. |
| `dialog_confirm_delete` | Delete | حذف |

Existing keys reused: `btn_create`, `btn_save`, `btn_cancel`, `btn_delete`, `created`, `updated`, `deleted`, `confirm_delete`.

---

## Section 6: File Inventory

### New Files (10)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/providers/query-provider.tsx` | QueryClientProvider wrapper (client component) |
| 2 | `src/features/admin/query-keys.ts` | React Query key factory |
| 3 | `src/features/admin/hooks/use-taxonomy-queries.ts` | `useTaxonomyQuery(kind)` |
| 4 | `src/features/admin/hooks/use-taxonomy-mutations.ts` | `useTaxonomyMutations(kind)` |
| 5 | `src/features/admin/hooks/use-teachers-queries.ts` | `useTeachersQuery()` + `useTeacherMutations()` |
| 6 | `src/features/admin/components/taxonomy-create-dialog.tsx` | Create modal for grades/streams/subjects |
| 7 | `src/features/admin/components/taxonomy-edit-dialog.tsx` | Edit modal for grades/streams/subjects |
| 8 | `src/features/admin/components/taxonomy-delete-dialog.tsx` | Delete confirmation modal |
| 9 | `src/features/admin/components/teacher-create-dialog.tsx` | Teacher creation modal |
| 10 | `src/features/admin/components/teacher-delete-dialog.tsx` | Teacher delete confirmation modal |

### Modified Files (11)

| # | File | Change |
|---|------|--------|
| 1 | `app/[locale]/layout.tsx` | Wrap children in `<QueryProvider>` |
| 2 | `package.json` | Add `@tanstack/react-query` |
| 3 | `src/features/admin/actions.ts` | Add `listTeachersAction`, remove `revalidateTag` calls |
| 4 | `src/features/admin/components/taxonomy-manager.tsx` | Remove inline CRUD, use React Query + dialogs |
| 5 | `src/features/admin/components/teachers-list.tsx` | Remove `teachers` prop, use `useTeachersQuery`, open create dialog |
| 6 | `app/[locale]/(admin)/admin/teachers/page.tsx` | Simplify to thin shell |
| 7 | `app/[locale]/(admin)/admin/grades/page.tsx` | Simplify to `<TaxonomyManager>` only |
| 8 | `app/[locale]/(admin)/admin/streams/page.tsx` | Simplify to `<TaxonomyManager>` only |
| 9 | `app/[locale]/(admin)/admin/subjects/page.tsx` | Simplify to `<TaxonomyManager>` only |
| 10 | `src/i18n/messages/en.json` | Add dialog i18n keys |
| 11 | `src/i18n/messages/ar.json` | Add dialog i18n keys |

### Deleted Files (2)

| # | File | Reason |
|---|------|--------|
| 1 | `src/features/admin/components/create-teacher-form.tsx` | Replaced by `teacher-create-dialog.tsx` |
| 2 | `app/[locale]/(admin)/admin/teachers/new/page.tsx` | Teacher creation moves to modal |

---

## Testing

- Run `npm run lint` — no new errors
- Run `npm run typecheck` — no new errors
- Run `npx vitest run` — all existing tests pass
- Manual test: log in as admin, navigate to `/ar/admin/teachers`, verify:
  - Teachers list loads via React Query
  - "New Teacher" opens a modal dialog
  - Taxonomy managers load via React Query
  - Create/edit/delete all use modal dialogs
  - After mutations, lists auto-refetch
