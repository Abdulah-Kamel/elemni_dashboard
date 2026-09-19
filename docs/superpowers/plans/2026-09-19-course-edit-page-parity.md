# Course Edit Page Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dedicated course workspace the only course editing surface, add chapter-mode and archive editing, and synchronize dashboard course contracts with the existing backend API.

**Architecture:** Keep `CreateCourseDialog` as the only modal workflow and use `CourseWorkspace` for all edits. Reuse the existing course PATCH mutation, add focused controlled components for structure and archive confirmations, and update React Query caches through the existing mutation hook. Remove dead modal-edit code rather than maintaining two editing paths.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, TanStack React Query v5, Zod, Vitest, Testing Library, Base UI-based shared components.

## Global Constraints

- This is a dashboard-only change in `elemni_dashboard/`; do not modify any file under the backend project `elemni/`.
- `CreateCourseDialog` remains the only course dialog; `CourseWorkspace` is the sole editing surface.
- Creation remains unarchived and unpublished; do not add archive UI or payload fields to course creation.
- Changing `use_chapters` requires explicit confirmation before PATCH.
- Archiving must send `{ is_archived: true, is_published: false }` in one PATCH request.
- Unarchiving must send `{ is_archived: false }` and must not republish the course.
- Archived courses cannot be published from the workspace.
- The course list must offer `All`, `Published`, `Draft`, and `Archived`; Published and Draft exclude archived courses.
- Add `is_archived`, `total_duration_minutes`, and `bunny_collection_id` to the frontend response contract, but never display or edit `bunny_collection_id`.
- Do not remove the backend legacy `duration_minutes` column or add dependencies.
- Preserve the existing live preview, cover upload, curriculum placement, chapter/lesson editor, and course-card navigation.
- Follow test-driven development: each behavior test must fail for the expected reason before production code changes.

---

## File Structure

### Create

- `src/features/course-management/components/course-structure-control.tsx`: controlled flat/chapter selector and migration confirmation dialog.
- `src/features/course-management/components/archive-course-control.tsx`: controlled archive/unarchive action and archive confirmation dialog.

### Modify

- `src/features/shell/schema.ts`: complete `CourseOut` response contract.
- `src/features/shell/schema.test.ts`: response parsing coverage.
- `src/features/course-management/schema.ts`: archive update field and removal of dead edit-form mapper.
- `src/features/course-management/__tests__/schema.test.ts`: PATCH schema regressions.
- `src/features/course-management/__tests__/mocks.ts`: complete course fixtures.
- `src/features/course-management/components/course-form.tsx`: creation-only form.
- `src/features/course-management/components/create-course-dialog.tsx`: remove obsolete `mode` prop.
- `src/features/course-management/__tests__/course-form.test.tsx`: creation-only behavior.
- `src/features/course-management/__tests__/locale-switch.test.tsx`: remove edit-dialog form cases while retaining create locale coverage.
- `src/features/student-preview/course-workspace.tsx`: chapter structure, archive state, confirmations, and cache-backed updates.
- `app/[locale]/(teacher)/courses/[courseId]/page.tsx`: pass initial chapter/archive state.
- `src/features/student-preview/__tests__/course-workspace.test.tsx`: workspace behavior regressions.
- `src/features/course-management/components/publish-switch.tsx`: controlled synchronization and archived disabled state.
- `src/features/course-management/__tests__/publish-switch.test.tsx`: disabled and callback behavior.
- `src/features/course-management/components/course-card.tsx`: archived badge.
- `src/features/course-management/components/course-list.tsx`: archived filter semantics.
- `src/features/course-management/__tests__/course-card.test.tsx`: archived badge regression.
- `src/features/course-management/__tests__/course-list.test.tsx`: filter composition regressions.
- `src/i18n/messages/ar.json`: Arabic structure/archive/filter copy.
- `src/i18n/messages/en.json`: English structure/archive/filter copy.

### Delete

- `src/features/course-management/components/edit-course-dialog.tsx`
- `src/features/course-management/components/course-card-actions.tsx`
- `src/features/course-management/components/publish-toggle.tsx`
- `src/features/course-management/__tests__/course-card-actions.test.tsx`
- `src/features/course-management/__tests__/publish-toggle.test.tsx`
- `src/features/course-management/__tests__/rtl.test.tsx`

