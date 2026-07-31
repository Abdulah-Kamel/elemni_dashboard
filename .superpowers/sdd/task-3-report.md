# Task 3 Report: Add server action wrappers and remove revalidateTag

## Summary

Added `listTeachersAction()` server action wrapper and removed `revalidateTag` calls from all 4 mutation functions in `src/features/admin/actions.ts`.

## Changes Made

1. **Removed** `revalidateTag` import from `"next/cache"` (line 2)
2. **Added** imports for `AdminTeacherListItem` type and `listAdminTeachers as listTeachersQuery` from admin queries
3. **Added** `listTeachersAction()` function (returns `Promise<AdminTeacherListItem[]>`) that delegates to `listAdminTeachers` query
4. **Removed** `revalidateTag` calls from:
   - `createTeacher` (was at line 45)
   - `createTaxonomyItem` (was at line 98)
   - `updateTaxonomyItem` (was at line 114)
   - `deleteTaxonomyItem` (was at line 129)

## Deviation from Brief

The brief specified importing `listTeachers` from queries. However, `listTeachers()` returns `PublicTeacherOut[]` (missing `id`, `email` fields), while the action was typed as returning `AdminTeacherListItem[]`. Changed the import to `listAdminTeachers` which actually returns `AdminTeacherListItem[]`, matching the intended return type.

## Verification

- `npx tsc --noEmit`: No new errors in `src/features/admin/actions.ts`
- Pre-existing errors in `elemni-redsing/` and `course-management` are unrelated

## Commits

- `6e5e42a` feat: add listTeachersAction, remove revalidateTag from admin actions
