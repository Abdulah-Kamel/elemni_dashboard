# Course Edit Page Parity Design

## Goal

Make the dedicated course workspace the only course editing surface while retaining the create-course dialog. Add the edit capabilities that are currently missing from the workspace, synchronize the dashboard's course contracts with fields already returned and accepted by the backend, and remove obsolete edit-dialog code.

## Scope

This is a dashboard-only change. No files in the backend project (`elemni/`) will be modified.

### In Scope

- Keep `CreateCourseDialog` as the only course dialog.
- Make `CourseWorkspace` the sole editing surface.
- Add chapter-structure editing with a destructive-change confirmation.
- Add archive and unarchive controls.
- Add archived state to course cards and list filters.
- Synchronize frontend course schemas with existing backend fields.
- Remove dead edit-dialog, card-action, and publish-toggle code.
- Update dashboard tests and record stale external contract findings in this design.

### Out Of Scope

- Backend router, schema, service, model, migration, or test changes.
- Removing the backend's legacy `duration_minutes` database column.
- Displaying or editing `bunny_collection_id`.
- Replacing the existing course workspace layout or live preview.
- Adding archive controls to course creation. New courses remain active drafts.

## Current State

The dashboard has three course form surfaces:

1. `CreateCourseDialog`, which is the production create entry point.
2. `EditCourseDialog`, which is only reachable through dead `CourseCardActions` code.
3. `CourseWorkspace`, the production edit page linked from course cards.

The edit dialog supports `useChapters`, while the workspace does not. Publication is already available in the workspace through `PublishSwitch`. The backend also accepts and returns `is_archived`, and returns `total_duration_minutes` and `bunny_collection_id`, but the dashboard course schemas do not model these fields.

## Architecture

### Creation

`CreateCourseDialog` remains unchanged as the only modal course workflow. It continues using `CourseForm` for title, description, price, curriculum placement, and chapter mode, plus `CourseCoverPicker` for the cover image. Creation continues to force `is_published: false`; archived state is not exposed during creation.

### Editing

`CourseWorkspace` becomes the single editing surface for:

- title
- description
- price
- cover image
- subject, grade, and stream
- chapter structure mode
- publish state
- archive state
- chapters, lessons, and items
- student preview

It continues using the existing course update mutation and `PATCH /courses/{id}` contract. No new API endpoint is required.

### Removed Code

Remove production code that only supports modal editing:

- `EditCourseDialog`
- `CourseCardActions`
- `PublishToggle`

Remove their dedicated tests. Simplify `CourseForm` to creation-only behavior by removing its edit mode and edit-only publication controls. Retain shared controls that are still used by creation or the workspace, including `CourseCoverPicker`, `CurriculumPicker`, `PriceInput`, and `PublishSwitch`.

## Interaction Design

### Chapter Structure

The workspace adds the same flat-lessons versus chapters choice shown during course creation.

If the value has not changed, saving behaves normally. If it changes, saving pauses for confirmation:

- Flat to chapters: explain that existing flat lessons will move into a default chapter.
- Chapters to flat: explain that chapter groupings will be removed and lessons flattened in their current order.

Canceling confirmation leaves the course unchanged. Confirming sends `use_chapters` with the rest of the update. The workspace refreshes its curriculum data after the mutation because the backend may migrate chapters and lessons.

### Archive State

Archive is separate from Publish and requires confirmation.

- Archive sends `{ is_archived: true, is_published: false }` in one existing PATCH request.
- Unarchive sends `{ is_archived: false }`; the course remains a draft.
- Archived courses cannot be published from the workspace. The publish control is disabled or hidden while archived with explanatory text.
- Failed mutations leave the displayed state unchanged and show the existing inline error treatment.

This frontend payload preserves the approved auto-unpublish behavior without backend changes.

### Course List

Archived courses remain visible to their teacher.

- Add an Archived badge to archived cards.
- Extend filters to `All`, `Published`, `Draft`, and `Archived`.
- `Published` and `Draft` exclude archived courses.
- `All` includes archived courses.
- Search continues to compose with the selected status filter.

