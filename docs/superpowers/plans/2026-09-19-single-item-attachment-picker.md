# Single Item Attachment Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two creation dropzones with one picker that accepts one video, one PDF, or both while rejecting invalid file-count and duplicate-type selections.

**Architecture:** Extend the existing item validation module with an atomic selection merger, add a focused multi-file picker component, and connect it to `CreateItemDialog` without changing the upload hook or backend. The picker accepts arrays from one input, while the dialog continues submitting the existing `{ videoFile, documentFile }` payload consumed by sequential upload orchestration.

**Tech Stack:** React 19, TypeScript, next-intl, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Dashboard repository only; do not modify backend files, schemas, endpoints, models, migrations, or tests.
- Use one file input with `multiple` enabled and accept video MIME types plus PDF.
- Valid state is at most one video and one PDF; reject more than two selected files, two videos, two PDFs, and unsupported types.
- A later single-file selection replaces only that attachment type and preserves the other selected type.
- Any invalid selection leaves the previous valid selection unchanged.
- Uploaded attachment types remain locked during partial-failure retry.
- Keep the existing `CreateItemPayload`, upload order, retry logic, ItemList integration, and edit-item upload flow unchanged.

---

## File Structure

- Modify `src/features/course-management/item-upload-validation.ts`: classify files and atomically merge a multi-file selection.
- Modify `src/features/course-management/__tests__/item-upload-validation.test.ts`: cover count, duplicate types, unsupported files, merge, and replacement.
- Create `src/features/course-management/components/item-attachments-picker.tsx`: one accessible multi-file input with selected-file rows.
- Create `src/features/course-management/__tests__/item-attachments-picker.test.tsx`: cover one input, multiple selection, selected rows, and remove actions.
- Modify `src/features/course-management/components/create-item-dialog.tsx`: replace both `FileDropzone` instances with the focused picker.
- Modify `src/features/course-management/__tests__/create-item-dialog.test.tsx`: verify combined and incremental selection through one input.
- Modify `src/i18n/messages/en.json` and `src/i18n/messages/ar.json`: add exact picker and validation copy.

---

### Task 1: Add Atomic Multi-File Selection Validation

**Files:**
- Modify: `src/features/course-management/item-upload-validation.ts`
- Modify: `src/features/course-management/__tests__/item-upload-validation.test.ts`

**Interfaces:**
- Produces: `ItemAttachmentSelection = { videoFile: File | null; documentFile: File | null }`
- Produces: `ItemAttachmentSelectionError = UploadValidationError | "too_many_attachments" | "duplicate_video" | "duplicate_document" | "unsupported_attachment"`
- Produces: `getItemAttachmentType(file: File): UploadType | null`
- Produces: `mergeItemAttachmentFiles(current: ItemAttachmentSelection, selected: File[]): { selection: ItemAttachmentSelection; error: ItemAttachmentSelectionError | null }`
- Consumed by: Task 3's `CreateItemDialog`

- [ ] **Step 1: Write failing selection tests**

```ts
const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
const secondVideo = new File(["video"], "lesson-2.mp4", { type: "video/mp4" })
const pdf = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
const secondPdf = new File(["pdf"], "worksheet.pdf", { type: "application/pdf" })
const empty = { videoFile: null, documentFile: null }

it("accepts one video and one PDF in one selection", () => {
  expect(mergeItemAttachmentFiles(empty, [video, pdf])).toEqual({
    selection: { videoFile: video, documentFile: pdf },
    error: null,
  })
})

it("adds a missing type without discarding the current type", () => {
  expect(
    mergeItemAttachmentFiles({ videoFile: video, documentFile: null }, [pdf])
  ).toEqual({
    selection: { videoFile: video, documentFile: pdf },
    error: null,
  })
})

it("replaces only the newly selected type", () => {
  expect(
    mergeItemAttachmentFiles(
      { videoFile: video, documentFile: pdf },
      [secondVideo]
    )
  ).toEqual({
    selection: { videoFile: secondVideo, documentFile: pdf },
    error: null,
  })
})

it.each([
  [[video, secondVideo], "duplicate_video"],
  [[pdf, secondPdf], "duplicate_document"],
  [[video, pdf, secondPdf], "too_many_attachments"],
] as const)("rejects invalid combinations atomically", (files, error) => {
  const current = { videoFile: video, documentFile: pdf }
  expect(mergeItemAttachmentFiles(current, [...files])).toEqual({
    selection: current,
    error,
  })
})
```

