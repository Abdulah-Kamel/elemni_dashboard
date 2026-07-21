# Quickstart: Hybrid Course Content Editor

## Prerequisites

- Node.js 20+
- `npm install` completed
- Local API backend running (or mock server)
- Next.js dev server running: `npm run dev`

## Setup Commands

```bash
# Navigate to project root
cd elemni_dashboard

# Ensure dependencies are installed
npm install

# Start dev server
npm run dev
```

## Run Tests

```bash
# Run all course-management tests
npx vitest run src/features/course-management/__tests__/

# Run specific schema tests
npx vitest run src/features/course-management/__tests__/chapters-schema.test.ts
npx vitest run src/features/course-management/__tests__/lessons-schema.test.ts
npx vitest run src/features/course-management/__tests__/items-schema.test.ts

# Run reorder logic tests
npx vitest run specs/003-hybrid-content-editor/__tests__/reorder-logic.test.ts

# Run all contract tests
npx vitest run tests/contract/

# Run E2E tests
npx playwright test e2e/course-management.spec.ts
```

## Validation Scenarios

### 1. Chaptered mode: Course page shows chapters only

1. Open a course with `use_chapters = true`
2. **Expected**: Page shows chapter list only — no lessons visible
3. Click a chapter row
4. **Expected**: Navigate to `/courses/{id}/chapters/{chapterId}` showing chapter page with lesson list

### 2. Flat mode: Course page shows lessons directly

1. Open a course with `use_chapters = false`
2. **Expected**: Page shows lesson list directly — no chapter grouping
3. Expand a lesson
4. **Expected**: Items appear inline below the lesson

### 3. Lesson expansion and item display

1. Navigate to a chapter page (or flat course page)
2. Click a lesson's chevron to expand it
3. **Expected**: Items appear with colored type tiles (video=accent, doc=warning, quiz=pro), status chips, and grip handles
4. Click the chevron again to collapse
5. **Expected**: Items hide, lesson restores to compact state

### 4. Item processing status

1. Upload a video to an item
2. **Expected**: Item shows spinner during upload, then "جاهز" chip when complete
3. The parent lesson shows a processing badge while any item is not ready

### 5. Reorder within a level

1. Open a chapter page with 3+ lessons
2. Drag a lesson to a new position
3. **Expected**: List reorders immediately (optimistic update). Toast confirms on success.
4. On simulated API error: list reverts to previous order + error toast

### 6. Chapter CRUD

1. On the course page, click "New Chapter"
2. Enter title and confirm
3. **Expected**: New chapter appears in list
4. Click ⋯ menu → "Edit" on a chapter
5. Change title and confirm
6. **Expected**: Title updates
7. Click ⋯ menu → "Delete" on a chapter with lessons
8. **Expected**: Caution dialog appears about nested content
9. Confirm deletion
10. **Expected**: Chapter removed from list

### 7. Navigation persistence

1. Enter a chapter, expand 2 lessons, scroll down
2. Navigate back to course page
3. Re-enter the same chapter
4. **Expected**: Scroll position and expanded lesson states are preserved

## Architecture Reference

- [Spec](spec.md) — Feature specification
- [Data Model](data-model.md) — Entity definitions and relationships
- [Contracts](contracts/README.md) — API endpoint schemas
- Design mockups: `design/hybrid_chapter_page.html`, `design/course_tree_editor_redesign.html`
