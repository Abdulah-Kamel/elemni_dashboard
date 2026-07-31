# Task 10: Delete old files and add i18n keys

## Step 1: Delete old files
- `src/features/admin/components/create-teacher-form.tsx` — was untracked, deleted with `Remove-Item`
- `app/[locale]/(admin)/admin/teachers/new/page.tsx` — was untracked, deleted with `Remove-Item`
- Empty `new/` directory also removed

## Step 2 & 3: Add i18n keys
- **en.json**: Added 6 keys under `admin` section (`dialog_create_title`, `dialog_edit_title`, `dialog_delete_title`, `dialog_delete_confirm`, `dialog_delete_warning`, `dialog_confirm_delete`)
- **ar.json**: Added 6 matching Arabic translations under `admin` section

## Step 4: Verify i18n parity
- `npx vitest run tests/unit/i18n-parity.test.ts` — **PASS** (2/2 tests passed)

## Step 5: Commit
- Commit `8730879` — `feat: add i18n keys for admin dialog modals`
- Only `src/i18n/messages/en.json` and `src/i18n/messages/ar.json` included