Add literal tests for unsupported files, oversized video propagation, MIME-less `.pdf` classification, and empty selection preserving current state.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/features/course-management/__tests__/item-upload-validation.test.ts`

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement classification and atomic merge**

```ts
export type ItemAttachmentSelection = {
  videoFile: File | null
  documentFile: File | null
}

export type ItemAttachmentSelectionError =
  | UploadValidationError
  | "too_many_attachments"
  | "duplicate_video"
  | "duplicate_document"
  | "unsupported_attachment"

export function getItemAttachmentType(file: File): UploadType | null {
  if (file.type.startsWith("video/")) return "video"
  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "document"
  }
  return null
}
```

`mergeItemAttachmentFiles` must validate the incoming batch before mutating a copied selection. Check `selected.length > 2` first, infer every type, reject duplicate inferred types within the incoming batch, call `validateItemUploadFile` for each inferred type, then merge valid files by type. On every error return the original `current` object unchanged.

- [ ] **Step 4: Run selection and existing validation tests**

Run: `npm test -- src/features/course-management/__tests__/item-upload-validation.test.ts`

Expected: PASS for old single-file validation and new multi-file selection cases.

- [ ] **Step 5: Commit**

```bash
git add src/features/course-management/item-upload-validation.ts src/features/course-management/__tests__/item-upload-validation.test.ts
git commit -m "feat: validate item attachment selections"
```

---

### Task 2: Build The Focused Multi-File Picker

**Files:**
- Create: `src/features/course-management/components/item-attachments-picker.tsx`
- Create: `src/features/course-management/__tests__/item-attachments-picker.test.tsx`

**Interfaces:**
- Consumes: `UploadType` from `item-upload-validation.ts`
- Produces: `AttachmentUploadStatus = "idle" | "uploading" | "uploaded" | "failed"`
- Produces: `ItemAttachmentsPicker(props)`
- Props: `videoFile`, `documentFile`, `videoStatus`, `documentStatus`, `videoProgress`, `disabled`, `error`, `onFilesSelect(files: File[])`, `onRemove(type: UploadType)`
- Consumed by: Task 3's `CreateItemDialog`

- [ ] **Step 1: Write failing picker tests**

```tsx
it("uses one multi-file input for video and PDF", () => {
  const { container } = renderPicker()
  const input = container.querySelector("#create-item-attachments") as HTMLInputElement

  expect(input).not.toBeNull()
  expect(input.multiple).toBe(true)
  expect(input.accept).toBe("video/*,.pdf,application/pdf")
  expect(container.querySelectorAll('input[type="file"]')).toHaveLength(1)
})

it("passes every selected file to the parent", () => {
  const onFilesSelect = vi.fn()
  const { container } = renderPicker({ onFilesSelect })
  const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
  const pdf = new File(["pdf"], "notes.pdf", { type: "application/pdf" })

  fireEvent.change(container.querySelector("#create-item-attachments")!, {
    target: { files: [video, pdf] },
  })

  expect(onFilesSelect).toHaveBeenCalledWith([video, pdf])
})
```

Also test drop events, both selected filename rows, video/document remove buttons, uploaded/failed labels, progress display, disabled behavior, and the inline error.

- [ ] **Step 2: Run picker tests and verify RED**

Run: `npm test -- src/features/course-management/__tests__/item-attachments-picker.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement one accessible dropzone**

Use one hidden input:

```tsx
<input
  ref={inputRef}
  id="create-item-attachments"
  type="file"
  accept="video/*,.pdf,application/pdf"
  multiple
  onChange={(event) => {
    onFilesSelect(Array.from(event.target.files ?? []))
    event.target.value = ""
  }}
  disabled={disabled}
  className="sr-only"
/>
```

