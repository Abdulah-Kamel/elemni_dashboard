# Feature Specification: Hybrid Course Content Editor

**Feature Branch**: `003-hybrid-content-editor`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Revise course content editor with hybrid navigation model replacing full inline tree"

## User Scenarios & Testing

### User Story 1 - Teacher views and enters a chaptered course (Priority: P1)

A teacher opens a course that uses chapters (`use_chapters = true`). They see a list of chapters only — no lessons visible at this level. They tap a chapter to enter it, which takes them to a dedicated view showing only that chapter's lessons. Each lesson is collapsed by default showing its title and metadata. The teacher can expand any lesson inline to reveal its items.

**Why this priority**: This is the primary navigation model — if teachers cannot enter a chapter and see its lessons, the entire chaptered mode is non-functional.

**Independent Test**: Open a course with chapters enabled. Verify the page lists chapters only. Enter a chapter by tapping it. Verify the chapter view shows its lessons. Expand a lesson to see its items.

**Acceptance Scenarios**:

1. **Given** a course with `use_chapters = true` and 3 chapters, **When** the teacher opens the course page, **Then** the page shows exactly 3 chapter entries, no lessons visible at this level
2. **Given** the teacher is on the course page, **When** they tap a chapter, **Then** the view transitions to show that chapter's lessons only, with a visible navigation cue to return to the course page
3. **Given** the teacher is on a chapter page with 5 lessons, **When** they tap a lesson, **Then** the lesson expands inline revealing its item list
4. **Given** a lesson is expanded showing 3 items, **When** the teacher taps the lesson header again, **Then** the lesson collapses hiding its items
5. **Given** the teacher is on a chapter page, **When** they tap the navigation cue to go back, **Then** they return to the course page showing chapter list, preserving any previous state

---

### User Story 2 - Teacher views a flat course (Priority: P1)

A teacher opens a course without chapters (`use_chapters = false`). The course page lists lessons directly as the top-level content. Each lesson is collapsed by default showing its title and metadata. The teacher can expand any lesson inline to see its items.

**Why this priority**: Flat mode is a first-class path — courses without chapters must remain fully functional. This is not an afterthought.

**Independent Test**: Open a flat course. Verify lessons display without any chapter level. Expand/collapse lessons to reveal items.

**Acceptance Scenarios**:

1. **Given** a course with `use_chapters = false` and 8 lessons, **When** the teacher opens the course page, **Then** the page shows all 8 lessons directly, with no chapter grouping
2. **Given** the teacher is on a flat course page, **When** they expand a lesson, **Then** the lesson's items appear inline below it
3. **Given** a lesson is expanded showing 3 items, **When** the teacher collapses it, **Then** items hide and the return to the lesson list

---

### User Story 3 - Teacher adds, renames, and removes a chapter (chaptered mode only) (Priority: P1)

A teacher managing a chaptered course can create new chapters, rename existing ones, and delete chapters. These operations are performed from the course-level page where chapters are listed.

**Why this priority**: Chapter CRUD is foundational to chaptered mode content management.

**Independent Test**: Create a chapter, rename it, then delete it within the same session. Verify each operation appears in the correct position.

**Acceptance Scenarios**:

1. **Given** the teacher is on the course page showing chapter list, **When** they initiate chapter creation, provide a title, and confirm, **Then** the new chapter appears in the list at its assigned position
2. **Given** a chapter exists, **When** the teacher renames it with a new title, **Then** the chapter reflects the updated title immediately
3. **Given** a chapter exists with lessons inside it, **When** the teacher deletes it, **Then** the system prompts for confirmation noting that all lessons inside will be removed
4. **Given** the teacher confirms deletion, **When** the operation completes, **Then** the chapter is removed from the list and its contents are deleted

---

### User Story 4 - Teacher adds, renames, and removes a lesson within the current level (Priority: P1)

A teacher can create, rename, and delete lessons. In chaptered mode, lessons live within the chapter page. In flat mode, lessons live directly on the course page. Each operation is scoped to the current level.

**Why this priority**: Lesson management is the core editing workflow in both modes.

**Independent Test**: On a chapter page (or flat course page), create a lesson, rename it, then delete it. Verify correct positioning.

**Acceptance Scenarios**:

1. **Given** the teacher is on a chapter page with an empty lesson list, **When** they add a new lesson, **Then** the lesson appears as the first (or only) entry in the list
2. **Given** the teacher is on a flat course page with lessons listed, **When** they add a new lesson, **Then** the lesson appears appended to the list
3. **Given** any lesson, **When** the teacher renames it, **Then** the change reflects immediately
4. **Given** a lesson with items, **When** the teacher deletes it, **Then** the system prompts for confirmation that its items will also be deleted
5. **Given** the teacher confirms deletion, **When** the lesson is removed, **Then** it disappears from the list and its items are gone

