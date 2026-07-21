# Tasks: Hybrid Course Content Editor

**Input**: Design documents from `specs/003-hybrid-content-editor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD is required per Article VIII — API client functions, Zod schemas, and reorder logic must be test-first. Presentational UI tests follow implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- All paths under `src/features/course-management/` per existing convention

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency verification

- [ ] T001 [P] Install `@base-ui/react` dependency for Collapsible, Popup primitives in package.json
- [ ] T002 [P] Verify existing `@dnd-kit/core`, `@dnd-kit/sortable` in package.json
- [ ] T003 [P] Create directory structure for new route at `src/app/[locale]/(teacher)/courses/[courseId]/chapters/[chapterId]/`
- [ ] T004 [P] Read design mockups at `design/hybrid_chapter_page.html` and `design/course_tree_editor_redesign.html` for reference

**Checkpoint**: Dependencies verified, directory structure ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

### Tests for Foundational (TDD Required)

- [ ] T005 [P] Write failing test for `reorderRequestSchema` in `src/features/course-management/__tests__/chapters-schema.test.ts` — verify valid payload (`{items: [{id:1,order:1.5}]}`) parses, invalid payloads (`{items:[]}`, `{items:[{id:"abc",order:1}]}`, `{items:[{id:1}]}`) reject
- [ ] T006 [P] Write failing test for reorder optimistic update utility in `src/features/course-management/__tests__/reorder-logic.test.ts` — verify `applyOptimisticReorder(items, fromIndex, toIndex)` returns correctly reordered array, and `rollbackReorder(previousItems)` restores original order
- [ ] T007 [P] Write failing test for `listChapters` action in `src/features/course-management/__tests__/chapters-actions.test.ts` — verify response shape matches `ChapterOut[]`
- [ ] T008 [P] Write failing test for `listLessons` action in `src/features/course-management/__tests__/lessons-actions.test.ts` — verify response shape matches `LessonOut[]`

### Implementation for Foundational

- [ ] T009 Update `reorderItemSchema` in `src/features/course-management/chapters-schema.ts` — add `reorderRequestSchema` wrapper `{ items: z.array(reorderItemSchema) }` and validate min 2 items using `.refine()`
- [ ] T010 Create reorder utility in `src/features/course-management/reorder-utils.ts` — export `applyOptimisticReorder<T>(items: T[], fromIndex: number, toIndex: number): T[]` (uses `arrayMove` from `@dnd-kit/utilities`) and `buildReorderPayload<T extends { id: number }>(items: T[]): ReorderItem[]`
- [ ] T011 [P] Add `listChapters` function in `src/features/course-management/chapters-actions.ts` — `GET /api/v1/courses/{courseId}/chapters` returns `Result<ChapterOut[]>`
- [ ] T012 [P] Add `listLessons` function in `src/features/course-management/lessons-actions.ts` — `GET /api/v1/courses/{courseId}/lessons?chapter_id={chapterId}` returns `Result<LessonOut[]>`
- [ ] T013 [P] Add `listItems` function (if missing) in `src/features/course-management/items-actions.ts` — `GET /api/v1/courses/{courseId}/lessons/{lessonId}/items` returns `Result<ItemOut[]>`

### Verification for Foundational

- [ ] T014 Run all foundational tests — `npx vitest run src/features/course-management/__tests__/chapters-schema.test.ts src/features/course-management/__tests__/reorder-logic.test.ts src/features/course-management/__tests__/chapters-actions.test.ts src/features/course-management/__tests__/lessons-actions.test.ts` — all pass

**Checkpoint**: Foundation ready — schemas, reorder utilities, and list actions complete

---

## Phase 3: User Story 1 — Teacher views and enters a chaptered course (Priority: P1) 🎯 MVP

**Goal**: A teacher opens a chaptered course (`use_chapters = true`), sees a list of chapters, taps one, and navigates to a dedicated chapter page showing its lessons. Lessons expand inline to reveal items.

**Independent Test**: Open a course with `use_chapters = true`. Verify chapter list renders. Tap a chapter. Verify chapter page loads with lessons. Expand a lesson. Verify items appear inline.

### Implementation for User Story 1

- [ ] T015 [P] [US1] Rework `ChapterCard` in `src/features/course-management/components/chapter-card.tsx` — simplify to a clickable row with grip handle, chevron (always collapsed, no inline expansion), title, lesson count badge (from `lessonCount` prop), and ⋯ `DropdownMenu`. Remove all inline LessonList rendering. Click navigation via `next/navigation` `router.push()`.
- [ ] T016 [P] [US1] Rework `ChapterList` in `src/features/course-management/components/chapter-list.tsx` — wrap `ChapterCard` in a `DndContext` + `SortableContext` for chapter reorder. Add loading skeleton (`Skeleton` rows), empty state ("No chapters yet" + "New Chapter" button), error state (message + retry button). Import `listChapters` from `chapters-actions.ts`.
- [ ] T017 [P] [US1] Rewrite the course detail page at `src/app/[locale]/(teacher)/courses/[courseId]/page.tsx` — fetch course data, check `use_chapters`. If `true`, render `<ChapterList />`. If `false`, render `<LessonList />` (US2). Add loading/error states for the course fetch.
- [ ] T018 [P] [US1] Create `ChapterPage` at `src/app/[locale]/(teacher)/courses/[courseId]/chapters/[chapterId]/page.tsx` — fetch chapter data, fetch lessons via `listLessons(courseId, chapterId)`, render `EditorToolbar` with breadcrumb, chapter header with "Edit Chapter" button, and `<LessonList />`. Handle loading/error states.
- [ ] T019 [P] [US1] Create `EditorToolbar` in `src/features/course-management/components/editor-toolbar.tsx` — breadcrumb navigation using shadcn `Breadcrumb` with `ChevronLeft`/`ChevronRight` icons (RTL-aware via `rtl:rotate-180`), back navigation button. Props: `courseTitle`, `chapterTitle?`, `courseId`, `chapterId?`.
- [ ] T020 [US1] Rework `LessonCard` in `src/features/course-management/components/lesson-card.tsx` — bordered `Card` per mockup, header row with grip handle, `Collapsible` for item expansion, title, item count badge, processing status chip (bubbled from items), ⋯ `DropdownMenu` (Edit, Delete, Move to Chapter). Remove inline edit/delete dialogs from old card — actions live in ⋯ menu. Use `@base-ui/react/collapsible` primitives.
- [ ] T021 [US1] Rework `LessonList` in `src/features/course-management/components/lesson-list.tsx` — wrap `LessonCard` in `DndContext` + `SortableContext` for lesson reorder. Add loading skeleton, empty state ("No lessons yet" + "New Lesson" button), error state. Import `listLessons`.
- [ ] T022 [US1] Redesign `ItemCard` in `src/features/course-management/components/item-card.tsx` — per mockup: colored square type tile (22×22px, `rounded-md`) with white icon, item title, status chip (`Badge`: green "جاهز" for ready, amber "بيتحول" for processing, "n أسئلة" for exam). Grip handle with reduced opacity (0.4). No inline border — items are flat rows. Upload/edit/delete actions in hover-revealed buttons (not in ⋯ menu per current convention — keep upload pattern from latest iteration).
- [ ] T023 [US1] Rework `ItemList` in `src/features/course-management/components/item-list.tsx` — wrap `ItemCard` in `DndContext` + `SortableContext` for item reorder. Add skeleton, empty state ("No items yet" + "Add Item" button), error state. Import `listItems`.

### Verification for User Story 1

- [ ] T024 [US1] Run app dev server, navigate to a chaptered course, tap a chapter, verify lessons load and items expand/collapse inline

**Checkpoint**: Chaptered navigation works end-to-end — chapters listed, chapter page loads, lessons expand to items

---

## Phase 4: User Story 2 — Teacher views a flat course (Priority: P1)

**Goal**: A teacher opens a flat course (`use_chapters = false`) and sees lessons listed directly on the course page, with inline item expansion — no chapter level.

**Independent Test**: Open a course with `use_chapters = false`. Verify lessons render on the course page directly. Expand a lesson. Verify items appear. No chapter navigation exists.

### Implementation for User Story 2

- [ ] T025 [US2] Update course page at `src/app/[locale]/(teacher)/courses/[courseId]/page.tsx` — the `use_chapters = false` branch already renders `<LessonList />` (from T017). Ensure `LessonList` is called without a `chapterId` prop (allows `listLessons(courseId)` to fetch all lessons without chapter filter).
- [ ] T026 [US2] Ensure `LessonList` in `src/features/course-management/components/lesson-list.tsx` accepts optional `chapterId` prop — when `undefined`, `listLessons` omits the `chapter_id` query param, fetching all lessons for the course (flat mode).
- [ ] T027 [US2] Verify `EditorToolbar` in flat mode — no chapter breadcrumb, just course title. Back button navigates to courses list.

### Verification for User Story 2

- [ ] T028 [US2] Open a flat course, verify lessons render directly on course page, expand/collapse works, no chapter grouping visible

**Checkpoint**: Both chaptered and flat modes functional

---

## Phase 5: User Story 3 — Teacher adds, renames, and removes a chapter (Priority: P1)

**Goal**: Teacher creates new chapters, renames existing ones, and deletes them (with cautions). Chapter operations happen on the course page.

**Independent Test**: Create a chapter, rename it, delete it. Verify UI updates after each operation.

### Implementation for User Story 3

- [ ] T029 [US3] Add "New Chapter" button and create dialog to `ChapterList` in `src/features/course-management/components/chapter-list.tsx` — button at bottom of list triggers `Dialog` with title input. On submit, call `POST /api/v1/courses/{courseId}/chapters` via existing `createChapter` action, prepend result to list.
- [ ] T030 [US3] Add "Edit" + "Delete" actions to `ChapterCard`'s ⋯ `DropdownMenu` in `src/features/course-management/components/chapter-card.tsx` — "Edit" opens rename `Dialog`, "Delete" opens confirmation `Dialog` with caution about nested lessons. Wire to existing `updateChapter` and `deleteChapter` actions.
- [ ] T031 [US3] Ensure `createChapter`, `updateChapter`, `deleteChapter` in `src/features/course-management/chapters-actions.ts` already exist and return `Result<ChapterOut>` — add if missing.

### Verification for User Story 3

- [ ] T032 [US3] Create, rename, and delete chapters on course page. Verify list updates immediately after each operation and persists on refresh.

**Checkpoint**: Chapter CRUD operational

---

## Phase 6: User Story 4 — Teacher adds, renames, and removes a lesson (Priority: P1)

**Goal**: Teacher creates, renames, and deletes lessons within the current level (chapter page or flat course page). Delete shows caution about nested items.

**Independent Test**: Create a lesson, rename it, delete it. Verify lesson list updates immediately.

### Implementation for User Story 4

- [ ] T033 [US4] Add "New Lesson" button and create dialog to `LessonList` in `src/features/course-management/components/lesson-list.tsx` — button at bottom triggers `Dialog` with title input. On submit, call `POST /api/v1/courses/{courseId}/lessons?chapter_id={chapterId}` via existing `createLesson` action, append to list.
- [ ] T034 [P] [US4] Add "Edit" + "Delete" actions to `LessonCard`'s ⋯ `DropdownMenu` in `src/features/course-management/components/lesson-card.tsx` — "Edit" opens rename `Dialog` (title field), "Delete" opens confirmation `Dialog` with caution about nested items. Wire to existing `updateLesson` and `deleteLesson` actions.
- [ ] T035 [P] [US4] Ensure `createLesson`, `updateLesson`, `deleteLesson` in `src/features/course-management/lessons-actions.ts` already exist and return `Result<LessonOut>` — add if missing.

### Verification for User Story 4

- [ ] T036 [US4] On a chapter page (and flat course page), create, rename, and delete lessons. Verify list updates after each operation.

**Checkpoint**: Lesson CRUD operational in both modes

---

## Phase 7: User Story 5 — Teacher adds, renames, and removes an item within a lesson (Priority: P2)

**Goal**: Teacher creates, renames, and deletes items within an expanded lesson. Items show colored type tiles and processing status.

**Independent Test**: Expand a lesson, create an item, rename it, delete it. Verify item list updates immediately.

### Implementation for User Story 5

- [ ] T037 [US5] Add "Add Item" button and create dialog to `ItemList` in `src/features/course-management/components/item-list.tsx` — button at bottom of expanded lesson triggers `Dialog` with title input. On submit, call `POST /api/v1/courses/{courseId}/lessons/{lessonId}/items` via existing `createItem` action, append to list.
- [ ] T038 [P] [US5] Add edit and delete functionality to `ItemCard` in `src/features/course-management/components/item-card.tsx` — edit button opens rename `Dialog`, delete button opens confirmation `Dialog`. Wire to existing `updateItem` and `deleteItem` actions.
- [ ] T039 [P] [US5] Implement item processing status inference in `src/features/course-management/item-utils.ts` — export `getItemStatus(item: ItemOut): "empty" | "uploading" | "processing" | "ready" | "failed"` that checks `bunny_stream_id`, `document_path`, and local upload state. Export `getLessonStatus(items: ItemOut[]): "processing" | "ready" | "failed" | "mixed"` for lesson-level bubble-up.
- [ ] T040 [US5] Wire status chips in `ItemCard` — use `Badge` component with variant mapping: ready → green, processing → amber with `Loader2` icon, exam → neutral with question count. Wire `getLessonStatus` to `LessonCard` header chip.

### Verification for User Story 5

- [ ] T041 [US5] Expand a lesson, create items, rename, delete. Verify item list updates, type tiles render with correct colors, status chips show correctly after upload.

**Checkpoint**: Item CRUD operational with processing states

---

## Phase 8: User Story 6 — Teacher reorders content at every level (Priority: P2)

**Goal**: Teacher reorders chapters (course page), lessons within a chapter (or course page in flat mode), and items within a lesson — all via drag-and-drop. Optimistic update with rollback on error.

**Independent Test**: Reorder chapters on course page. Reorder lessons on chapter page. Reorder items within a lesson. Trigger an error scenario to verify rollback.

### Tests for User Story 6 (TDD Required)

- [ ] T042 [P] [US6] Write failing test for `reorderChapters` action in `src/features/course-management/__tests__/chapters-actions.test.ts` — verify sends correct `ReorderRequest` payload, handles error with rollback
- [ ] T043 [P] [US6] Write failing test for `reorderLessons` action in `src/features/course-management/__tests__/lessons-actions.test.ts`
- [ ] T044 [P] [US6] Write failing test for `reorderItems` action in `src/features/course-management/__tests__/items-actions.test.ts`

### Implementation for User Story 6

- [ ] T045 [US6] Add `reorderChapters` function in `src/features/course-management/chapters-actions.ts` — `PUT /api/v1/courses/{courseId}/chapters/reorder` with `ReorderRequest` body. Returns `Result<ChapterOut[]>`.
- [ ] T046 [US6] Add `reorderLessons` function in `src/features/course-management/lessons-actions.ts` — `PUT /api/v1/courses/{courseId}/lessons/reorder` with `ReorderRequest` body.
- [ ] T047 [US6] Add `reorderItems` function in `src/features/course-management/items-actions.ts` — `PUT /api/v1/courses/{courseId}/lessons/{lessonId}/items/reorder` with `ReorderRequest` body.
- [ ] T048 [US6] Wire chapter DnD in `ChapterList` — on `DragEnd`, call `applyOptimisticReorder` on local state, call `reorderChapters`, on error call `rollbackReorder` + show toast
- [ ] T049 [US6] Wire lesson DnD in `LessonList` — same pattern: optimistic update → `reorderLessons` → rollback on error
- [ ] T050 [US6] Wire item DnD in `ItemList` — same pattern: optimistic update → `reorderItems` → rollback on error
- [ ] T051 [US6] Ensure `canReorder` logic shows controls only when 2+ items exist at each level

### Verification for User Story 6

- [ ] T052 [US6] Drag-reorder chapters, lessons, and items. Verify optimistic update is instant, rollback works on error (simulate by disconnecting network). Verify `canReorder` hides controls for single items.

**Checkpoint**: Full reordering operational with optimistic updates and rollback

---

## Phase 9: User Story 7 — Teacher navigates back up without losing their place (Priority: P2)

**Goal**: When a teacher leaves a chapter page and returns, scroll position and expanded lesson states are preserved.

**Independent Test**: Enter a chapter, scroll to a lesson, expand it, navigate back, re-enter the same chapter. Verify scroll position and expanded state are restored.

### Implementation for User Story 7

- [ ] T053 [US7] Store `ChapterPage` scroll position + expanded lesson IDs in a React context (`ChapterNavigationContext`) at the course page level in `src/features/course-management/chapter-navigation-context.tsx` — keyed by `{courseId, chapterId}`. Restore on re-enter.
- [ ] T054 [US7] Wire scroll restoration in `ChapterPage` — on mount, read context for saved scroll position and expanded lesson IDs, restore both. On unmount (navigation away), save current scroll position and expanded IDs to context.
- [ ] T055 [US7] Ensure the context persists across navigation within the same session (client-side only, does not persist across page refresh)

### Verification for User Story 7

- [ ] T056 [US7] Enter a chapter, scroll down, expand 2-3 lessons, navigate back to course page, re-enter same chapter. Verify scroll position is near where you left off and the same lessons are still expanded.

**Checkpoint**: Navigation persistence operational

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, accessibility, RTL verification

- [ ] T057 [P] Verify RTL rendering in all components — run app with Arabic locale, check chevron directions (`rtl:rotate-180`), guide line positions (`border-inline-start`), grip handle at row start, ⋯ menu at row end, breadcrumb arrow direction
- [ ] T058 [P] Add keyboard navigation for reorder — ensure `KeyboardSensor` from `@dnd-kit` is configured for all three sortable contexts (chapters, lessons, items)
- [ ] T059 [P] Add `aria-labels` to all action buttons in `DropdownMenu`, grip handles, chevrons, breadcrumb links
- [ ] T060 [P] Add reduced-motion support — wrap drag transitions in `prefers-reduced-motion` query, disable drag animations when active
- [ ] T061 Add route-level loading UI at `src/app/[locale]/(teacher)/courses/[courseId]/loading.tsx` and `src/app/[locale]/(teacher)/courses/[courseId]/chapters/[chapterId]/loading.tsx` with `Skeleton` components
- [ ] T062 Add route-level error UI at `src/app/[locale]/(teacher)/courses/[courseId]/error.tsx` and `src/app/[locale]/(teacher)/courses/[courseId]/chapters/[chapterId]/error.tsx` with retry button
- [ ] T063 Run E2E tests — `npx playwright test e2e/course-management.spec.ts` — verify all flows pass
- [ ] T064 Run type check — `npx tsc --noEmit` — zero errors
- [ ] T065 Run full test suite — `npx vitest run` — all tests pass

**Checkpoint**: Full feature complete, all tests passing, RTL verified

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational
  - US1 (Phase 3) is the MVP — must come first
  - US2 (Phase 4) can proceed in parallel with US3-5 if desired (no hard dependency beyond Foundational)
  - US3 (Phase 5) depends on US1 (ChapterCard needs to exist first)
  - US4 (Phase 6) can proceed after US1 or US2 (LessonCard needed)
  - US5 (Phase 7) depends on US4 (items need a lesson to live in)
  - US6 (Phase 8) depends on US3+US4+US5 (reorder needs entities to exist)
  - US7 (Phase 9) depends on US1 (navigation persistence only relevant to chaptered mode)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **US1** (P1): Can start after Foundational — no dependencies on other stories
- **US2** (P1): Can start after Foundational — independently testable from US1
- **US3** (P1): Depends on US1 (ChapterCard, ChapterList)
- **US4** (P1): Depends on US1 (LessonCard, LessonList) or US2 (flat mode)
- **US5** (P2): Depends on US4 (ItemCard, ItemList need LessonList)
- **US6** (P2): Depends on US3 + US4 + US5 (needs chapters, lessons, items)
- **US7** (P2): Depends on US1 (navigation pattern)

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation (Phases with TDD-labeled tests)
- Infrastructure/list actions before UI components
- Schema before actions
- Actions before components
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- US1 (Phase 3) and US2 (Phase 4) can start in parallel after Foundational
- All component-rework tasks within a phase marked [P] can run in parallel
- Multiple user stories can be worked on in parallel by different developers after their dependencies are met

---

## Parallel Example: US1 + US2 (P1 stories)

```bash
# After Foundational, launch US1 and US2 in parallel:
Task: "US1 — Rework ChapterCard, ChapterList, ChapterPage"
Task: "US2 — Ensure course page branches on use_chapters"
```

## Parallel Example: Chapter CRUD + Lesson CRUD (US3 + US4)

```bash
# After US1, launch US3 and US4 together:
Task: "US3 — Add chapter create/rename/delete to ChapterCard ⋯ menu"
Task: "US4 — Add lesson create/rename/delete to LessonCard ⋯ menu"
```

---

## Implementation Strategy

### MVP (Phase 1 + 2 + 3) — User Story 1 Only

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 (Chaptered navigation)
4. **STOP and VALIDATE**: Open a chaptered course, navigate into a chapter, expand lessons to items
5. Ship/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Chaptered navigation) → Test → Deploy/Demo (MVP!)
3. Add US2 (Flat mode) → Test → Deploy/Demo
4. Add US3 (Chapter CRUD) + US4 (Lesson CRUD) → Test → Deploy/Demo
5. Add US5 (Item CRUD + processing states) → Test → Deploy/Demo
6. Add US6 (Reorder all levels) → Test → Deploy/Demo
7. Add US7 (Navigation persistence) + Polish → Test → Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Developer A: US1 (Chaptered navigation — P1 MVP)
3. Developer B: US2 (Flat mode — P1)
4. After US1: Developer A continues with US3 (Chapter CRUD)
5. After US1: Developer B continues with US4 (Lesson CRUD)
6. After US3+US4: Both continue with US5 (Items), US6 (Reorder), US7 (Persistence)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD-managed tests must fail before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