The visible region must be keyboard accessible with `role="button"`, Enter/Space browse behavior, drag/drop support, `aria-disabled`, and translated picker label/hint. Render separate selected rows below it for video and PDF; rows show filename, translated status, video progress while uploading, and a type-specific remove button only while that type is not uploaded and the picker is not disabled.

- [ ] **Step 4: Run picker tests**

Run: `npm test -- src/features/course-management/__tests__/item-attachments-picker.test.tsx`

Expected: PASS with no accessibility-query ambiguity or act warnings.

- [ ] **Step 5: Commit**

```bash
git add src/features/course-management/components/item-attachments-picker.tsx src/features/course-management/__tests__/item-attachments-picker.test.tsx
git commit -m "feat: add item attachment picker"
```

---

### Task 3: Replace Creation Dropzones With The Single Picker

**Files:**
- Modify: `src/features/course-management/components/create-item-dialog.tsx:3-21,62-114,220-289`
- Modify: `src/features/course-management/__tests__/create-item-dialog.test.tsx`
- Modify: `src/i18n/messages/en.json:417-429`
- Modify: `src/i18n/messages/ar.json:417-429`

**Interfaces:**
- Consumes: `mergeItemAttachmentFiles`, `getItemAttachmentType`, and `ItemAttachmentsPicker`
- Imports and re-exports `AttachmentUploadStatus` from `item-attachments-picker.tsx` so existing hook imports remain valid without a circular dependency.
- Preserves: `CreateItemPayload`, `CreateItemDialogProps`, `useCreateItemFlow`, and ItemList integration

- [ ] **Step 1: Replace two-input tests with failing one-input behavior tests**

Update the dialog tests to select through `#create-item-attachments` only:

```tsx
it("submits one payload after selecting video and PDF together", () => {
  const onSubmit = vi.fn()
  const { container } = renderDialog({ onSubmit })
  goToAttachments("Lesson resources")
  const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
  const pdf = new File(["pdf"], "notes.pdf", { type: "application/pdf" })

  fireEvent.change(container.querySelector("#create-item-attachments")!, {
    target: { files: [video, pdf] },
  })
  fireEvent.click(
    screen.getByRole("button", { name: "Create item with 2 files" })
  )

  expect(onSubmit).toHaveBeenCalledWith({
    title: "Lesson resources",
    videoFile: video,
    documentFile: pdf,
  })
})

it("shows an error and preserves files when two videos are selected", () => {
  const { container } = renderDialog()
  goToAttachments("Duplicate videos")
  const pdf = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
  selectFiles(container, [pdf])
  selectFiles(container, [
    new File(["one"], "one.mp4", { type: "video/mp4" }),
    new File(["two"], "two.mp4", { type: "video/mp4" }),
  ])

  expect(screen.getByText("Choose only one video.")).toBeDefined()
  expect(screen.getByText("notes.pdf")).toBeDefined()
})
```

Add cases for two PDFs, more than two files, unsupported files, incremental video-then-PDF selection, replacing only video, replacing only PDF, removing either pending file, and locked uploaded types. Keep programmatic close/reopen and retry-label coverage.

- [ ] **Step 2: Run dialog tests and verify RED**

Run: `npm test -- src/features/course-management/__tests__/create-item-dialog.test.tsx`

Expected: FAIL because the dialog still has two inputs.

- [ ] **Step 3: Add exact localized copy**

English:

```json
{
  "attachment_picker_label": "Choose video and PDF",
  "attachment_picker_hint": "Select up to one video and one PDF.",
  "too_many_attachments": "Choose no more than two files.",
  "duplicate_video": "Choose only one video.",
  "duplicate_document": "Choose only one PDF.",
  "unsupported_attachment": "Choose a video or PDF file.",
  "video_already_uploaded": "The video is already uploaded and cannot be replaced here.",
  "document_already_uploaded": "The PDF is already uploaded and cannot be replaced here.",
  "remove_video": "Remove video",
  "remove_document": "Remove PDF"
}
```

Arabic:

