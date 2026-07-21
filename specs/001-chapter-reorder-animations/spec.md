# Chapter Reorder with Animations

## Overview

Teachers managing courses with chapters need to rearrange the sequence of chapters. Currently there is no way to change chapter order without deleting and recreating them. This feature introduces an intuitive drag-and-drop interface with smooth visual feedback for reordering chapters within a course.

## Actors

- **Teacher** — the primary user who manages course content

## User Scenarios & Testing

### Scenario 1: Teacher reorders chapters via drag-and-drop

**Given** a course has 5 chapters displayed in numbered order
**When** the teacher drags chapter 5 to the position of chapter 2
**Then** all chapters visually re-animate to reflect the new order
**And** the updated order is saved to the system
**And** a success confirmation is shown

### Scenario 2: Teacher reorders chapters using move buttons

**Given** a course has 4 chapters
**When** the teacher clicks the "Move Up" button on chapter 3
**Then** chapter 3 swaps position with chapter 2 with an animated transition
**And** the updated order is saved

### Scenario 3: Teacher cancels a reorder attempt

**Given** the teacher has dragged a chapter to a new position
**When** they press Escape before releasing
**Then** the chapter returns to its original position with an animation
**And** no save occurs

### Scenario 4: Reorder fails due to network error

**Given** the teacher has completed a drag-and-drop reorder
**When** the save request fails
**Then** the chapters revert to their previous order with an animation
**And** an error message with a retry option is displayed

### Scenario 5: Single chapter cannot be reordered

**Given** a course has only 1 chapter
**When** the teacher views the chapter list
**Then** no drag handles or move buttons are shown
**And** a tooltip indicates "Add more chapters to reorder"

## Functional Requirements

### FR-01: Drag-and-Drop Reordering

Teachers can reorder chapters by clicking and dragging a chapter card to a new position in the list. A visual drag handle is provided on each chapter. While dragging, a ghost/placeholder element shows where the chapter will land, and adjacent chapters animate to make space.

### FR-02: Move Up / Move Down Buttons

Each chapter has "Move Up" and "Move Down" buttons as an alternative to drag-and-drop, ensuring accessibility for keyboard and screen reader users.

### FR-03: Animated Visual Feedback

All order changes are animated:
- Drag ghost follows the cursor smoothly
- Target slot shows a clear insertion indicator
- Adjacent chapters animate apart/together with a spring or ease-out motion
- On drop, chapters animate to their final positions
- On cancel (Escape), chapter animates back to origin

### FR-04: Auto-Save on Reorder

Once a reorder is completed (drop or button click), the new order is automatically saved. No manual "Save Order" button is required.

### FR-05: Optimistic UI with Rollback

The UI updates immediately to the new order on drop (optimistic update). If the save request fails, the UI reverts to the previous order with an animation and shows an error message with a retry action.

### FR-06: Concurrent Edit Protection

If another user modifies the course while a teacher is reordering, the save fails and the teacher sees a conflict message: "Course was modified. Please refresh and try again."

### FR-07: Keyboard Accessibility

All reorder actions are available via keyboard:
- Tab to focus drag handle or move buttons
- Enter/Space to pick up a chapter (drag mode)
- Arrow Up/Down to move to new position
- Enter/Space to drop
- Escape to cancel

### FR-08: Screen Reader Announcements

Screen readers announce:
- "Chapter [title] picked up" when drag starts
- "Moved to position [N]" during reorder
- "Chapter [title] dropped at position [N]" on completion
- "Reorder cancelled" on Escape
- "Reorder failed" on error

## Success Criteria

| Criterion | Measure |
|-----------|---------|
| Teachers can complete a reorder in under 5 seconds | Time to completion for a single chapter move |
| Reorder save succeeds on first attempt 99% of the time | Success rate from system logs |
| All reorder animations render at 60fps | Frame rate measured during interaction |
| Users rate reorder experience 4/5 or higher | Post-release satisfaction survey |
| Zero assistive technology regressions | Screen reader and keyboard-only testing passes |
| Drag-and-drop works on touch devices | Touch input detected and handled |

## Key Entities

### Chapter

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique identifier |
| course_id | Integer | Parent course |
| title | String | Chapter display name |
| order | Number | Sort position (1-based) |

### Reorder Operation

| Field | Type | Description |
|-------|------|-------------|
| chapter_id | Integer | Chapter being moved |
| from_position | Integer | Original position |
| to_position | Integer | Target position |

## Assumptions

- The course uses chapters (use_chapters flag is true)
- A chapter reorder API endpoint exists (PUT /api/v1/courses/{course_id}/chapters/reorder)
- The system supports 1-based ordering for chapters
- Animations use CSS transitions or a lightweight animation library compatible with the existing UI framework
- The maximum number of chapters per course is reasonably small (< 100), so all chapters can be rendered in a single list

## Dependencies

- Chapter list component already exists and displays chapters in order
- Reorder API endpoint contract is already defined in the OpenAPI spec
- Auth/authorization is already handled by the parent course page

## Scope

### In Scope

- Visual reorder of chapters within a course
- Drag-and-drop with animations
- Move Up / Move Down buttons
- Auto-save on reorder
- Error handling with retry
- Keyboard and screen reader accessibility

### Out of Scope

- Reordering lessons or items (separate features)
- Bulk reorder (moving multiple chapters at once)
- Cross-course chapter moves
- Undo after successful save
- Chapter reorder within the lesson creation flow
