# Quickstart: Chapter Reorder

## Prerequisites

- API server running at `http://localhost:8001`
- Dev server running: `npm run dev`
- A course with at least 2 chapters and `use_chapters: true`
- `@dnd-kit` packages installed

## Install Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Validation Scenarios

### Scenario 1: Basic Drag-and-Drop

1. Navigate to `/ar/courses/{courseId}` (a course with chapters)
2. Click the drag handle on a chapter
3. Drag it to a new position
4. Verify:
   - Ghost element follows cursor
   - Adjacent chapters animate apart
   - On drop, chapters settle with animation
   - Toast shows "Chapters reordered"
   - On page refresh, order persists

### Scenario 2: Move Up/Down Buttons

1. Click "Move Down" on the first chapter
2. Verify:
   - Chapter swaps with the one below (animated)
   - Toast shows success
   - On page refresh, order persists

### Scenario 3: Keyboard Reorder

1. Tab to a chapter's drag handle
2. Press Enter to pick up
3. Press Arrow Up/Down to move
4. Press Enter to drop
5. Verify animated transition

### Scenario 4: Cancel via Escape

1. Start dragging a chapter
2. Press Escape before dropping
3. Verify chapter returns to original position with animation

### Scenario 5: Network Error Recovery

1. Disconnect API server
2. Attempt a reorder
3. Verify:
   - UI shows error toast
   - Chapters revert to original order
   - "Retry" option appears

### Scenario 6: Single Chapter

1. Navigate to a course with only 1 chapter
2. Verify no drag handles or move buttons appear

## Run Tests

```bash
npm test
```

## Key Files

| File | Purpose |
|------|---------|
| `src/features/course-management/chapters-schema.ts` | Schema definitions including `ReorderItem` |
| `src/features/course-management/chapters-actions.ts` | Server action for `reorderChapters` |
| `src/features/course-management/components/chapter-list.tsx` | Updated `ChapterList` with drag-and-drop |
| `src/features/course-management/components/chapter-card.tsx` | Updated `ChapterCard` with drag handle and move buttons |
