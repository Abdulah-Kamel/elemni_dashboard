# Data Model: Hybrid Course Content Editor

## Entity-Relationship Diagram

```
Course (1) ──── * Chapter (1) ──── * Lesson (1) ──── * Item
  │                                   │
  └── use_chapters determines          └── chapter_id = null (flat mode)
       which level is top-level
```

## Entities

### Course

| Field | Type | Notes |
|-------|------|-------|
| id | integer | Primary key |
| title | string | |
| description | string? | Nullable |
| price | string | Decimal stored as string |
| is_published | boolean | |
| use_chapters | boolean | **Key field**: determines chaptered vs flat mode |
| subject_id | integer? | FK to subject |
| subject_name | string? | Denormalized |
| teacher_profile_id | integer | FK to teacher |
| grade_id | integer | FK to grade |
| stream_id | integer | FK to stream |
| created_at | datetime | |

**Source**: `CourseOut` in `openapi.json`
**Used by**: Course page route (branch on `use_chapters`)

### Chapter

| Field | Type | Notes |
|-------|------|-------|
| id | integer | Primary key |
| course_id | integer | FK to Course |
| title | string | 1-200 chars |
| order | number | Display order (sequential) |

**Source**: `ChapterOut` in `openapi.json`
**Used by**: `ChapterCard`, `ChapterList`, chapter reorder
**Present only when**: `course.use_chapters = true`

### Lesson

| Field | Type | Notes |
|-------|------|-------|
| id | integer | Primary key |
| course_id | integer | FK to Course |
| chapter_id | integer? | FK to Chapter (null in flat mode) |
| title | string | 1-200 chars |
| description | string? | Max 10k chars |
| order | number | Display order within parent |

**Source**: `LessonOut` in `openapi.json`
**Used by**: `LessonCard`, `LessonList`, lesson reorder, item count for badge
**Flat mode**: `chapter_id` is null; lessons appear directly on course page

### Item

| Field | Type | Notes |
|-------|------|-------|
| id | integer | Primary key |
| lesson_id | integer | FK to Lesson |
| title | string | 1-200 chars |
| bunny_stream_id | string? | Null = no video uploaded yet |
| document_path | string? | Null = no document uploaded yet |
| exam_id | integer? | Null = no exam linked |
| order | number | Display order within lesson |

**Source**: `ItemOut` in `openapi.json`
**Used by**: `ItemCard`, `ItemList`, item reorder, processing state inference

## Reorder Contracts

### ReorderRequest

| Field | Type | Notes |
|-------|------|-------|
| items | ReorderItem[] | Array of id + order pairs. Min 2 items. |

### ReorderItem

| Field | Type | Notes |
|-------|------|-------|
| id | integer | Entity ID |
| order | number | Position. Sent as integer (sequential). API accepts fractional. |

**Source**: `ReorderRequest` / `ReorderItem` in `openapi.json`
**Used by**: All three reorder endpoints (chapters, lessons, items)

## State Transitions

No explicit state machine — state is inferred from field presence:

- `bunny_stream_id`: `null` → `"abc-123"` (video uploaded and transcoded)
- `document_path`: `null` → `"uploads/doc.pdf"` (document uploaded)
- Items transition from `empty` → `uploading` (local) → `processing` (transient, inferred) → `ready`

**Upload flow**:
1. User selects file in `UploadDialog`
2. `uploading = true` (local state)
3. Video: POST to upload endpoint → on success, `bunny_stream_id` becomes non-null → ready
4. Document: Request URL → PUT to presigned URL → Confirm → on success, `document_path` becomes non-null → ready
5. On any error → `failed` state, toast shown
