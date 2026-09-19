# Dual-Media Item Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let teachers create one lesson item with a video, a PDF, or both, while preserving successful uploads and retrying only failures.

**Architecture:** Add a creation-specific two-step dialog and a focused `useCreateItemFlow` hook. The dialog owns title and file selection; the hook creates one item and sequentially drives the existing video and document upload APIs, retaining the item ID and completed attachment state across retries. Keep the existing `UploadDialog` unchanged in purpose for adding one attachment to an existing item.

**Tech Stack:** Next.js 16, React 19, TypeScript, TanStack Query, next-intl, Vitest, Testing Library, Bunny TUS video uploads, presigned document uploads.

## Global Constraints

- Dashboard repository only: do not modify any file under `../elemni/`.
- No backend schemas, endpoints, models, migrations, or tests.
- A new item requires a non-empty title and at least one selected attachment.
- Video-only, PDF-only, and video-plus-PDF creation must all work.
- When both are selected, upload video first and PDF second.
- Preserve successful attachments after partial failure and retry only incomplete attachments.
- Closing after partial failure preserves the partial item; do not roll back or delete remote assets.
- Keep existing item edit, reorder, deletion, and single-attachment upload behavior.

---

## File Structure

- Create `src/features/course-management/item-upload-validation.ts`: shared video/PDF validation used by both upload dialogs.
- Create `src/features/course-management/components/create-item-dialog.tsx`: two-step title and attachment-selection UI only.
- Create `src/features/course-management/hooks/use-create-item-flow.ts`: item creation, sequential upload orchestration, per-file status, and retry state.
- Modify `src/features/course-management/components/upload-dialog.tsx`: consume shared validation without changing existing behavior.
- Modify `src/features/course-management/components/item-list.tsx`: replace the create-only `UploadDialog` state and handler with the new dialog and hook.
- Modify `src/i18n/messages/en.json` and `src/i18n/messages/ar.json`: add creation-specific labels, statuses, validation, and retry copy.
- Create focused tests beside existing course-management tests for validation, dialog behavior, flow orchestration, and final ItemList wiring.

---

### Task 1: Share Attachment Validation

**Files:**
- Create: `src/features/course-management/item-upload-validation.ts`
- Create: `src/features/course-management/__tests__/item-upload-validation.test.ts`
- Modify: `src/features/course-management/components/upload-dialog.tsx:20-92`

**Interfaces:**
- Produces: `UploadType = "video" | "document"`
- Produces: `UploadValidationError = "invalid_video" | "video_too_large" | "invalid_document"`
- Produces: `validateItemUploadFile(file: File, type: UploadType): UploadValidationError | null`
- Consumed by: `UploadDialog` and Task 2's `CreateItemDialog`

- [ ] **Step 1: Write failing validation tests**

```ts
import { describe, expect, it } from "vitest"
import { validateItemUploadFile } from "../item-upload-validation"

describe("validateItemUploadFile", () => {
  it("accepts valid videos and PDFs", () => {
    expect(
      validateItemUploadFile(
        new File(["video"], "lesson.mp4", { type: "video/mp4" }),
        "video"
      )
    ).toBeNull()
    expect(
      validateItemUploadFile(
        new File(["pdf"], "notes.pdf", { type: "application/pdf" }),
        "document"
      )
    ).toBeNull()
  })

  it("rejects the wrong type for each attachment slot", () => {
    expect(
      validateItemUploadFile(
        new File(["text"], "notes.txt", { type: "text/plain" }),
        "video"
      )
    ).toBe("invalid_video")
    expect(
      validateItemUploadFile(
        new File(["image"], "page.png", { type: "image/png" }),
        "document"
      )
    ).toBe("invalid_document")
  })

  it("rejects videos larger than 500 MB", () => {
    const file = new File(["video"], "large.mp4", { type: "video/mp4" })
    Object.defineProperty(file, "size", { value: 500 * 1024 * 1024 + 1 })

    expect(validateItemUploadFile(file, "video")).toBe("video_too_large")
  })
})
```

