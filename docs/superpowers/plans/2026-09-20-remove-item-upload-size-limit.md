# Remove Item Upload Size Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dashboard's hardcoded 500 MB client-side limit for item video uploads while preserving all other attachment validation.

**Architecture:** Keep `validateItemUploadFile` as the client-side validator for file type and attachment shape. Delete only the byte-size policy from its video branch; the existing Bunny/API upload flow remains unchanged and authoritative for operational failures.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-20-remove-item-upload-size-limit-design.md`

## Global Constraints

- The dashboard must not enforce a byte-size policy for item videos.
- Video MIME-type validation must remain in place.
- Existing attachment-count, duplicate-type, and document validation must remain unchanged.
- Do not modify backend endpoints, storage configuration, or document-upload behavior.
- Use the repository's npm scripts; there is no standalone typecheck script.

---

### Task 1: Update Item Video Validation

**Files:**
- Modify: `src/features/course-management/item-upload-validation.ts:3-29`
- Test: `src/features/course-management/__tests__/item-upload-validation.test.ts:1-205`

**Interfaces:**
- Consumes: `validateItemUploadFile(file: File, type: UploadType)` and `mergeItemAttachmentFiles(current, selected)`.
- Produces: `validateItemUploadFile` returns `null` for any video-sized `File` whose MIME type starts with `video/`; invalid video MIME types still return `"invalid_video"`.

- [ ] **Step 1: Update the regression test first**

Replace the existing test that expects `"video_too_large"` with an oversized-video acceptance test. Keep the test's video MIME type valid and make its size exceed 500 MiB:

```ts
it("accepts videos larger than the former 500 MB limit", () => {
  const file = new File([new Uint8Array(501 * 1024 * 1024)], "lesson.mp4", {
    type: "video/mp4",
  })

  expect(validateItemUploadFile(file, "video")).toBeNull()
})
```

Update the merge-selection expectation that currently uses `"video_too_large"` so the same oversized video is accepted and becomes `selection.videoFile`. Do not remove or weaken tests for invalid video types, duplicate videos, duplicate documents, unsupported files, or the two-attachment limit.

- [ ] **Step 2: Run the focused test to verify the old implementation fails**

Run:

```bash
npm exec vitest run src/features/course-management/__tests__/item-upload-validation.test.ts
```

Expected: FAIL because the current validator returns `"video_too_large"` for the 501 MiB video.

- [ ] **Step 3: Remove only the size policy**

In `item-upload-validation.ts`:

```ts
export type UploadValidationError =
  | "invalid_video"
  | "invalid_document"

export function validateItemUploadFile(
  file: File,
  type: UploadType
): UploadValidationError | null {
  if (type === "video") {
    if (!file.type.startsWith("video/")) return "invalid_video"
    return null
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "invalid_document"
  }

  return null
}
```

Delete `MAX_VIDEO_SIZE` and the `file.size` comparison. Do not change the upload hook, upload transport, document branch, or attachment classification rules.

- [ ] **Step 4: Run the focused test to verify the fix**

Run:

```bash
npm exec vitest run src/features/course-management/__tests__/item-upload-validation.test.ts
```

Expected: PASS for all item-upload validation tests, including the oversized-video acceptance case and the preserved invalid/duplicate/unsupported cases.

- [ ] **Step 5: Run repository verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands complete successfully with no references to `MAX_VIDEO_SIZE` or `video_too_large` remaining in the dashboard source or tests.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/features/course-management/item-upload-validation.ts src/features/course-management/__tests__/item-upload-validation.test.ts
git commit -m "fix: remove item video size limit"
```