## Data Contracts

### Course Response

Extend the dashboard `courseOutSchema` and `CourseOut` type with fields already returned by the backend:

- `is_archived: boolean`
- `total_duration_minutes: number | null`
- `bunny_collection_id: string | null`

`bunny_collection_id` is retained for contract accuracy but is not displayed or editable.

### Course Update

Extend the dashboard update schema with:

- `is_archived?: boolean | null`

Preserve true PATCH behavior: omitted values are not changed. Existing update behavior must continue to support clearing a description and setting a price to zero.

### Course Creation

Do not add archive controls to the create form. Creation remains unarchived and unpublished through backend defaults and the existing dashboard mapper.

## Data Flow

1. The course page server component loads the existing course and curriculum.
2. `CourseWorkspace` initializes editable state, including `use_chapters` and `is_archived`.
3. Metadata save validates values and compares chapter mode with the initial course.
4. A chapter-mode change requires confirmation before mutation.
5. Successful metadata updates refresh course detail and course-list caches.
6. Archive and unarchive actions use the existing update mutation with explicit payloads.
7. A chapter-mode update also refreshes curriculum queries to reflect backend lesson migration.

## Error Handling

- Validation errors remain field-specific where the current workspace supports them.
- Conflict, authorization, and network errors use the existing inline error surface.
- Confirmation cancellation performs no mutation.
- Mutation failures do not optimistically commit archive, publish, or chapter-mode state.
- Archived courses cannot trigger a publish mutation from the UI.

## Backend Audit Findings

No backend changes are included, but implementation must document these observed risks:

- The backend accepts `is_archived` and `is_published` independently. A non-dashboard client can create an archived-and-published combination.
- Public catalog queries filter by `is_published` but do not explicitly filter `is_archived`.
- The dashboard mitigates both behaviors by always unpublishing in the same archive PATCH request.
- `total_duration_minutes` is computed and returned by the backend but currently omitted from the dashboard response schema.
- `bunny_collection_id` is returned but currently omitted from the dashboard response schema.
- The legacy backend `duration_minutes` course column is not part of this work.

## Contract Documentation

This design records that the workspace-level course contract is stale: curriculum placement can be changed after creation, and grade `level` is a string rather than an integer. Do not edit that external contract, backend implementation files, or backend tests in this dashboard-only change. The frontend-only archive invariant and backend audit caveat remain documented here.

## Testing

### Workspace Tests

- Renders current chapter mode.
- Saves without confirmation when chapter mode is unchanged.
- Requires confirmation when changing chapter mode.
- Canceling confirmation sends no request.
- Confirming sends the new `use_chapters` value and refreshes curriculum data.
- Archiving sends `is_archived: true` and `is_published: false` together.
- Unarchiving sends `is_archived: false` and does not republish.
- Publishing is unavailable while archived.
- Mutation failures retain prior UI state and display an error.

### List And Card Tests

- Archived cards display an Archived badge.
- All includes archived courses.
- Published and Draft exclude archived courses.
- Archived shows only archived courses.
- Search and status filters compose correctly.

### Schema Tests

- Course responses parse archive, duration, and collection fields.
- Course updates accept archive state.
- Price zero and cleared descriptions remain valid updates.
- Creation remains unarchived and unpublished from the UI.

### Removal Tests

- Remove tests dedicated to deleted edit-dialog components.
- Existing course-card navigation still links to the dedicated edit page.
- Existing create-dialog behavior remains covered.

### Verification

Run dashboard unit tests, type checking, linting, and relevant contract tests. Backend tests are not changed because backend code is out of scope.

## Success Criteria

- Teachers create courses through the create dialog and edit them only on the dedicated page.
- Every editable option formerly available in the edit dialog is available on the page.
- Chapter-mode changes cannot occur without an explicit migration warning.
- Teachers can archive, unarchive, identify, search, and filter archived courses.
- Archiving through the dashboard always unpublishes the course.
- Frontend schemas accept the existing backend course response without silently omitting known fields.
- Obsolete edit-dialog code and tests are removed.
- No backend source file is changed.
