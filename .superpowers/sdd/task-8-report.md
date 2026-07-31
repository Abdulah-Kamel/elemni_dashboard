# Task 8: Refactor TeachersList to use React Query — Report

## Status: Complete

### Changes made

1. **`src/features/admin/components/teachers-list.tsx`** — Rewritten:
   - Removed `teachers` prop; now calls `useTeachersQuery()` internally
   - "New Teacher" button opens `<TeacherCreateDialog>` instead of navigating to `/admin/teachers/new`
   - Loading state renders `<Skeleton>` placeholders
   - Error state renders `<Placeholder state="error" />`
   - Search + pagination operates on `data` from the query
   - Added `<TeacherDeleteDialog>` (wired but delete button not yet visible in the table)

2. **`src/features/admin/actions.ts`** — Fixed `listTeachersAction`:
   - Changed from `listTeachers()` → `listAdminTeachers()` so it returns `AdminTeacherListItem[]` (with `id`, `email`, `phone`, `call_status`, `interest_level`, `status`) instead of `PublicTeacherOut[]`
   - Updated imports accordingly

3. **`app/[locale]/(admin)/admin/teachers/page.tsx`** — Simplified to match new API:
   - Removed server-side fetch of `listTeachers()` and `AdminTeacherListItem` shaping
   - Removed `teachers` prop from `<TeachersList>`

### Verification
- `npx tsc --noEmit` — no admin-related errors (pre-existing errors in `elemni-redsing/` and `item-upload-flow.tsx` are unrelated)

### Commit
`94a23dd` — `refactor: TeachersList uses React Query + modal dialogs`