```json
{
  "attachment_picker_label": "اختر فيديو وملف PDF",
  "attachment_picker_hint": "اختر فيديو واحدًا وملف PDF واحدًا كحد أقصى.",
  "too_many_attachments": "اختر ملفين كحد أقصى.",
  "duplicate_video": "اختر فيديو واحدًا فقط.",
  "duplicate_document": "اختر ملف PDF واحدًا فقط.",
  "unsupported_attachment": "اختر ملف فيديو أو ملف PDF.",
  "video_already_uploaded": "تم رفع الفيديو بالفعل ولا يمكن استبداله هنا.",
  "document_already_uploaded": "تم رفع ملف PDF بالفعل ولا يمكن استبداله هنا.",
  "remove_video": "إزالة الفيديو",
  "remove_document": "إزالة ملف PDF"
}
```

- [ ] **Step 4: Integrate the picker atomically**

Replace `videoError` and `documentError` with one `attachmentError`. Implement:

```tsx
const handleFilesSelect = useCallback(
  (files: File[]) => {
    if (
      videoStatus === "uploaded" &&
      files.some((file) => getItemAttachmentType(file) === "video")
    ) {
      setAttachmentError(t("video_already_uploaded"))
      return
    }
    if (
      documentStatus === "uploaded" &&
      files.some((file) => getItemAttachmentType(file) === "document")
    ) {
      setAttachmentError(t("document_already_uploaded"))
      return
    }

    const result = mergeItemAttachmentFiles(
      { videoFile, documentFile },
      files
    )
    if (result.error) {
      setAttachmentError(t(result.error))
      return
    }
    setAttachmentError(null)
    setVideoFile(result.selection.videoFile)
    setDocumentFile(result.selection.documentFile)
  },
  [documentFile, documentStatus, t, videoFile, videoStatus]
)
```

Render one `ItemAttachmentsPicker`. Removal clears only the requested pending type and its error; ignore removal when the matching status is `uploaded`. Keep existing submit payload and action-label logic unchanged.

- [ ] **Step 5: Run focused feature tests**

Run: `npm test -- src/features/course-management/__tests__/item-upload-validation.test.ts src/features/course-management/__tests__/item-attachments-picker.test.tsx src/features/course-management/__tests__/create-item-dialog.test.tsx src/features/course-management/__tests__/use-create-item-flow.test.tsx src/features/course-management/__tests__/item-list-create.test.tsx`

Expected: PASS; upload orchestration and ItemList tests require only selector updates, not behavior changes.

- [ ] **Step 6: Run final verification**

Run: `npx eslint src/features/course-management/item-upload-validation.ts src/features/course-management/components/item-attachments-picker.tsx src/features/course-management/components/create-item-dialog.tsx src/features/course-management/__tests__/item-upload-validation.test.ts src/features/course-management/__tests__/item-attachments-picker.test.tsx src/features/course-management/__tests__/create-item-dialog.test.tsx src/features/course-management/__tests__/item-list-create.test.tsx`

Expected: PASS with no output.

Run: `npm run typecheck`

Expected: no new diagnostics in changed feature files; existing unrelated project diagnostics may remain.

Run: `npm test`

Expected: 0 failed test files and 0 failed tests.

- [ ] **Step 7: Commit**

```bash
git add src/features/course-management/components/create-item-dialog.tsx src/features/course-management/__tests__/create-item-dialog.test.tsx src/features/course-management/__tests__/item-list-create.test.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "fix: use one item attachment picker"
```

---

## Final Review Checklist

- [ ] One and only one file input appears in item creation step 2.
- [ ] The input accepts video and PDF and has `multiple=true`.
- [ ] Video-only, PDF-only, combined, and incremental selection work.
- [ ] Two videos, two PDFs, more than two files, unsupported files, and oversized video are rejected without losing valid selections.
- [ ] A later valid selection replaces only its own type.
- [ ] Uploaded attachment types remain locked during retry.
- [ ] Existing sequential upload, partial-failure retry, ItemList, and edit-item tests pass.
- [ ] No backend file is changed.