---

### Task 1: Synchronize Course Contracts

**Files:**
- Modify: `src/features/shell/schema.ts:22-38`
- Modify: `src/features/shell/schema.test.ts`
- Modify: `src/features/course-management/schema.ts:46-57`
- Modify: `src/features/course-management/__tests__/schema.test.ts:91-130`
- Modify: `src/features/course-management/__tests__/mocks.ts:6-37,103-117`
- Modify: `src/features/course-management/__tests__/course-card.test.tsx:18-32`
- Modify: `src/features/student-preview/__tests__/build-teacher-preview-model.test.ts:21-36`

**Interfaces:**
- Produces: `CourseOut.is_archived: boolean`
- Produces: `CourseOut.total_duration_minutes: number | null`
- Produces: `CourseOut.bunny_collection_id: string | null`
- Produces: `CourseUpdate.is_archived?: boolean | null`
- Preserves: `CourseUpdate.description` accepts `null`; `CourseUpdate.price` accepts numeric zero and string `"0.00"`

- [ ] **Step 1: Add failing response-contract tests**

In `src/features/shell/schema.test.ts`, add a backend-shaped course fixture and assertions:

```ts
import { courseOutSchema } from "./schema"

it("parses archive, duration, and collection fields from CourseOut", () => {
  const course = courseOutSchema.parse({
    id: 1,
    title: "Physics",
    description: null,
    img: null,
    price: "0.00",
    is_published: false,
    is_archived: true,
    use_chapters: false,
    total_duration_minutes: 95,
    subject_id: 2,
    subject_name: "Physics",
    teacher_profile_id: 7,
    grade_id: 3,
    stream_id: 1,
    created_by_id: 9,
    created_at: "2026-09-19T12:00:00Z",
    bunny_collection_id: "collection-123",
  })

  expect(course.is_archived).toBe(true)
  expect(course.total_duration_minutes).toBe(95)
  expect(course.bunny_collection_id).toBe("collection-123")
})
```

Add a second case with both nullable fields set to `null`.

- [ ] **Step 2: Add failing PATCH-contract tests**

In `src/features/course-management/__tests__/schema.test.ts`, add:

```ts
it("accepts archive state in a partial update", () => {
  expect(courseUpdateSchema.parse({ is_archived: true })).toEqual({
    is_archived: true,
  })
})

it("preserves explicit clear and zero values", () => {
  expect(
    courseUpdateSchema.parse({ description: null, price: 0 })
  ).toEqual({ description: null, price: 0 })
})
```

- [ ] **Step 3: Run the tests and verify RED**

Run:

```bash
npm test -- src/features/shell/schema.test.ts src/features/course-management/__tests__/schema.test.ts
```

Expected: FAIL because `is_archived`, `total_duration_minutes`, and `bunny_collection_id` are not present in the parsed output/update schema.

- [ ] **Step 4: Implement the response and update schemas**

Update `courseOutSchema` with required backend fields:

```ts
is_published: z.boolean(),
is_archived: z.boolean(),
use_chapters: z.boolean(),
total_duration_minutes: z.number().int().nonnegative().nullable(),
// ...existing placement and ownership fields...
bunny_collection_id: z.string().nullable(),
```

Update `courseUpdateSchema`:

```ts
is_published: z.boolean().nullable().optional(),
is_archived: z.boolean().nullable().optional(),
use_chapters: z.boolean().nullable().optional(),
```

Do not add `is_archived` to `courseCreateSchema`.

- [ ] **Step 5: Update typed fixtures with backend defaults**

In `src/features/shell/schema.test.ts`, `src/features/course-management/__tests__/mocks.ts`, `src/features/course-management/__tests__/course-card.test.tsx`, and `src/features/student-preview/__tests__/build-teacher-preview-model.test.ts`, add explicit values to every complete course fixture:

```ts
is_archived: false,
total_duration_minutes: null,
bunny_collection_id: null,
```

In `src/features/course-management/__tests__/mocks.ts`, ensure PATCH responses spread request fields so archive tests receive the updated state.

