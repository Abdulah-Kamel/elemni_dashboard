# Quickstart: Lesson Items

## Prerequisites

- API server running at `http://localhost:8001`
- Dev server running: `npm run dev`
- A course with at least one lesson
- All existing `@dnd-kit` packages already installed from chapter/lesson reorder work

## Creating Files

Required files to create (follow chapter/lesson patterns):

| File | Action |
|------|--------|
| `src/features/course-management/items-schema.ts` | Create — Zod schemas |
| `src/features/course-management/items-queries.ts` | Create — server queries |
| `src/features/course-management/items-actions.ts` | Create — server actions |
| `src/features/course-management/components/item-card.tsx` | Create — item display |
| `src/features/course-management/components/item-list.tsx` | Create — sortable list |
| `src/lib/api/upload.ts` | Create — file upload helpers |
| `src/lib/api/endpoints.ts` | Update — add items endpoints |
| `src/features/course-management/components/lesson-card.tsx` | Update — add item expansion |
| `src/i18n/messages/*.json` | Update — add items namespace |

## Validation Scenarios

### Scenario 1: Create Item

1. Navigate to `/ar/courses/{courseId}` (a course with chapters + lessons)
2. Expand a chapter to see lessons
3. Expand a lesson (new expandable area)
4. Click "Add Item"
5. Enter title and save
6. Verify item appears in the list

### Scenario 2: Reorder Items

1. Create 3 items
2. Drag item 3 to position 1 using drag handle
3. Verify smooth animation
4. Verify success toast
5. Refresh page — order persists

### Scenario 3: Edit Item Title

1. Click edit on an item
2. Change title
3. Save
4. Verify updated title displays

### Scenario 4: Delete Item

1. Click delete on an item
2. Confirm deletion
3. Verify item removed and remaining items re-numbered

## Run Tests

```bash
npm test
```

## Key Files

| File | Purpose |
|------|---------|
| `src/features/course-management/items-schema.ts` | `ItemOut`, `ItemCreate`, `ItemUpdate` Zod schemas |
| `src/features/course-management/items-actions.ts` | All server actions for items |
| `src/features/course-management/items-queries.ts` | `listItems` server query |
| `src/features/course-management/components/item-list.tsx` | Sortable item list with @dnd-kit |
| `src/features/course-management/components/item-card.tsx` | Item display with type badge, upload buttons |
| `src/lib/api/upload.ts` | File upload helper (multipart + presigned URL) |
| `src/features/course-management/components/lesson-card.tsx` | Updated to show items on expand |
