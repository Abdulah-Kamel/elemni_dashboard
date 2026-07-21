# Lesson Items CRUD

## Overview

Lessons are containers for actual course content — items. Each item is a piece of learning material: a video lesson, a document (PDF), or an exam. Teachers need to create, view, edit, delete, and reorder items within a lesson. Items also support uploading video files (via Bunny CDN) and documents via presigned URLs.

## Actors

- **Teacher** — the primary user who manages lesson content

## User Scenarios

### Scenario 1: Teacher views items inside a lesson

Given a lesson has 3 items (video, document, exam)
When the teacher expands a lesson in the chapter view
Then all items are displayed in order with their type icon (video / document / exam)
And each item shows its title and type badge

### Scenario 2: Teacher creates a new text-named item

Given the teacher is viewing a lesson's items
When they click "Add Item" and enter a title
Then a new item is created at the end of the list with order = last + 1
And it appears in the list with a default type indicator

### Scenario 3: Teacher reorders items via drag-and-drop

Given a lesson has 4 items
When the teacher drags item 4 to position 2
Then items animate to the new order
And the order is auto-saved

### Scenario 4: Teacher uploads a video to an item

Given the teacher has created an item
When they click "Upload Video" on that item
Then a file picker opens for video files
After selecting a file, the upload progresses
And the item shows a video badge once complete

### Scenario 5: Teacher uploads a document to an item

Given the teacher has created an item
When they click "Upload Document"
Then a file picker opens for PDF/document files
After selection, the document is uploaded via presigned URL
And the item shows a document badge

### Scenario 6: Teacher links an exam to an item

Given the teacher has created an item
When they click "Link Exam"
Then they can select from existing exams or create a new one
And the item shows an exam badge

### Scenario 7: Teacher edits an item title

Given an existing item
When the teacher clicks edit on that item
Then an inline edit or dialog lets them change the title
And the change is saved

### Scenario 8: Teacher deletes an item

Given an existing item
When the teacher clicks delete
Then a confirmation dialog appears
After confirming, the item is removed and remaining items re-number

### Scenario 9: Single item edge case

Given a lesson has only 1 item
When the teacher views the lesson
Then no drag handles or move buttons are shown on the single item

## Functional Requirements

### FR-01: Item List Display

Items are displayed inside each lesson when expanded. Each item card shows:
- Order number
- Title
- Type badge (Video / Document / Exam) based on which content field is set
- Drag handle
- Action buttons (edit, delete)
- Upload buttons (video, document) or exam link button for empty items

### FR-02: Create Item

Teachers can create an item by entering a title. The item is created with no content type (no video, document, or exam). Content is added via upload actions afterward.

### FR-03: Item Reorder

Items within a lesson support drag-and-drop reordering with smooth animations, plus Move Up / Move Down buttons. Reorder uses the same `ReorderRequest { items: ReorderItem[] }` contract as chapters and lessons.

### FR-04: Video Upload

Teachers can upload a video file to an item. Upload is sent to `POST /api/v1/courses/{courseId}/lessons/{lessonId}/items/{itemId}/upload-video`. Progress is shown during upload. On success, the item's `bunny_stream_id` is set.

### FR-05: Document Upload

Teachers can upload a document (PDF) to an item. The flow is:
1. `POST .../request-upload-url?filename=...` — get a presigned upload URL
2. Upload the file to that URL
3. `POST .../confirm-upload` with the returned key

On success, the item's `document_path` is set.

### FR-06: Link Exam

Teachers can link an existing exam to an item by setting the `exam_id` field. Exam management itself is out of scope.

### FR-07: Edit Item

Teachers can edit an item's title inline or via dialog.

### FR-08: Delete Item

Teachers can delete an item with confirmation. Remaining items are re-ordered.

### FR-09: Optimistic UI on Reorder

Reorder updates the UI immediately. On save failure, items revert and a toast error is shown.

### FR-10: Screen Reader Support

All item actions are accessible via keyboard. Drag handles have proper aria labels. Item type badges are announced. Upload progress is announced via live region.

## Success Criteria

| Criterion | Measure |
|-----------|---------|
| Teachers can create and upload content to an item in under 30 seconds | Time from create to upload complete |
| Items display correctly within 1 second of lesson expand | Render time |
| Reorder save succeeds on first attempt 99% of the time | Success rate |
| Video upload shows progress and completes without page reload | Upload UX |
| All item actions work via keyboard alone | Accessibility audit |

## Key Entities

### Item

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique identifier |
| lesson_id | Integer | Parent lesson |
| title | String | Item display name |
| bunny_stream_id | String or null | Video stream ID (Bunny CDN) |
| document_path | String or null | Document file path |
| exam_id | Integer or null | Linked exam ID |
| order | Number | Sort position (1-based) |

### Item Type (derived)

| Condition | Type |
|-----------|------|
| `bunny_stream_id` is set | Video |
| `document_path` is set | Document |
| `exam_id` is set | Exam |
| None set | Empty / Text-only |

## Assumptions

- Item endpoints follow REST patterns established by chapters and lessons
- Video upload goes directly from browser to Bunny CDN via the API proxy endpoint
- Document upload uses a request-upload-url / confirm-upload two-phase pattern
- Exam linking assumes exam IDs exist (exam CRUD is separate)
- Items without any content type are displayed as text-only items
- Maximum items per lesson is reasonably small (< 50)

## Dependencies

- Existing lesson components (`LessonList`, `LessonCard`) serve as the rendering surface
- Reorder infrastructure (`@dnd-kit`, `reorderItemSchema`, `ReorderItem` type) already built for chapters/lessons
- Auth and course access already handled by parent page layouts
- API backend already has all 8 item endpoints and schemas defined

## Scope


### In Scope

- Item CRUD (create, read, update, delete) within a lesson
- Item list display with type badges
- Item drag-and-drop reorder
- Item Move Up / Move Down buttons
- Video upload button and flow
- Document upload button and flow
- Edit item title
- Delete item with confirmation
- i18n support (Arabic + English)

### Out of Scope

- Exam CRUD (separate feature)
- Video player / streaming (separate feature)
- Document preview (separate feature)
- Bulk operations on items
- Cross-lesson item moves
- Version history of item content