- [ ] **Step 6: Verify GREEN and type consistency**

Run:

```bash
npm test -- src/features/shell/schema.test.ts src/features/course-management/__tests__/schema.test.ts
npm run typecheck
```

Expected: contract tests PASS. If project-wide typecheck reports existing unrelated errors, confirm no error references a modified course file and record the baseline output.

- [ ] **Step 7: Commit**

```bash
git add src/features/shell/schema.ts src/features/shell/schema.test.ts src/features/course-management/schema.ts src/features/course-management/__tests__/schema.test.ts src/features/course-management/__tests__/mocks.ts src/features/course-management/__tests__/course-card.test.tsx src/features/student-preview/__tests__/build-teacher-preview-model.test.ts
git commit -m "fix: synchronize dashboard course contracts"
```

---

### Task 2: Remove Modal Editing And Simplify Creation

**Files:**
- Delete: `src/features/course-management/components/edit-course-dialog.tsx`
- Delete: `src/features/course-management/components/course-card-actions.tsx`
- Delete: `src/features/course-management/components/publish-toggle.tsx`
- Delete: `src/features/course-management/__tests__/course-card-actions.test.tsx`
- Delete: `src/features/course-management/__tests__/publish-toggle.test.tsx`
- Delete: `src/features/course-management/__tests__/rtl.test.tsx`
- Modify: `src/features/course-management/components/course-form.tsx`
- Modify: `src/features/course-management/components/create-course-dialog.tsx:165-174`
- Modify: `src/features/course-management/schema.ts:65-78,118-132`
- Modify: `src/features/course-management/__tests__/course-form.test.tsx`
- Modify: `src/features/course-management/__tests__/locale-switch.test.tsx`
- Modify: `src/features/course-management/__tests__/form-mapping.test.ts`
- Modify: `src/features/course-management/__tests__/schema.test.ts:353-388`

**Interfaces:**
- Produces: `CourseForm` accepts no `mode` prop and only represents creation.
- Preserves: `CourseForm` still emits `CourseFormValues` including `useChapters`.
- Removes: `formValuesToCourseUpdate`; workspace updates continue building `CourseUpdate` directly.
- Removes: all production imports of `EditCourseDialog`, `CourseCardActions`, and `PublishToggle`.

- [ ] **Step 1: Convert form tests to the desired creation-only API**

Remove the edit-mode describe block from `course-form.test.tsx`. Remove every `mode="create"` prop so creation tests render:

```tsx
<CourseForm
  subjects={mockSubjects}
  grades={mockGrades}
  streams={mockStreams}
  onChange={() => {}}
  disabled={false}
/>
```

In `locale-switch.test.tsx`, retain locale assertions for the creation form and remove edit-form cases. In mapper tests, remove `formValuesToCourseUpdate` imports and its describe blocks.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/features/course-management/__tests__/course-form.test.tsx src/features/course-management/__tests__/locale-switch.test.tsx src/features/course-management/__tests__/form-mapping.test.ts
```

Expected: TypeScript/test transform failure because `CourseForm` still requires `mode`.

- [ ] **Step 3: Simplify `CourseForm`**

Remove the `mode` prop, `isPublished` from `emptyForm`, and the edit-only publication `RadioGroup`. Keep `initialValues` only if a creation test or create flow still uses it; otherwise remove it and initialize from `emptyForm` directly. The form must still render title, description, price, curriculum placement, and chapter mode.

Remove `isPublished` from `courseFormSchema` and remove `formValuesToCourseUpdate` entirely. Keep `CourseUpdate` and `courseUpdateSchema` because the workspace and actions use them.

Update `CreateCourseDialog` to omit `mode="create"`.

- [ ] **Step 4: Delete dead modal-edit files and tests**

Delete the six files listed above. Confirm no production import remains:

```bash
rg "EditCourseDialog|CourseCardActions|PublishToggle|formValuesToCourseUpdate|mode=\"edit\"" src
```

Expected: no matches.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npm test -- src/features/course-management/__tests__/course-form.test.tsx src/features/course-management/__tests__/locale-switch.test.tsx src/features/course-management/__tests__/form-mapping.test.ts
npx eslint src/features/course-management/components/course-form.tsx src/features/course-management/components/create-course-dialog.tsx src/features/course-management/schema.ts
```

