# Final Fix Report — Course Edit Page Parity

**Date:** 2026-09-19  
**Branch:** `feat/course-edit-page-parity`  
**Commit:** `54d549c`

## Summary

All 9 findings resolved in a single wave. 570 tests pass (67 files). Lint clean. Typecheck baseline unchanged.

## Findings Resolved

### Critical

| # | Finding | Resolution |
|---|---------|------------|
| 1 | `ar.json` archive strings contain banned `كورس` | Replaced 5 strings with grammatically correct `دورة` forms: `أرشفة الدورة`, `إلغاء أرشفة الدورة`, `أرشفة هذه الدورة؟`, `سيتم إلغاء نشر الدورة وإخفاؤها عن الطلاب.`, `ألغِ أرشفة هذه الدورة قبل نشرها.` |

### Important

| # | Finding | Resolution |
|---|---------|------------|
| 2 | `CourseWorkspace` duplicated canSave/title validation between `handleSave` and `performSave` | Refactored to single flow: `handleSave` is the entry gate (validates + checks structure change), `performSave` is the pure execution pipeline (body build + mutation + state updates). No duplicated validation. |
| 3 | PublishSwitch key-remount synchronization | Made PublishSwitch fully controlled by `isPublished` prop using optimistic local state (`optimisticPublished`). Removed `key` remount from workspace. On success calls `onPublishedChange(next)`. On failure reverts optimistic state. |
| 4 | `archived_publish_hint` not rendered beside disabled publish control | Added `{archived && <p className="text-sm text-muted-foreground">{t("archived_publish_hint")}</p>}` after the publish/archive controls div. |
| 5 | Archive confirm double-fire while pending | Added local `confirmPending` state in `ArchiveCourseControl`. Confirm button disabled while `confirmPending`. Dialog closes on confirm click (original behavior preserved). `confirmPending` resets on fresh dialog open. |

### Minor/Deferred

| # | Finding | Resolution |
|---|---------|------------|
| 6 | Unarchive success doesn't sync `published` | Added `setPublished(updated.is_published)` in `handleUnarchive` alongside `setArchived`. |
| 7 | Missing pending-unarchive behavioral coverage | Added test: "disables unarchive button while unarchive request is pending" — asserts button disabled during pending, then shows archive button after resolution. |
| 8 | PublishSwitch error-clearing finding | Existing `setError(null)` at start of `handleToggle` is correct — clears stale errors on retry. No code change needed (it was already correct). |
| 9 | Duplicate hardcoded `error_upstream` in CourseWorkspace | Removed `error_upstream` from COPY object. Added `useTranslations("courses")` and use `t("error_upstream")` in `handleArchive`/`handleUnarchive`. |

## Files Changed

| File | Change |
|------|--------|
| `src/i18n/messages/ar.json` | 5 string replacements (كورس → دورة) |
| `src/features/course-management/components/publish-switch.tsx` | Full controlled refactor: optimistic local state, derives display from prop |
| `src/features/course-management/components/archive-course-control.tsx` | Added `confirmPending` state, disabled confirm during pending, Loader2 spinner |
| `src/features/student-preview/course-workspace.tsx` | Single validation flow, controlled PublishSwitch (key removed), archived_publish_hint, unarchive sync, useTranslations for error_upstream |
| `src/features/student-preview/__tests__/course-workspace.test.tsx` | 6 new tests: archived_publish_hint (×2), double-fire prevention, pending-unarchive, published-sync, publish-switch-prop-change |
| `src/features/course-management/__tests__/publish-switch.test.tsx` | 1 new test: controlled prop sync without remount |

## Verification

| Check | Result |
|-------|--------|
| Glossary test | PASS |
| Focused workspace tests (35) | PASS |
| Focused publish-switch tests (5) | PASS |
| Full test suite (570) | PASS |
| Changed-file lint | CLEAN |
| `git diff --check` | CLEAN |
| Typecheck | Baseline only (image modules, admin layout — none in changed files) |
| Backend file changes | NONE |

## Concerns

- None. All findings resolved cleanly within the dashboard-only constraint.