---

### User Story 5 - Teacher adds, renames, and removes an item within a lesson (Priority: P2)

A teacher can create, rename, and delete items within an expanded lesson. Items are content building blocks (videos, documents, exams, text). Items are visible only when the parent lesson is expanded inline.

**Why this priority**: Item management is the most granular editing task. Teachers need to add content pieces to lessons.

**Independent Test**: Expand a lesson, create an item, rename it, then delete it. Verify the lesson shows correct item count.

**Acceptance Scenarios**:

1. **Given** a lesson is expanded inline, **When** the teacher adds a new item via the item creation control, **Then** the item appears at the bottom of the item list
2. **Given** an item in the list, **When** the teacher changes its title, **Then** the new title is displayed immediately
3. **Given** an item in the list, **When** the teacher deletes it, **Then** the system confirms the action, and upon confirmation the item is removed
4. **Given** a lesson with no items, **When** the teacher looks at it, **Then** the lesson shows an empty state indicating no items yet, with a clear action to add the first one

---

### User Story 6 - Teacher reorders content at every level (Priority: P2)

Teachers can reorder chapters (course page), lessons within a chapter (chapter page, or course page in flat mode), and items within a lesson (inline). All reordering operations require siblings to be visible together so the teacher can compare and position accurately.

**Why this priority**: Reordering directly affects the student's learning sequence. Being able to see siblings during reorder is essential for informed comparison decisions.

**Acceptance Scenarios**:

1. **Given** the teacher is on a course page with 4 chapters, **When** they reorder the chapters by dragging, **Then** the chapter positions update accordingly and the change persists after save
2. **Given** the teacher is on a chapter page with 6 lessons, **When** they reorder lessons using drag-and-drop, **Then** lesson positions update and the reorder persists
3. **Given** a lesson is expanded with items visible, **When** the teacher reorders items, **Then** items reposition and the new order persists
4. **Given** any reordering operation fails (e.g., conflict error from the server), **When** the operation completes, **Then** the display reverts to the previous order and the teacher sees an error notification
5. **Given** a single lesson or item exists, **When** the teacher inspects reorder controls, **Then** reorder controls are absent or disabled since there's nothing to compare

---

### User Story 7 - Teacher navigates back up without losing their place (Priority: P2)

A teacher drills into a chapter from the course page. They expand several lessons and scroll down the chapter page. When they navigate back to the course page, they expect to return to roughly where they were — not be reset to the top. Similarly, when returning to a chapter they were working on, expanded/collapsed lesson states should persist.

**Why this priority**: Mobile-first navigation means teachers frequently go in and out of chapters. Losing scroll position or expanded state on each round-trip makes the feature unusable on large courses.

**Independent Test**: Enter a chapter, scroll down, expand a few lessons, navigate back to course page, then re-enter the same chapter. Verify scroll position and expanded states are preserved.

**Acceptance Scenarios**:

1. **Given** the teacher enters a chapter, scrolls to a lesson in the middle, and expands it, **When** they navigate back to the course page then re-enter the same chapter, **Then** the chapter page scrolls to the same lesson and its expanded state is preserved
2. **Given** the teacher enters a chapter and expands multiple lessons, **When** they leave and return, **Then** all previously expanded lessons remain expanded
3. **Given** the teacher is in a chapter and navigates back to the course page, **When** they arrive at the course page, **Then** the course page scroll position is near the top (showing the chapter list)

---

### Edge Cases

- What happens when `use_chapters` status changes on an existing course with content? The API dictates this — the spec merely follows it.
- What happens when a teacher navigates to a chapter URL directly (bookmark or deep link)? The chapter page loads with its lesson list, all lessons collapsed.
- What happens when the last chapter is deleted? The course page shows an empty chapter list with a prompt to create the first chapter.
- What happens when the last lesson in a chapter is deleted? The chapter page shows an empty lesson list with a prompt to create the first lesson.
- What happens when a lesson with an in-progress upload is collapsed? The collapse action is blocked while any upload is active. The teacher must wait for the upload to complete or cancel it explicitly before collapsing the lesson.
- What happens when the teacher has unsaved changes and navigates away? The system should warn before navigating away from unsaved content.

## Requirements

### Functional Requirements