Expected: all selected tests PASS and lint exits zero.

- [ ] **Step 6: Commit**

```bash
git add -A src/features/course-management
git commit -m "refactor: make course editing page-only"
```

---

### Task 3: Add Confirmed Chapter-Mode Editing

**Files:**
- Create: `src/features/course-management/components/course-structure-control.tsx`
- Modify: `src/features/student-preview/course-workspace.tsx`
- Modify: `app/[locale]/(teacher)/courses/[courseId]/page.tsx:154-191`
- Modify: `src/features/student-preview/__tests__/course-workspace.test.tsx`
- Modify: `src/i18n/messages/ar.json`
- Modify: `src/i18n/messages/en.json`

**Interfaces:**
- Produces: `CourseWorkspace` prop `useChapters?: boolean`.
- Produces: `CourseStructureControl({ value, disabled, onChange })`.
- Produces: `CourseStructureConfirmation({ open, nextValue, pending, onConfirm, onCancel })`.
- Consumes: existing `CourseUpdate.use_chapters` and `loadCoursePreviewCurriculum(courseId)`.

- [ ] **Step 1: Add failing workspace tests for structure mode**

Extend `editableWorkspaceProps` messages with structure labels and render with `useChapters={false}`. Add tests that:

```ts
it("saves unchanged chapter mode without confirmation", async () => {
  render(<CourseWorkspace {...editableWorkspaceProps} model={mockModel} locale="en" teacherProfileId={7} useChapters={false} />)
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
  await waitFor(() =>
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      courseId: 42,
      data: expect.not.objectContaining({ use_chapters: expect.anything() }),
    })
  )
})

it("requires confirmation before changing chapter mode", async () => {
  render(<CourseWorkspace {...editableWorkspaceProps} model={mockModel} locale="en" teacherProfileId={7} useChapters={false} />)
  fireEvent.click(screen.getByRole("radio", { name: "Organized into chapters" }))
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
  expect(updateMutation.mutateAsync).not.toHaveBeenCalled()
  expect(screen.getByRole("dialog", { name: "Change course structure?" })).toBeDefined()
})
```

Add cancellation and confirmation cases. Confirmation must assert `data.use_chapters === true` and that `loadCoursePreviewCurriculum` is called after success. Add the reverse chapters-to-flat case and assert its warning copy mentions removing chapter groupings.

Mock the curriculum reload at module scope so confirmation can assert the refresh without calling a server action:

```ts
const mockedLoadCoursePreviewCurriculum = vi.hoisted(() => vi.fn())

vi.mock("../server-actions", () => ({
  loadCoursePreviewCurriculum: mockedLoadCoursePreviewCurriculum,
}))
```

Reset it in `beforeEach` and resolve it with `{ success: true, data: mockSections }`.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/features/student-preview/__tests__/course-workspace.test.tsx
```

Expected: FAIL because the structure selector and confirmation dialog do not exist.

- [ ] **Step 3: Implement controlled structure components**

Create `course-structure-control.tsx` using existing `RadioGroup`, `Label`, `Dialog`, and `Button` primitives. Use these exact public props:

```ts
type CourseStructureControlProps = {
  value: boolean
  disabled?: boolean
  onChange: (useChapters: boolean) => void
}