- [ ] **Step 2: Run the validation test and verify RED**

Run: `npm test -- src/features/course-management/__tests__/item-upload-validation.test.ts`

Expected: FAIL because `item-upload-validation.ts` does not exist.

- [ ] **Step 3: Implement the shared validator**

```ts
export type UploadType = "video" | "document"

export type UploadValidationError =
  | "invalid_video"
  | "video_too_large"
  | "invalid_document"

export const MAX_VIDEO_SIZE = 500 * 1024 * 1024

export function validateItemUploadFile(
  file: File,
  type: UploadType
): UploadValidationError | null {
  if (type === "video") {
    if (!file.type.startsWith("video/")) return "invalid_video"
    if (file.size > MAX_VIDEO_SIZE) return "video_too_large"
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

- [ ] **Step 4: Refactor the existing single-file dialog to use the validator**

In `upload-dialog.tsx`, import `UploadType` and `validateItemUploadFile`, re-export `UploadType` for existing consumers, remove the local size constant, and replace the validation branches in `handleFile`:

```ts
import {
  type UploadType,
  validateItemUploadFile,
} from "../item-upload-validation"

export type { UploadType } from "../item-upload-validation"

const handleFile = useCallback(
  (selected: File | null) => {
    if (!selected) return
    const validationKey = validateItemUploadFile(selected, selectedType)
    if (validationKey) {
      setValidationError(t(validationKey))
      return
    }
    setValidationError(null)
    setFile(selected)
  },
  [selectedType, t]
)
```

- [ ] **Step 5: Run focused validation and existing media tests**

Run: `npm test -- src/features/course-management/__tests__/item-upload-validation.test.ts src/features/course-management/__tests__/item-card-media.test.tsx`

Expected: PASS; existing edit-dialog upload behavior remains green.

- [ ] **Step 6: Commit the validation boundary**

```bash
git add src/features/course-management/item-upload-validation.ts src/features/course-management/components/upload-dialog.tsx src/features/course-management/__tests__/item-upload-validation.test.ts
git commit -m "refactor: share item upload validation"
```

---

### Task 2: Build The Dual-Attachment Creation Dialog

**Files:**
- Create: `src/features/course-management/components/create-item-dialog.tsx`
- Create: `src/features/course-management/__tests__/create-item-dialog.test.tsx`
- Modify: `src/i18n/messages/en.json:344-412`
- Modify: `src/i18n/messages/ar.json:344-412`

**Interfaces:**
- Consumes: `validateItemUploadFile(file, type)` from Task 1
- Produces: `CreateItemPayload = { title: string; videoFile: File | null; documentFile: File | null }`
- Produces: `AttachmentUploadStatus = "idle" | "uploading" | "uploaded" | "failed"`
- Produces: `CreateItemDialog(props)` with `open`, `onOpenChange`, `onSubmit`, `uploading`, `videoStatus`, `documentStatus`, `videoProgress`, `error`
- Consumed by: Task 4's `ItemList` integration

- [ ] **Step 1: Add failing dialog tests for selection and validation**

Create a test renderer using `NextIntlClientProvider` and `src/i18n/messages/en.json`, then cover the externally visible contract:

```tsx
it("submits one payload containing both selected files", () => {
  const onSubmit = vi.fn()
  const { container } = renderDialog({ onSubmit })

  fireEvent.change(screen.getByLabelText("Item title"), {
    target: { value: "Lesson resources" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Next" }))

  const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
  const document = new File(["pdf"], "notes.pdf", {
    type: "application/pdf",
  })
  fireEvent.change(container.querySelector("#create-item-video")!, {
    target: { files: [video] },
  })
  fireEvent.change(container.querySelector("#create-item-document")!, {
    target: { files: [document] },
  })
  fireEvent.click(
    screen.getByRole("button", { name: "Create item with 2 files" })
  )

  expect(onSubmit).toHaveBeenCalledWith({
    title: "Lesson resources",
    videoFile: video,
    documentFile: document,
  })
})

it("requires at least one attachment", () => {
  renderDialog()
  fireEvent.change(screen.getByLabelText("Item title"), {
    target: { value: "Empty item" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Next" }))

  expect(screen.getByRole("button", { name: "Create item" })).toBeDisabled()
  expect(screen.getByText("Add at least one video or PDF.")).toBeDefined()
})

it("does not dismiss while an upload is active", () => {
  const onOpenChange = vi.fn()
  renderDialog({ onOpenChange, uploading: true })

  fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
  expect(onOpenChange).not.toHaveBeenCalledWith(false)
})
```

Also assert video-only and PDF-only selection, invalid file messages, filename replacement/removal, `Uploaded`/`Failed` status labels, and `Retry PDF` when only the document status is failed.

- [ ] **Step 2: Run dialog tests and verify RED**

Run: `npm test -- src/features/course-management/__tests__/create-item-dialog.test.tsx`

Expected: FAIL because `CreateItemDialog` does not exist and translation keys are missing.

- [ ] **Step 3: Add exact English and Arabic copy**

Add these keys under `items` in both locale files:

```json
{
  "create_step_count": "Step {step} of 2",
  "create_attachments": "Add attachments",
  "create_attachments_desc": "Add a video, a PDF, or both.",
  "attachment_optional": "Optional",
  "attachment_selected": "Selected",
  "attachment_uploaded": "Uploaded",
  "attachment_failed": "Failed",
  "select_one_attachment": "Add at least one video or PDF.",
  "create_item": "Create item",
  "create_item_with_two_files": "Create item with 2 files",
  "retry_video": "Retry video",
  "retry_document": "Retry PDF",
  "retry_failed_uploads": "Retry failed uploads"
}
```

Arabic values:

```json
{
  "create_step_count": "الخطوة {step} من 2",
  "create_attachments": "إضافة مرفقات",
  "create_attachments_desc": "أضف فيديو أو ملف PDF أو كليهما.",
  "attachment_optional": "اختياري",
  "attachment_selected": "تم الاختيار",
  "attachment_uploaded": "تم الرفع",
  "attachment_failed": "فشل",
  "select_one_attachment": "أضف فيديو واحدًا أو ملف PDF واحدًا على الأقل.",
  "create_item": "إنشاء العنصر",
  "create_item_with_two_files": "إنشاء العنصر بملفين",
  "retry_video": "إعادة رفع الفيديو",
  "retry_document": "إعادة رفع ملف PDF",
  "retry_failed_uploads": "إعادة رفع الملفات المتعثرة"
}
```

- [ ] **Step 4: Implement the dialog as a UI-only component**

Use this public contract:

```tsx
export type AttachmentUploadStatus =
  | "idle"
  | "uploading"
  | "uploaded"
  | "failed"

export type CreateItemPayload = {
  title: string
  videoFile: File | null
  documentFile: File | null
}

type CreateItemDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CreateItemPayload) => void
  uploading: boolean
  videoStatus: AttachmentUploadStatus
  documentStatus: AttachmentUploadStatus
  videoProgress: number
  error: string | null
}
```

Implementation requirements:

- Reset title, selected files, current step, and local validation errors only on a new closed-to-open transition.
- Step 1 contains the labeled title input and existing title length limit.
- Step 2 renders two compact rows, each containing a `FileDropzone` with stable IDs `create-item-video` and `create-item-document`.
- Validate each selected file with `validateItemUploadFile`; retain the previous valid selection when a replacement is invalid.
- Disable changing or removing a row whose status is `uploaded` so retries cannot replace successful work.
- Derive the action label from selected files and failure state: `Retry video`, `Retry PDF`, `Retry failed uploads`, `Create item with 2 files`, or `Create item`.
- Block `onOpenChange(false)` and Cancel while `uploading` is true.
- Keep the existing dialog width and responsive behavior used by `UploadDialog`.

- [ ] **Step 5: Run dialog and validation tests**

Run: `npm test -- src/features/course-management/__tests__/create-item-dialog.test.tsx src/features/course-management/__tests__/item-upload-validation.test.ts`

Expected: PASS with no React act warnings.

- [ ] **Step 6: Commit the creation dialog**

```bash
git add src/features/course-management/components/create-item-dialog.tsx src/features/course-management/__tests__/create-item-dialog.test.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add dual-attachment item dialog"
```

---

### Task 3: Implement Retryable Sequential Upload Orchestration

**Files:**
- Create: `src/features/course-management/hooks/use-create-item-flow.ts`
- Create: `src/features/course-management/__tests__/use-create-item-flow.test.tsx`

**Interfaces:**
- Consumes: `CreateItemPayload` and `AttachmentUploadStatus` from Task 2
- Consumes: existing `requestVideoUpload`, `confirmVideoUpload`, `requestUploadUrl`, `confirmUpload`, `uploadVideoToBunnyTus`, and `uploadToPresignedUrl`
- Produces: `useCreateItemFlow(options)` returning `submit`, `reset`, `uploading`, `videoStatus`, `documentStatus`, `videoProgress`, and `error`
- Consumed by: Task 4's `ItemList`

- [ ] **Step 1: Write a failing hook test for successful sequential upload**

Mock only the existing upload actions and direct upload adapters. Pass real callback spies to the hook:

```tsx
const bareItem: ItemOut = {
  id: 3,
  lesson_id: 2,
  title: "Lesson resources",
  bunny_stream_id: null,
  bunny_stream_status: null,
  document_path: null,
  exam_id: null,
  order: 1,
}
const videoItem: ItemOut = {
  ...bareItem,
  bunny_stream_id: "video-guid",
  bunny_stream_status: "finished",
}
const completeItem: ItemOut = {
  ...videoItem,
  document_path: "courses/1/lessons/2/items/3.pdf",
}
const videoFile = new File(["video"], "lesson.mp4", { type: "video/mp4" })
const pdfFile = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
const payloadWithBothFiles: CreateItemPayload = {
  title: "Lesson resources",
  videoFile,
  documentFile: pdfFile,
}
const videoCredentialsResult = {
  success: true as const,
  data: {
    video_id: "video-guid",
    library_id: 42,
    expiration_time: 2_000_000_000,
    signature: "signature",
    embed_url: "https://player.example.test/embed/42/video-guid",
  },
}
const documentUrlResult = {
  success: true as const,
  data: {
    upload_url: "https://storage.example.test/signed",
    key: "courses/1/lessons/2/items/3.pdf",
    public_url: "https://cdn.example.test/courses/1/lessons/2/items/3.pdf",
  },
}
const createItem = vi.fn(async () => bareItem)
const onItemUpdated = vi.fn()
const onCurriculumCommitted = vi.fn()
const onComplete = vi.fn()

function flowOptions(
  overrides: Partial<UseCreateItemFlowOptions> = {}
): UseCreateItemFlowOptions {
  return {
    courseId: 1,
    lessonId: 2,
    createItem,
    onItemUpdated,
    onCurriculumCommitted,
    onComplete,
    uploadErrorMessage: "Upload failed",
    ...overrides,
  }
}

it("creates one item and uploads video before document", async () => {
  const calls: string[] = []
  createItem.mockImplementationOnce(async () => {
    calls.push("create")
    return bareItem
  })
  actions.requestVideoUpload.mockImplementation(async () => {
    calls.push("request-video")
    return videoCredentialsResult
  })
  uploads.uploadVideoToBunnyTus.mockImplementation(async () => {
    calls.push("upload-video")
  })
  actions.confirmVideoUpload.mockImplementation(async () => {
    calls.push("confirm-video")
    return { success: true, data: videoItem }
  })
  actions.requestUploadUrl.mockImplementation(async () => {
    calls.push("request-document")
    return documentUrlResult
  })
  uploads.uploadToPresignedUrl.mockImplementation(async () => {
    calls.push("upload-document")
    return { ok: true }
  })
  actions.confirmUpload.mockImplementation(async () => {
    calls.push("confirm-document")
    return { success: true, data: completeItem }
  })

  const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
  await act(() => result.current.submit(payloadWithBothFiles))

  expect(calls).toEqual([
    "create",
    "request-video",
    "upload-video",
    "confirm-video",
    "request-document",
    "upload-document",
    "confirm-document",
  ])
  expect(createItem).toHaveBeenCalledOnce()
  expect(result.current.videoStatus).toBe("uploaded")
  expect(result.current.documentStatus).toBe("uploaded")
})
```

- [ ] **Step 2: Add failing partial-failure and retry coverage**

```tsx
it("keeps the item and video, then retries only the failed document", async () => {
  actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
  actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })
  actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
  actions.confirmUpload.mockResolvedValue({ success: true, data: completeItem })
  uploads.uploadToPresignedUrl
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true })

  const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
  await act(() => result.current.submit(payloadWithBothFiles))

  expect(result.current.videoStatus).toBe("uploaded")
  expect(result.current.documentStatus).toBe("failed")
  expect(createItem).toHaveBeenCalledOnce()
  expect(actions.requestVideoUpload).toHaveBeenCalledOnce()

  await act(() => result.current.submit(payloadWithBothFiles))

  expect(createItem).toHaveBeenCalledOnce()
  expect(actions.requestVideoUpload).toHaveBeenCalledOnce()
  expect(actions.requestUploadUrl).toHaveBeenCalledTimes(2)
  expect(result.current.documentStatus).toBe("uploaded")
  expect(onComplete).toHaveBeenCalledOnce()
})
```

Add separate tests for video-only, PDF-only, failure before item creation, `reset()`, cache callback invocation after each confirmation, curriculum notification after creation and each confirmation, and duplicate-submit protection while `uploading` is true.

- [ ] **Step 3: Run hook tests and verify RED**

Run: `npm test -- src/features/course-management/__tests__/use-create-item-flow.test.tsx`

Expected: FAIL because `useCreateItemFlow` does not exist.

- [ ] **Step 4: Implement the hook with retained flow state**

Use this exact options and return shape:

```ts
export type UseCreateItemFlowOptions = {
  courseId: number
  lessonId: number
  createItem: (data: { title: string }) => Promise<ItemOut>
  onItemUpdated: (item: ItemOut) => void
  onCurriculumCommitted: () => void | Promise<void>
  onComplete: () => void
  uploadErrorMessage: string
}