- **FR-001**: System MUST display chapters only on the course page when `use_chapters = true`, with no lessons visible
- **FR-002**: System MUST display lessons directly on the course page when `use_chapters = false`, with no chapter groupings
- **FR-003**: Teachers MUST be able to enter a chapter by tapping it, revealing a dedicated chapter page with that chapter's lessons
- **FR-004**: Teachers MUST be able to return from a chapter page to the course page
- **FR-005**: Teachers MUST be able to expand a lesson inline to reveal its item list
- **FR-006**: Teachers MUST be able to collapse a lesson inline to hide its items
- **FR-007**: Teachers MUST be able to create, rename, and delete chapters (chaptered mode only)
- **FR-008**: Teachers MUST be able to create, rename, and delete lessons at the current level
- **FR-009**: Teachers MUST be able to create, rename, and delete items within a lesson
- **FR-010**: Teachers MUST be able to reorder chapters within a course
- **FR-011**: Teachers MUST be able to reorder lessons within a chapter (or within course in flat mode)
- **FR-012**: Teachers MUST be able to reorder items within a lesson
- **FR-013**: Sibling reordering MUST display all siblings simultaneously for comparison
- **FR-014**: System MUST show an appropriate state for every async region: loading, empty, error
- **FR-015**: Lesson items MUST surface processing states (uploading, processing, ready, failed) on the item row
- **FR-016**: Item processing state MUST be visible at the lesson level (bubbled up) when relevant
- **FR-017**: When navigating back up from a chapter page to the course page, and then re-entering the same chapter, scroll position and expanded lesson states MUST be preserved
- **FR-018**: System MUST show a caution when trying to delete a chapter that contains lessons
- **FR-019**: System MUST show a caution when trying to delete a lesson that contains items
- **FR-020**: Flat mode MUST behave identically to chaptered mode for all lesson and item operations, differing only in the absence of the chapter navigation level
- **FR-021**: Empty states MUST include a clear action to add the first item at that level (first chapter, first lesson, first item)

### Key Entities

- **Course**: The top-level container. Controls chaptered vs flat behavior via `use_chapters` flag. Has its own list/create/edit/publish flow (unchanged by this spec).
- **Chapter**: A grouping of lessons. Present only when `use_chapters = true`. Has a title, order position, and belongs to a course.
- **Lesson**: A content container. Belongs to either a chapter (chaptered mode) or directly to a course (flat mode). Has a title, optional description, order position. Can be expanded inline to reveal items.
- **Item**: A content leaf node. Belongs to a lesson. Represents a single learning material (video, document, exam, or text). Has a title, type, order position, and processing state(s).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Teachers can navigate from the course page into a chapter and back within 3 taps (or equivalent interactions)
- **SC-002**: Teachers can access all lesson and item editing operations (create, rename, delete, reorder) with no more than 2 taps from the current view
- **SC-003**: Chapter page loads lessons within 2 seconds (standard condition) — same as current performance baseline
- **SC-004**: Navigation state (scroll position, expanded lessons) is preserved with 100% fidelity when the teacher leaves and returns to a chapter within the same session
- **SC-005**: All reorder operations complete without visual flicker or position jump — the list updates smoothly to reflect the new order and persists correctly
- **SC-006**: Flat mode and chaptered mode share the same lesson/item editing interface — teachers do not need to learn two different interaction patterns

## Assumptions

- Existing course list/create/edit/publish feature is unchanged — this spec only touches the content editor (the course detail page and its sub-pages)
- Chapter reorder endpoint, lesson reorder endpoint, and item reorder endpoint already exist and follow the same patterns established in earlier specs
- The API's `use_chapters` field determines the mode and is immutable within a given course page session
- Deep linking to a chapter by URL is a valid starting state (not a navigation error)
- All processing states (uploading, processing, ready, failed) are provided by the backend and this spec only requires that the UI surfaces them
- Students' view of the content is unaffected by these editor changes — this is teacher-side only
- Lessons and items within a chapter are ordered by an integer `order` property, as established in earlier specs
- Reordering uses drag-and-drop as the primary interaction (pointer + touch), with accessible keyboard alternatives

## Open Questions

### Cross-chapter lesson moves

This model places each lesson on its parent chapter's page. Moving a lesson from one chapter to another is not a same-screen gesture. Recorded for clarification — three possible approaches:

(a) **Out of scope**: Cross-chapter moves are not supported. Teachers must delete and re-create.
(b) **Menu action with chapter picker**: A "Move to Chapter" action in the lesson's menu opens a selector showing available chapters.
(c) **Drag (same-screen)**: Only feasible if chapters are navigated in a single scrollable tree, which this model explicitly avoids.

**Recommended default for spec purposes**: (b) Menu action with chapter picker, as it works within the navigation model without requiring a full-page tree. Marked for clarification when planning begins.