type CourseStructureConfirmationProps = {
  open: boolean
  nextValue: boolean
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}
```

The selector emits `false` for flat and `true` for chapters. The confirmation dialog cannot close via confirmation until the mutation finishes; cancel closes without mutation.

- [ ] **Step 4: Integrate structure state into the workspace**

Add:

```ts
const [useChapters, setUseChapters] = useState(initialUseChapters)
const [savedUseChapters, setSavedUseChapters] = useState(initialUseChapters)
const [structureConfirmationOpen, setStructureConfirmationOpen] = useState(false)
```

Build metadata before cover upload. If `useChapters !== savedUseChapters`, store/open confirmation and return before `uploadCourseCover` or PATCH. Extract one `performSave(body)` path that:

1. uploads a selected cover,
2. sends the PATCH,
3. updates saved cover and `savedUseChapters`,
4. reloads preview curriculum after a structure change,
5. closes confirmation only on success,
6. preserves the existing error message on failure.

Do not include `use_chapters` when unchanged. Include it only after confirmation.

- [ ] **Step 5: Pass initial state and add translations**

In the route page, pass:

```tsx
useChapters={course.use_chapters}
```

Add exact English keys under `courses`:

```json
"structure_label": "Course structure",
"structure_change_title": "Change course structure?",
"structure_to_chapters_warning": "Existing flat lessons will move into a default chapter.",
"structure_to_flat_warning": "Chapter groupings will be removed and lessons will be kept in their current order.",
"confirm_structure_change": "Change structure"
```

Add equivalent natural Arabic translations under the same keys.

- [ ] **Step 6: Verify GREEN**

Run:

```bash
npm test -- src/features/student-preview/__tests__/course-workspace.test.tsx
npx eslint src/features/course-management/components/course-structure-control.tsx src/features/student-preview/course-workspace.tsx 'app/[locale]/(teacher)/courses/[courseId]/page.tsx'
```

Expected: workspace tests PASS and lint exits zero.

- [ ] **Step 7: Commit**

```bash
git add src/features/course-management/components/course-structure-control.tsx src/features/student-preview/course-workspace.tsx src/features/student-preview/__tests__/course-workspace.test.tsx 'app/[locale]/(teacher)/courses/[courseId]/page.tsx' src/i18n/messages/ar.json src/i18n/messages/en.json
git commit -m "feat: edit course structure from workspace"
```

---

### Task 4: Add Archive Controls And Publication Guard

**Files:**
- Create: `src/features/course-management/components/archive-course-control.tsx`
- Modify: `src/features/course-management/components/publish-switch.tsx`
- Modify: `src/features/course-management/__tests__/publish-switch.test.tsx`
- Modify: `src/features/student-preview/course-workspace.tsx`
- Modify: `app/[locale]/(teacher)/courses/[courseId]/page.tsx:154-191`
- Modify: `src/features/student-preview/__tests__/course-workspace.test.tsx`
- Modify: `src/i18n/messages/ar.json`
- Modify: `src/i18n/messages/en.json`

**Interfaces:**
- Produces: `CourseWorkspace` prop `isArchived?: boolean`.
- Produces: `ArchiveCourseControl({ isArchived, pending, onArchive, onUnarchive })`.
- Extends: `PublishSwitch` with `disabled?: boolean` and `onPublishedChange?: (published: boolean) => void`.
- Consumes: `update.mutateAsync({ courseId, data: CourseUpdate })`.

- [ ] **Step 1: Add failing archive payload tests**

In `course-workspace.test.tsx`, add tests using `isPublished` and `isArchived` props:

```ts
it("archives and unpublishes in one update", async () => {
  render(<CourseWorkspace {...editableWorkspaceProps} model={mockModel} locale="en" teacherProfileId={7} isPublished isArchived={false} />)
  fireEvent.click(screen.getByRole("button", { name: "Archive course" }))
  fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }))
  await waitFor(() =>
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      courseId: 42,
      data: { is_archived: true, is_published: false },
    })
  )
})

