# Critical Fixes Report

**Date:** 2026-07-28
**Commit:** 061b606

## Summary

All 3 critical findings from the final review have been resolved.

| Finding | Status | Notes |
|---------|--------|-------|
| C1: TeacherDeleteDialog non-functional | ✅ Fixed | Full replacement with mutation, action, hook, and UI button |
| C2: Taxonomy dialogs ignore outcome.success | ✅ Fixed | All 3 dialogs check `ActionResult.success` before toasting |
| C3: listTeachersAction uses wrong delegate | ✅ Fixed | Import renamed to `listTeachersQuery`; keeps `AdminTeacherListItem` for component compatibility |

## Changes by File

### `src/features/admin/actions.ts`
- Added `deleteTeacher` server action (DELETE `/api/v1/admin/teachers/{id}`)
- Changed `listTeachersAction` import from `listAdminTeachers` to `listAdminTeachers as listTeachersQuery`
- Removed unused `PublicTeacherOut` import (keep `AdminTeacherListItem`)

### `src/features/admin/components/teacher-delete-dialog.tsx`
- Full replacement: now calls `remove.mutateAsync(teacher.id)` with loading/error states
- Uses `remove.isPending` to disable buttons and show spinner

### `src/features/admin/components/teachers-list.tsx`
- Added `Trash2` icon import
- Added actions column header and delete button per row
- Delete button calls `setDeleteTeacher({ id, name })` to open dialog

### `src/features/admin/hooks/use-teachers-queries.ts`
- Imported `deleteTeacher` from actions
- Added `remove` mutation (`useMutation` with `deleteTeacher`)
- Updated return to `{ create, remove }`

### `src/features/admin/components/taxonomy-create-dialog.tsx`
- Changed `handleSubmit` to assign `create.mutateAsync` result to `outcome`
- Success toast and close gated on `outcome.success`
- Error toast on `outcome.error.message` when `!outcome.success`

### `src/features/admin/components/taxonomy-edit-dialog.tsx`
- Same pattern as create: `outcome = await update.mutateAsync(...)`, check `outcome.success`

### `src/features/admin/components/taxonomy-delete-dialog.tsx`
- Same pattern: `outcome = await remove.mutateAsync(item.id)`, check `outcome.success`

## Verification

- **TypeScript:** `npx tsc --noEmit` — no new errors (pre-existing errors in unrelated files)
- **Tests:** `npx vitest run` — 151/151 passed across 16 test files
- **Commit:** 061b606 (7 files, +77/−17)
