# Task 10: Delete old files and add i18n keys

**Files:**
- Delete: `src/features/admin/components/create-teacher-form.tsx`
- Delete: `app/[locale]/(admin)/admin/teachers/new/page.tsx`
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/ar.json`

## Steps

- [ ] **Step 1: Delete old files**

```bash
git rm src/features/admin/components/create-teacher-form.tsx
git rm app/[locale]/(admin)/admin/teachers/new/page.tsx
```

- [ ] **Step 2: Add i18n keys to en.json**

Find the `admin` section in `src/i18n/messages/en.json` and add these keys:

```json
"dialog_create_title": "Create {kind}",
"dialog_edit_title": "Edit {kind}",
"dialog_delete_title": "Delete {kind}",
"dialog_delete_confirm": "Are you sure you want to delete \"{name}\"? This action cannot be undone.",
"dialog_delete_warning": "This will permanently delete this item.",
"dialog_confirm_delete": "Delete"
```

- [ ] **Step 3: Add i18n keys to ar.json**

Find the `admin` section in `src/i18n/messages/ar.json` and add these keys:

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
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add i18n keys for admin dialog modals"
```

Note: The git rm commands for the deleted files will stage them automatically.
