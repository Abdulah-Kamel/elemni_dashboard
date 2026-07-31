# Code Review: Admin Dashboard — Modal CRUD + React Query

**Commit range:** `ba81c12..HEAD`
**Review date:** 2026-07-28
**Files:** 21 changed (1292 insertions, 3 deletions)

---

## Critical (3)

### C1. TeacherDeleteDialog is a non-functional placeholder

**File:** `src/features/admin/components/teacher-delete-dialog.tsx:27`

The confirm button only closes the dialog — it never calls any mutation or server action. The spec (Section 3) says: *"Same pattern as taxonomy delete dialog, adapted for teacher name"*. The taxonomy delete dialog calls `remove.mutateAsync(item.id)` and handles loading/success/error states — this one does not.

Additionally, `TeachersList` renders the dialog but never triggers `setDeleteTeacher` — there is no delete button on any teacher row, so the dialog is unreachable from the UI.

### C2. Taxonomy dialogs don't check `ActionResult.success` before showing success toast

**Files:**
- `src/features/admin/components/taxonomy-create-dialog.tsx:304`
- `src/features/admin/components/taxonomy-edit-dialog.tsx:447`
- `src/features/admin/components/taxonomy-delete-dialog.tsx:374`

All three server actions (`createTaxonomyItem`, `updateTaxonomyItem`, `deleteTaxonomyItem`) catch API errors and return `{ success: false, error: {...} }` — they never throw. The dialogs call `mutateAsync()` but don't inspect the return value. When the API returns an error:

```ts
await create.mutateAsync(data);       // resolves with { success: false, error: {...} }
toast.success(t("created"));           // fires regardless
```

The teacher-create-dialog shows the correct pattern — it checks `outcome.success` before showing a success toast. The taxonomy dialogs need the same.

### C3. `listTeachersAction` delegates to `listAdminTeachers` instead of `listTeachers`

**File:** `src/features/admin/actions.ts:214`

The spec explicitly says: *"delegates to `listTeachers()` (public endpoint, works now). When the backend adds GET /api/v1/admin/teachers, switch to `listAdminTeachers()` for full CRM fields."*

The implementation jumped ahead and uses `listAdminTeachers` directly. If the admin-only endpoint has different permissions, data shape, or isn't deployed yet, this will break.

---

## Important (3)

### I1. Teachers list has hardcoded English counter text

**File:** `src/features/admin/components/teachers-list.tsx:966`

```tsx
{filtered.length} {filtered.length === 1 ? "teacher" : "teachers"}
```

This displays English in Arabic locale. Should use an i18n plural key from the `admin` namespace.

### I2. `error_upstream` i18n key missing from admin namespace

**File:** `src/features/admin/components/teacher-create-dialog.tsx:680`

The dialog uses `useTranslations("admin")` but calls `t("error_upstream")` — this key only exists in the `profile` namespace in both `en.json` and `ar.json`. The toast will show the literal key name as fallback.

### I3. Spec deviation: no `listSubjectsAction` / `listGradesAction` / `listStreamsAction` re-exports in admin/actions.ts

**File:** `src/features/admin/actions.ts`

The spec requires these three re-exports from `course-management/actions` in the admin actions file. The hooks import directly from `@/features/course-management/actions` instead. This works, but breaks the spec's convention of having a single admin actions surface, and would cause issues if course-management actions are refactored in the future.

---

## Minor (4)

### M1. Form state not fully reset after successful teacher creation

**File:** `src/features/admin/components/teacher-create-dialog.tsx:708`

After creating a teacher, only `name` and `email` are reset; CRM/pipeline fields retain their previous values. If the user opens the dialog to create another teacher, stale values remain.

### M2. Hardcoded Arabic labels in `INTEREST_MAP`

**File:** `src/features/admin/components/teachers-list.tsx:908-911`

Interest level labels ("مرتب", "موزّط", "مخصّص") are hardcoded in a module-level constant. These should use i18n translations for consistency with the rest of the codebase.

### M3. `useEffect` in TaxonomyEditDialog depends on inline `fields` array

**File:** `src/features/admin/components/taxonomy-edit-dialog.tsx:442`

The `fields` prop is typically defined as an inline array literal in the parent component (e.g. `fields={[{key: "name", ...}]}`). This creates a new reference on every render, causing the `useEffect` to re-run unnecessarily. The effect is idempotent so there's no behavioral bug, but it's wasteful.

### M4. `error_validation` and `profile` i18n keys are unrelated to this feature

**Files:** `src/i18n/messages/en.json`, `src/i18n/messages/ar.json`

The diff adds `error_validation` (auth scope) and an entire `profile` scope. These are not mentioned in the spec. While harmless, they add noise to the diff and could indicate an unintended merge artifact.

---

## Summary

| Category | Count |
|----------|-------|
| Critical | 3 |
| Important | 3 |
| Minor | 4 |
| **Total** | **10** |

**Verdict:** CHANGES_REQUESTED

The 3 critical issues must be resolved before this can ship. C1 (non-functional delete dialog) and C2 (false success toasts) are runtime bugs that would mislead users. C3 (wrong server action delegate) could cause a production outage if the admin-only query endpoint isn't fully ready. The important and minor issues should also be addressed but don't block merge.