it("unarchives without republishing", async () => {
  render(<CourseWorkspace {...editableWorkspaceProps} model={mockModel} locale="en" teacherProfileId={7} isPublished={false} isArchived />)
  fireEvent.click(screen.getByRole("button", { name: "Unarchive course" }))
  await waitFor(() =>
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      courseId: 42,
      data: { is_archived: false },
    })
  )
})
```

Add assertions that canceling archive sends no request, a failed archive leaves the archive control unchanged, and the publish switch is disabled while archived.

- [ ] **Step 2: Add failing controlled publish-switch tests**

In `publish-switch.test.tsx`, assert:

```tsx
render(<PublishSwitch courseId={1} teacherProfileId={7} isPublished={false} disabled />)
expect(screen.getByRole("switch")).toBeDisabled()
```

Add a callback test asserting `onPublishedChange(true)` after a successful publish mutation.

- [ ] **Step 3: Run tests and verify RED**

Run:

```bash
npm test -- src/features/student-preview/__tests__/course-workspace.test.tsx src/features/course-management/__tests__/publish-switch.test.tsx
```

Expected: FAIL because archive controls and new publish-switch props are absent.

- [ ] **Step 4: Implement `ArchiveCourseControl`**

Create a controlled component with exact props:

```ts
type ArchiveCourseControlProps = {
  isArchived: boolean
  pending: boolean
  onArchive: () => void
  onUnarchive: () => void
}
```

Unarchive calls `onUnarchive` directly. Archive first opens a confirmation dialog that explains the course will be unpublished and hidden from students. Confirmation calls `onArchive`; cancellation sends no callback.

- [ ] **Step 5: Extend `PublishSwitch` safely**

Add optional `disabled` and `onPublishedChange` props. Synchronize internal state when `isPublished` changes:

```ts
useEffect(() => setPublished(isPublished), [isPublished])
```

Disable the switch when `disabled || submitting`. After a successful mutation, set local state and call `onPublishedChange?.(next)`. Do not call the callback on failure.

- [ ] **Step 6: Integrate archive state into the workspace**

Add local state initialized from route props:

```ts
const [archived, setArchived] = useState(isArchived ?? false)
const [published, setPublished] = useState(isPublished ?? false)
```

Archive using exactly:

```ts
const updated = await update.mutateAsync({
  courseId,
  data: { is_archived: true, is_published: false },
})
setArchived(updated.is_archived)
setPublished(updated.is_published)
```

Unarchive using exactly `{ is_archived: false }`. Pass `disabled={archived}` and `isPublished={published}` to `PublishSwitch`. Keep errors inline and do not update local state when mutation rejects.

- [ ] **Step 7: Pass route state and add translations**

Pass `isArchived={course.is_archived}` from the page. Add exact English keys:

```json
"archived": "Archived",
"archive_course": "Archive course",
"unarchive_course": "Unarchive course",
"archive_title": "Archive this course?",
"archive_warning": "The course will be unpublished and hidden from students.",
"confirm_archive": "Confirm archive",
"archived_publish_hint": "Unarchive this course before publishing it."
```

Add equivalent natural Arabic translations under the same keys.

- [ ] **Step 8: Verify GREEN**

Run:

```bash
npm test -- src/features/student-preview/__tests__/course-workspace.test.tsx src/features/course-management/__tests__/publish-switch.test.tsx
npx eslint src/features/course-management/components/archive-course-control.tsx src/features/course-management/components/publish-switch.tsx src/features/student-preview/course-workspace.tsx
```

Expected: selected tests PASS and lint exits zero.

- [ ] **Step 9: Commit**

```bash
git add src/features/course-management/components/archive-course-control.tsx src/features/course-management/components/publish-switch.tsx src/features/course-management/__tests__/publish-switch.test.tsx src/features/student-preview/course-workspace.tsx src/features/student-preview/__tests__/course-workspace.test.tsx 'app/[locale]/(teacher)/courses/[courseId]/page.tsx' src/i18n/messages/ar.json src/i18n/messages/en.json
git commit -m "feat: archive courses from edit workspace"
```

---

### Task 5: Show And Filter Archived Courses

**Files:**
- Modify: `src/features/course-management/components/course-card.tsx:68-79`
- Modify: `src/features/course-management/components/course-list.tsx:15-66,108-124`
- Modify: `src/features/course-management/__tests__/course-card.test.tsx`
- Modify: `src/features/course-management/__tests__/course-list.test.tsx`
- Modify: `src/features/course-management/__tests__/mocks.ts`
- Modify: `src/i18n/messages/ar.json`
- Modify: `src/i18n/messages/en.json`

**Interfaces:**
- Produces: `StatusFilter = "all" | "published" | "draft" | "archived"`.
- Consumes: `CourseOut.is_archived` from Task 1.
- Preserves: search term and status filter combine with logical AND.

- [ ] **Step 1: Add an archived fixture and failing filter tests**

Add a third mock course:

```ts
{
  ...mockCourses[1],
  id: 3,
  title: "Archived Chemistry",
  is_published: false,
  is_archived: true,
}
```

Add tests asserting:

```ts
fireEvent.click(screen.getByRole("button", { name: "مؤرشف" }))
expect(screen.getByText("Archived Chemistry")).toBeDefined()
expect(screen.queryByText("الجبر - الصف الأول الثانوي")).toBeNull()
```

Also assert Published and Draft exclude the archived title, All includes it, and entering a search term while Archived is active narrows only archived results.

- [ ] **Step 2: Add a failing card badge test**

In `course-card.test.tsx`:

```ts
it("shows archived instead of draft or published", () => {
  renderWithIntl(
    <CourseCard
      course={{ ...mockCourse, is_archived: true, is_published: false }}
      teacherProfileId={7}
      locale="ar"
    />
  )
  expect(screen.getByText("مؤرشف")).toBeDefined()
  expect(screen.queryByText("مسودة")).toBeNull()
  expect(screen.queryByText("منشور")).toBeNull()
})
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```bash
npm test -- src/features/course-management/__tests__/course-card.test.tsx src/features/course-management/__tests__/course-list.test.tsx
```

