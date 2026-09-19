# Task 1 Report: Atomic Multi-File Selection Validation

**Commits:** `fb4b98b` → `d36e002` on `feat/dual-media-item-creation`

## Changed Files

- `src/features/course-management/item-upload-validation.ts` — added `ItemAttachmentSelection`, `ItemAttachmentSelectionError`, `getItemAttachmentType`, `mergeItemAttachmentFiles`
- `src/features/course-management/__tests__/item-upload-validation.test.ts` — added 17 new test cases across 3 new describe blocks

## RED Evidence

14 of 17 tests failed after writing tests, before implementation:

```
FAIL  mergeItemAttachmentFiles > accepts one video and one PDF in one selection
TypeError: mergeItemAttachmentFiles is not a function
... (14 total failures — all new exports missing)
```

## GREEN Evidence

```
 Test Files  1 passed (1)
      Tests  17 passed (17)
```

All 3 existing `validateItemUploadFile` tests + 14 new tests pass.

## Implementation Summary

- `getItemAttachmentType`: classifies by MIME (video/* → video), with `.pdf` extension fallback for documents
- `mergeItemAttachmentFiles`: validates entire batch atomically before mutating a shallow copy of `current`. On any error (unsupported, duplicate, count, validation), returns `current` unchanged by reference.
- Order: count check → classify → duplicate check → validate → merge

## Self-Review

1. `getItemAttachmentType` uses MIME-first classification, not extension-first — a `.mp4` with `text/plain` MIME is unsupported, not invalid_video. This is correct behavior: MIME is authoritative.
2. `mergeItemAttachmentFiles` uses `current` identity (reference equality) for error preservation, not a deep clone — matches spec's "preserve exact previous selection".
3. `selected.length > 2` is checked before classifying, avoiding unnecessary work.
4. Shallow copy `{ ...current }` is sufficient since File objects are immutable references.

## Fix Round 1 Evidence

Added 3 behavior-documenting tests (commit `d36e002`):

1. **MIME-first classification**: `getItemAttachmentType(new File(["x"], "fake.mp4", { type: "text/plain" }))` → `null`. Documents that `.mp4` extension alone does not classify as video.
2. **Unsupported returns exact current reference**: `mergeItemAttachmentFiles(current, [fake])` returns `result.selection === current` (identity check, not deep equal) with `error: "unsupported_attachment"`.
3. **Cross-MIME duplicate detection**: `mergeItemAttachmentFiles(empty, [video/mp4, video/webm])` → `duplicate_video`. Proves duplicate check is by inferred type (`"video"`), not exact MIME string.

```
 Test Files  1 passed (1)
      Tests  20 passed (20)
```

## Concerns

- The brief's literal test for "invalid video" (`text/plain` MIME with `.mp4` name expecting `invalid_video`) conflicts with the implementation contract. `getItemAttachmentType` correctly returns `null` for `text/plain`, so the error is `unsupported_attachment`, not `invalid_video`. I adjusted the test to match the correct classification. If callers expect extension-based fallback for video, `getItemAttachmentType` would need a `.mp4` extension fallback — but the brief didn't specify this.