type CreateItemFlow = {
  submit: (payload: CreateItemPayload) => Promise<void>
  reset: () => void
  uploading: boolean
  videoStatus: AttachmentUploadStatus
  documentStatus: AttachmentUploadStatus
  videoProgress: number
  error: string | null
}
```

Implementation rules:

- Store the created `ItemOut` in a ref so it survives render cycles and retries without causing duplicate creation.
- Store completion state in refs as well as React state so a second submit cannot race a pending state update.
- Guard against duplicate submits with an `uploadingRef` set synchronously before the first `await`.
- Create only when no retained item exists, then call `onCurriculumCommitted`.
- Skip video when no video is selected or video completion is retained.
- Set video status to `uploading`, pass `setVideoProgress` to TUS, confirm, retain the returned item, call `onItemUpdated`, mark uploaded, and notify curriculum.
- Skip document when no PDF is selected or document completion is retained.
- Set document status to `uploading`, request and perform the presigned upload, require `response.ok`, confirm, retain the returned item, call `onItemUpdated`, mark uploaded, and notify curriculum.
- Track the currently active attachment locally so catch marks only that attachment `failed`.
- Prefer action-result error messages; otherwise use `uploadErrorMessage`.
- Call `onComplete` only when every selected attachment is confirmed.
- `reset()` clears the retained item, completion refs, statuses, progress, and error, and is ignored while uploading.

- [ ] **Step 5: Run hook tests and verify GREEN**

Run: `npm test -- src/features/course-management/__tests__/use-create-item-flow.test.tsx`

Expected: PASS for all success, failure, retry, and reset cases.

- [ ] **Step 6: Commit the orchestration hook**

```bash
git add src/features/course-management/hooks/use-create-item-flow.ts src/features/course-management/__tests__/use-create-item-flow.test.tsx
git commit -m "feat: orchestrate dual item uploads"
```

---

### Task 4: Wire Creation Into ItemList

**Files:**
- Modify: `src/features/course-management/components/item-list.tsx:3-43,121-130,191-306,392-406`
- Create: `src/features/course-management/__tests__/item-list-create.test.tsx`

**Interfaces:**
- Consumes: `CreateItemDialog` from Task 2
- Consumes: `useCreateItemFlow` from Task 3
- Preserves: existing `ItemList` props and all edit/reorder behavior

- [ ] **Step 1: Write a failing ItemList integration test**

Render `ItemList` inside `NextIntlClientProvider`, `QueryClientProvider`, and `CourseBuilderBridgeProvider`. Mock `useItemsQuery` to return an empty successful list and `useItemMutations` to return a create mutation. Keep the real `CreateItemDialog` and `useCreateItemFlow`; mock only network actions and direct upload adapters.

```tsx
const videoFile = new File(["video"], "lesson.mp4", { type: "video/mp4" })
const pdfFile = new File(["pdf"], "notes.pdf", { type: "application/pdf" })