Expected: FAIL because archived status has no badge/filter behavior.

- [ ] **Step 4: Implement mutually exclusive status semantics**

Extend the filter type and array:

```ts
type StatusFilter = "all" | "published" | "draft" | "archived"
const FILTERS: StatusFilter[] = ["all", "published", "draft", "archived"]
```

Use exact status matching:

```ts
const matchesStatus =
  status === "all" ||
  (status === "archived" && course.is_archived) ||
  (status === "published" && !course.is_archived && course.is_published) ||
  (status === "draft" && !course.is_archived && !course.is_published)
```

In `CourseCard`, archived takes precedence:

```ts
const statusLabel = course.is_archived
  ? t("archived")
  : course.is_published
    ? t("published")
    : t("draft")
```

Apply a muted/warning archived badge style that remains legible; do not reduce card opacity or remove navigation.

- [ ] **Step 5: Add filter translations**

Add `filter_archived` and reuse `archived` in both locale files:

```json
"filter_archived": "Archived"
```

Arabic value: `"مؤرشف"`.

- [ ] **Step 6: Verify GREEN**

Run:

```bash
npm test -- src/features/course-management/__tests__/course-card.test.tsx src/features/course-management/__tests__/course-list.test.tsx
npx eslint src/features/course-management/components/course-card.tsx src/features/course-management/components/course-list.tsx
```

Expected: selected tests PASS and lint exits zero.

- [ ] **Step 7: Run final dashboard verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
git diff --check
```

Expected: all tests pass, lint exits zero, and `git diff --check` prints nothing. If typecheck has a documented pre-existing baseline failure, verify that no new error references a changed file before proceeding.

Confirm no backend file changed:

```bash
git status --short
git diff --name-only HEAD | rg '^\.\./elemni/|^elemni/'
```

Expected: the backend path search prints nothing.

- [ ] **Step 8: Commit**

```bash
git add src/features/course-management/components/course-card.tsx src/features/course-management/components/course-list.tsx src/features/course-management/__tests__/course-card.test.tsx src/features/course-management/__tests__/course-list.test.tsx src/features/course-management/__tests__/mocks.ts src/i18n/messages/ar.json src/i18n/messages/en.json
git commit -m "feat: show and filter archived courses"
```

---

## Final Acceptance Checklist

- [ ] Create course remains a dialog and creates active drafts.
- [ ] No edit dialog, card action menu, or old publish dropdown remains.
- [ ] Course cards still navigate to the dedicated edit page.
- [ ] Workspace edits all prior metadata plus `use_chapters` and archive state.
- [ ] Both structure migrations require confirmation and cancellation is side-effect free.
- [ ] Archive sends both `is_archived: true` and `is_published: false`.
- [ ] Unarchive sends only `is_archived: false`.
- [ ] Archived courses cannot be published.
- [ ] Archived cards and mutually exclusive status filters work with search.
- [ ] Frontend response and update schemas match existing backend fields.
- [ ] `bunny_collection_id` is parsed but never rendered or edited.
- [ ] No backend source or test file changed.
- [ ] Full dashboard verification results are recorded in the final report.
