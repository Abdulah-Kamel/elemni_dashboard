# Task 8: Refactor TeachersList to use React Query

**Files:**
- Modify: `src/features/admin/components/teachers-list.tsx`

Replace the file with a version that:
- No longer receives `teachers` prop
- Calls `useTeachersQuery()` for data
- "New Teacher" button opens `<TeacherCreateDialog>` instead of navigating
- Shows loading skeleton and error placeholder states
- Search + pagination operates on `data` from query

Read the complete code from `docs/superpowers/plans/2026-07-28-admin-modal-crud-react-query.md` Task 8 Step 1 (or use the code from the plan at the top of this file — either works).

## Steps
- [ ] Read current file
- [ ] Replace with the new version from the plan
- [ ] Run `npx tsc --noEmit`
- [ ] Commit: `git add src/features/admin/components/teachers-list.tsx && git commit -m "refactor: TeachersList uses React Query + modal dialogs"`
