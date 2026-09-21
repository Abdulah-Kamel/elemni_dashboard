# Create Workspace Preview Design

## Goal

Replace the narrow create-course dialog with a full-page create workspace that mirrors the edit-course preview experience, so teachers see a live student view while entering a new course.

## Decisions

- Full-page create workspace (not dialog preview, not preview step).
- Pre-save scope: metadata + live preview only — title, description, price, cover, subject/grade/stream, structure choice. Chapters, lessons, and items remain post-creation in the edit workspace.
- Entry: Courses list Create button links to `/courses/new`. Save creates an active draft, then redirects to `/courses/[id]` edit workspace.
- Layout: Option B — simplified create split. Same `PreviewWorkspace` chrome as edit, but preview hides the curriculum sections block until after creation.

## Scope

### In Scope

- New `app/[locale]/(teacher)/courses/new/page.tsx` create route.
- Create-mode workspace reusing `PreviewWorkspace`, `StudentCourseDetailPreview`, `CourseForm` fields, `CourseCoverPicker`, `CurriculumPicker`, `CourseStructureControl`.
- Live preview binding for title, description, price, cover, subject/grade/stream names.
- Save via existing create mutation plus optional cover-upload PATCH.
- Redirect to edit workspace after creation.
- Courses list entry-point change away from `CreateCourseDialog`.
- AR/EN copy and RTL behavior for the new page.
- Workspace unit tests.

### Out Of Scope

- Pre-creation chapter/lesson/item editing.
- Publish/archive controls on create; creation stays unpublished and unarchived.
- Backend router, schema, service, model, migration, or test changes.
- Replacing the existing edit workspace layout or live preview.
- Wizard steps or dialog-plus-preview hybrid.

## Architecture

New route `app/[locale]/(teacher)/courses/new/page.tsx` renders a create-mode workspace:

- Server component loads teacher curriculum (subjects, grades, streams) for pickers.
- Client workspace owns unsaved draft state and composes:
  - `PreviewWorkspace` for edit/preview tabs, Full/Tablet/Mobile widths, and panel resize.
  - `StudentCourseDetailPreview` in simplified mode with `sections=[]` and curriculum block hidden.
  - Editor stack: title, description, price, `CourseCoverPicker`, `CurriculumPicker`, `CourseStructureControl`, Save button.
- No curriculum tree editor (`ChapterList` / `LessonList`) on this page.
- Courses page Create button becomes a link to `/courses/new`; `CreateCourseDialog` usage is removed from the courses list, and the dialog component plus its dedicated tests are deleted because the courses list is its only caller.
- `CourseForm` remains creation-only and its fields are reused by the new page.

## Interaction Design

- Typing title, description, price, or changing curriculum pickers updates the preview model immediately.
- Cover selection shows a local object URL in the preview before upload.
- Structure selector defaults to flat lessons; no migration confirmation on create because there is nothing to migrate.
- Save button label: save-and-continue semantics; while saving, controls disable with existing saving copy.
- Back/cancel navigation performs no mutation and leaves no course behind.

## Data Flow

1. Create page loads curriculum placement data server-side.
2. Client initializes empty draft with flat structure default.
3. Save validates title required; field errors stay inline.
4. `create` mutation sends title, description, price, placement, `use_chapters`, `is_published: false`.
5. When a cover file exists, `uploadCourseCover(courseId, file)` runs, followed by `update { img }`; cover failure surfaces the existing warning toast but still redirects.
6. Successful creation redirects to `/[locale]/courses/[courseId]` edit workspace for curriculum building.

## Error Handling

- Empty title blocks save with a field-level message.
- Field validation errors render beside their inputs through existing form error treatment.
- Upstream, conflict, authorization, and network errors use the existing inline error surface; failed save does not navigate.
- Cover-upload failure does not fail course creation; it warns and continues to edit.
- No archive or publish payload is sent during creation.

## Testing

- Renders editor plus simplified preview without curriculum block.
- Title, price, and curriculum changes reflect live in preview.
- Cover selection updates preview immediately.
- Save without title shows validation and sends no request.
- Successful save creates draft, uploads cover when present, and redirects to edit.
- Cover-upload failure still redirects with warning.
- AR and EN render with correct direction and copy.
- Verification: dashboard unit tests for the new workspace, plus typecheck and lint clean.

## Success Criteria

- Teachers create from a full page that looks and behaves like the edit preview.
- No course is created until explicit save.
- Every new course starts as an unpublished, unarchived draft with chosen structure.
- Chapters and lessons are still built post-creation in the edit workspace.
- Old create-dialog entry point is gone from the courses list.
- No backend source file is changed.