function renderItemList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <CourseBuilderBridgeProvider enabled={false}>
          <ItemList
            initialItems={[]}
            courseId={1}
            lessonId={2}
            error={null}
          />
        </CourseBuilderBridgeProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}

function selectFile(container: HTMLElement, selector: string, file: File) {
  fireEvent.change(container.querySelector(selector)!, {
    target: { files: [file] },
  })
}

it("creates one item with both files from Add Item", async () => {
  const { container } = renderItemList()
  fireEvent.click(screen.getByRole("button", { name: "Add Item" }))
  fireEvent.change(screen.getByLabelText("Item title"), {
    target: { value: "Lesson resources" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Next" }))

  selectFile(container, "#create-item-video", videoFile)
  selectFile(container, "#create-item-document", pdfFile)
  fireEvent.click(
    screen.getByRole("button", { name: "Create item with 2 files" })
  )

  await waitFor(() => expect(mutations.create.mutateAsync).toHaveBeenCalledOnce())
  expect(mutations.create.mutateAsync).toHaveBeenCalledWith({
    title: "Lesson resources",
  })
  await waitFor(() => expect(actions.confirmUpload).toHaveBeenCalledOnce())
  expect(actions.requestVideoUpload.mock.invocationCallOrder[0]).toBeLessThan(
    actions.requestUploadUrl.mock.invocationCallOrder[0]
  )
})
```

Add an integration assertion that after PDF failure, clicking `Retry PDF` leaves `create.mutateAsync` and `requestVideoUpload` at one call while `requestUploadUrl` reaches two calls.

- [ ] **Step 2: Run the ItemList integration test and verify RED**

Run: `npm test -- src/features/course-management/__tests__/item-list-create.test.tsx`

Expected: FAIL because ItemList still renders the single-file creation wizard.

- [ ] **Step 3: Replace create-only upload state with the new flow**

In `item-list.tsx`:

- Remove `createUploadType`, `createUploading`, `createUploadProgress`, `createdUploadItemRef`, and `handleCreateUpload`.
- Remove create-flow imports for direct upload actions and adapters; ItemCard keeps its own existing edit upload behavior.
- Keep `createUploadOpen` and rename it to `createDialogOpen` for clarity.
- Extract cache replacement from the existing editor callback so the creation flow can update cache without sending duplicate curriculum notifications:

```tsx
const cacheItemUpdate = useCallback(
  (updated: ItemOut) => {
    queryClient.setQueryData<ItemOut[]>(queryKey, (current) =>
      current?.map((item) => (item.id === updated.id ? updated : item))
    )
  },
  [queryClient, queryKey]
)

const handleUpdated = useCallback(
  (updated: ItemOut) => {
    cacheItemUpdate(updated)
    void notifyCurriculumCommitted()
  },
  [cacheItemUpdate, notifyCurriculumCommitted]
)
```

- Construct the hook after these callbacks:

```tsx
const createFlow = useCreateItemFlow({
  courseId,
  lessonId,
  createItem: create.mutateAsync,
  onItemUpdated: cacheItemUpdate,
  onCurriculumCommitted: notifyCurriculumCommitted,
  onComplete: () => {
    setCreateDialogOpen(false)
    toast.success(t("upload_success"))
  },
  uploadErrorMessage: t("upload_error"),
})
```

- `openCreateUpload` becomes `openCreateDialog`; it clears the list error, calls `createFlow.reset()`, and opens the dialog.
- On user close, call `createFlow.reset()` only after `onOpenChange(false)` is accepted. This forgets retry state but preserves the partial item already held in the query cache.
- Render:

```tsx
<CreateItemDialog
  open={createDialogOpen}
  onOpenChange={(open) => {
    setCreateDialogOpen(open)
    if (!open) createFlow.reset()
  }}
  onSubmit={(payload) => void createFlow.submit(payload)}
  uploading={createFlow.uploading}
  videoStatus={createFlow.videoStatus}
  documentStatus={createFlow.documentStatus}
  videoProgress={createFlow.videoProgress}
  error={createFlow.error}
/>
```

- Keep both Add Item buttons wired to `openCreateDialog`.

- [ ] **Step 4: Run creation and existing item media tests**

Run: `npm test -- src/features/course-management/__tests__/item-list-create.test.tsx src/features/course-management/__tests__/create-item-dialog.test.tsx src/features/course-management/__tests__/use-create-item-flow.test.tsx src/features/course-management/__tests__/item-card-media.test.tsx`

Expected: PASS; both creation and existing edit attachment behavior work.

- [ ] **Step 5: Run static checks and the full dashboard suite**

Run: `npm run typecheck`

Expected: PASS. If the known unrelated `TopbarProps.userRole` baseline error is still present, record it verbatim and verify no new diagnostics reference changed files.

Run: `npx eslint src/features/course-management/item-upload-validation.ts src/features/course-management/components/upload-dialog.tsx src/features/course-management/components/create-item-dialog.tsx src/features/course-management/components/item-list.tsx src/features/course-management/hooks/use-create-item-flow.ts src/features/course-management/__tests__/item-upload-validation.test.ts src/features/course-management/__tests__/create-item-dialog.test.tsx src/features/course-management/__tests__/use-create-item-flow.test.tsx src/features/course-management/__tests__/item-list-create.test.tsx`

Expected: PASS with no output.

Run: `npm test`

Expected: 0 failed test files and 0 failed tests. If the known focus-timing test in `builder-selection.test.tsx` fails, rerun that file once to distinguish its existing intermittent failure from this feature; do not change unrelated production code.

- [ ] **Step 6: Commit the ItemList integration**

```bash
git add src/features/course-management/components/item-list.tsx src/features/course-management/__tests__/item-list-create.test.tsx
git commit -m "feat: create items with video and document"
```

---

## Final Review Checklist

- [ ] Confirm `git diff --check` reports no whitespace errors.
- [ ] Confirm `git status --short` contains no backend repository changes.
- [ ] Confirm video-only, PDF-only, both-file, partial-failure, and retry tests all pass.
- [ ] Confirm existing `item-card-media.test.tsx` remains green.
- [ ] Confirm English and Arabic creation copy is complete.
- [ ] Confirm the final diff does not add a combined backend endpoint or modify API contracts.
