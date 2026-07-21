# Implementation Plan: Hybrid Course Content Editor

**Branch**: `003-hybrid-content-editor` | **Date**: 2026-07-21 | **Spec**: specs/003-hybrid-content-editor/spec.md

**Input**: Feature specification from `specs/003-hybrid-content-editor/spec.md`

## Summary

Replace the full inline tree editor with a hybrid navigation model: chapters are navigation targets (dedicated pages), lessons expand inline inside the chapter page, and items expand inline inside the lesson. Flat mode (`use_chapters = false`) skips the chapter level, listing lessons directly on the course page. The same lesson/item components serve both modes — flat mode simply renders lessons at the top level instead of chapters.

**Technical approach**: Next.js route `courses/[id]` branches on `use_chapters` to render either a chapter list or a direct lesson list. A new route `courses/[id]/chapters/[chapterId]` serves as the chapter page. Lesson→item expansion uses `@base-ui/react/collapsible` primitives. Reordering uses `@dnd-kit` scoped per level. The `DropdownMenu` from shadcn/ui hosts destructive actions.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Next.js 15 (App Router), React 19

**Primary Dependencies**: `@base-ui/react` (Collapsible primitives), `@dnd-kit/core` + `@dnd-kit/sortable` (reordering), `lucide-react` (icons), `zod` (schema validation), `next-intl` (i18n), `sonner` (toasts)

**Storage**: Server API — no client-side persistence (API manages all data)

**Testing**: `vitest` (unit/component tests), `@playwright/test` (E2E), `@testing-library/react` (component tests)

**Target Platform**: Modern browsers (Chrome, Firefox, Safari — desktop + mobile)

**Project Type**: Next.js 15 App Router (frontend-only; backend is a separate API)

**Performance Goals**: Chapter page loads lessons within 2s; reorder optimistic update responds in <100ms; navigation transitions feel instant (<300ms)

**Constraints**: No `updated_at` or version field on ChapterOut/LessonOut/ItemOut — concurrent edit risk managed via optimistic rollback on error. Reorder is a full `{id, order}[]` array (fractional order), not incremental swaps.

**Scale/Scope**: Single teacher per course. 40+ lessons per large course. Mobile as primary use case.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The `.specify/memory/constitution.md` is an unfilled template containing only placeholders (`[PRINCIPLE_1_NAME]`, etc.). No actual project constitution has been ratified. All gates pass by default.

**Constitution Article I** (from the user's spec input): *"This renders structure, it never decides a rule. use_chapters behavior, reorder validity, and what a published course allows are the API's calls."* — The plan follows the API contract from `openapi.json` faithfully; no business logic decisions are made in the frontend.

**Constitution Article VIII** (from user's plan input): *"TDD is mandatory for API client, zod schemas, and reorder logic."* — Enforced in the task structure. Presentational UI tests follow implementation.

## Project Structure

### Documentation (this feature)

```text
specs/003-hybrid-content-editor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/features/course-management/
├── chapters-schema.ts         # EXISTING — update with ReorderRequest
├── lessons-schema.ts          # EXISTING — update with ReorderRequest
├── items-schema.ts            # EXISTING — update with ReorderRequest
├── chapters-actions.ts        # EXISTING — add list + reorder endpoints
├── lessons-actions.ts         # EXISTING — add list + reorder endpoints
├── items-actions.ts           # EXISTING — add reorder endpoint
├── chapters-queries.ts        # EXISTING — add SWR fallback
├── lessons-queries.ts         # EXISTING — add SWR fallback
├── items-queries.ts           # EXISTING — add SWR fallback
├── components/
│   ├── chapter-card.tsx       # REWORK — simpler row (no lesson nesting)
│   ├── chapter-list.tsx       # REWORK — just chapter rows + create button
│   ├── lesson-card.tsx        # REWORK — collapsible item tree inside
│   ├── lesson-list.tsx        # REWORK — scoped DnD for lessons
│   ├── item-card.tsx          # ADAPT — status chip + color tile
│   ├── item-list.tsx          # REWORK — scoped DnD for items
│   ├── upload-dialog.tsx      # EXISTING — unchanged
│   ├── course-content-editor.tsx  # NEW — orchestrates mode branching
│   └── editor-toolbar.tsx     # NEW — top bar with breadcrumb + actions
├── app/[locale]/(teacher)/courses/[courseId]/
│   ├── page.tsx               # REWORK — branch on use_chapters
│   └── chapters/[chapterId]/
│       └── page.tsx           # NEW — chapter page
└── __tests__/
    ├── chapters-schema.test.ts
    ├── lessons-schema.test.ts
    ├── items-schema.test.ts
    ├── chapters-actions.test.ts
    ├── lessons-actions.test.ts
    ├── items-actions.test.ts
    └── reorder-logic.test.ts
```

**Structure Decision**: Web application — Next.js App Router with feature-grouped components under `src/features/course-management/`. All API client functions live in the `*-actions.ts` files (existing convention). All schemas in `*-schema.ts`. All components in `components/`.

## Complexity Tracking

*No constitution violations to justify — gates pass with no exceptions.*

---

## Phase 0: Research

This phase resolves unknowns and establishes design decisions before writing code. Findings are consolidated in `research.md`.

### Unknowns from Technical Context

1. **No updated_at / no version field** — What happens on concurrent edits? The reorder endpoint sends a full `{id, order}[]` array. If two teachers reorder simultaneously, the second write overwrites the first. Since there's no version check, the UI uses an optimistic update pattern and rolls back on error (409 Conflict or 5xx). The toast notifies the teacher to refresh if their edit was lost.

2. **Reorder payload is fractional order** — The `ReorderRequest.items[]` uses `order: number` (not integer). The backend accepts fractional values (e.g., 1.5 between 1 and 2). The UI treats this as opaque — it always sends the rendered order as integers (1, 2, 3...). The API may recalculate fractions internally; the frontend does not need to.

3. **Route for lesson/item detail** — The user asked: "A single lesson/item detail surface (panel or route — you decide and justify)". The spec also mentions cross-chapter lesson moves as an open question. **Decision**: Use a **panel/drawer** (not a route) for lesson/item detail. Justification: (a) The spec says lessons expand inline — detail should feel like a lightweight overlay on the current page, not a navigation event; (b) mobile teachers benefit from keeping their place in the chapter while inspecting an item; (c) a route would require preserving scroll state across navigations, which is more complex than a local panel. Cross-chapter lesson moves are exposed via a "Move to Chapter" action in the ⋯ menu (option B from the spec).

4. **Item processing states** — The API provides processing state implicitly: `bunny_stream_id` = null means video is not yet uploaded; `document_path` = null means no document yet. The frontend infers states:
   - `uploading` — tracked locally during upload
   - `processing` — inferred after video upload completes but before Bunny finishes transcoding (if the API has a status field, surface it; otherwise show "processing" for a grace period)
   - `ready` — `bunny_stream_id` or `document_path` is non-null
   - `failed` — on upload error, shown via toast + item-level error indicator

### Related Design Assets

- `design/course_tree_editor_redesign.html` — Full tree view showing chapters → lessons → items with indentation guide lines. Reference for the course-level page in flat mode and the inline lesson/item tree.
- `design/hybrid_chapter_page.html` — Chapter page showing lesson cards with bordered containers, inline items with colored type tiles and status chips. Reference for the dedicated chapter page.

**Key visual patterns from both mockups**:
- Depth via indentation + thin `border-inline-start` guide lines on the left, NOT nested boxes
- Only the lesson card gets a border (`border-radius: 12px`, `overflow:hidden`); items are flat rows inside
- At rest, each row shows: grip icon (lowest opacity for items, medium for lessons, full for chapters), chevron (down = expanded, left = collapsed in RTL), title, count badge, ⋯ menu at the end
- Trash/edit never appear inline — they live inside the ⋯ `DropdownMenu`
- Chevron = expand/collapse only; grip = reorder only — never two icons doing the same job
- Items have a colored square tile (22×22px, `border-radius: 6px`) with a white icon, followed by title text, then a status chip on the right
- Status chips: "جاهز" in green, "بيتحول" (processing) in amber with loader, question counts in neutral
- Breadcrumb navigation at the top of the chapter page

---

## Phase 1: Design & Contracts

### 1. Component Inventory

All components map to specific shadcn/ui or @base-ui-react primitives:

| UI Element | shadcn / Base UI Component | Notes |
|-----------|---------------------------|-------|
| Chapter row on course page | `Card` (borderless, `bg-surface-raised`) | Click navigates to chapter page |
| Lesson card on chapter page | `Card` (`border`, `bg-surface-2`) | Only element with border per mockup |
| Lesson→Item expand | `Collapsible` from `@base-ui/react` | Used for lesson→item expansion only |
| ⋯ per-row actions | `DropdownMenu` | Destructive actions live here, never inline |
| Reorder (drag) | `@dnd-kit/sortable` with `verticalListSortingStrategy` | Scoped WITHIN each level — chapters among chapters, lessons among lessons, items among items |
| Item type tile | Bespoke `div` with `border-radius: 6px` | 22×22px colored square with white icon. Justified: shadcn has no "icon tile" primitive; this is a 3-line component that would be over-abstracted as a full component |
| Status chip | `Badge` from shadcn/ui | Variant mapping: success=green, warning=amber, neutral=default |
| Breadcrumb | `Breadcrumb` from shadcn/ui | Course → Chapter. Back button on mobile. |
| Navigation cue (return) | `Button variant="ghost"` + `ArrowRight` icon | RTL-aware direction |
| Empty state | Bespoke centered message with `Button` | One per level (no chapters, no lessons, no items) |
| Loading state | `Skeleton` from shadcn/ui | Per level: chapter list skeleton, lesson list skeleton, item list skeleton |
| Error state | Inline error message + `Button` to retry | Per level, same pattern as current codebase |
| Create dialog | `Dialog` from shadcn/ui | Modal with title input; inline "add" button triggers it |
| Edit dialog | `Dialog` from shadcn/ui | Pre-filled title; rename happens here |
| Delete confirmation | `Dialog` from shadcn/ui | With caution about nested content |
| Edit chapter button | `Button variant="outline"` with pencil icon | Only on chapter page header (per mockup) |

### 2. Zod Schemas

The existing schemas in `chapters-schema.ts`, `lessons-schema.ts`, and `items-schema.ts` already define `ChapterOut`, `LessonOut`, `ItemOut` matching the OpenAPI spec. The following additions are needed:

**`chapters-schema.ts`** — Add `ReorderRequest` (shared generic):

```typescript
export const reorderRequestSchema = z.object({
  items: z.array(z.object({
    id: z.number().int(),
    order: z.number(),
  })),
});
export type ReorderRequest = z.infer<typeof reorderRequestSchema>;
```

*Already partially defined as `reorderItemSchema` in chapters-schema.ts, but `ReorderRequest` needs the wrapper `{ items: [...] }` object per OpenAPI.*

**TDD boundary**: The `reorderItemSchema` (or its parent `ReorderRequest`) tests must verify:
- Valid: `{ items: [{id: 1, order: 1.5}] }` — fractional order accepted
- Invalid: `{ items: [] }` — empty array rejected (reorder requires at least 2 items)
- Invalid: `{ items: [{id: "abc", order: 1}] }` — id must be integer
- Invalid: `{ items: [{id: 1}] }` — missing order

### 3. API Client Functions and Error Mapping

**Pattern**: Each `*-actions.ts` file exports async functions that call the API via `apiFetch` from `@/lib/api/client`. Each returns `{ success: true, data: T } | { success: false, error: ApiError }`.

**New/updated functions needed**:

```typescript
// chapters-actions.ts
export async function listChapters(courseId: number): Promise<Result<ChapterOut[]>>
// GET /api/v1/courses/{courseId}/chapters

export async function reorderChapters(courseId: number, items: ReorderItem[]): Promise<Result<ChapterOut[]>>
// PUT /api/v1/courses/{courseId}/chapters/reorder
// Body: { items: [{ id, order }] }

// lessons-actions.ts
export async function listLessons(courseId: number, chapterId?: number): Promise<Result<LessonOut[]>>
// GET /api/v1/courses/{courseId}/lessons?chapter_id={chapterId}
// When chapterId is undefined (flat mode), fetches all lessons without chapter filter

export async function reorderLessons(courseId: number, items: ReorderItem[], chapterId?: number): Promise<Result<LessonOut[]>>
// PUT /api/v1/courses/{courseId}/lessons/reorder

// items-actions.ts
export async function reorderItems(courseId: number, lessonId: number, items: ReorderItem[]): Promise<Result<ItemOut[]>>
// PUT /api/v1/courses/{courseId}/lessons/{lessonId}/items/reorder
```

**Error mapping**:

| HTTP Status | Error type | UI Handling |
|------------|-----------|-------------|
| 401 | Unauthorized | Redirect to sign-in |
| 403 | Forbidden | Show "Access denied" toast |
| 404 | Not Found | Show "Not found" state with refresh button |
| 409 | Conflict | Show "Course was modified" toast with refresh action; rollback optimistic update |
| 422 | Validation | Show validation error message (should not occur if zod catches it client-side) |
| 5xx | Server Error | Show "Service temporarily unavailable" toast; rollback optimistic update |

**Concurrent edit risk**: Since there's no `updated_at` or version on these entities, the UI uses optimistic updates for reorder:
1. On drag end → immediately reorder the local list
2. Send request to server
3. If server responds with error (409 or 5xx) → rollback to the previous order + show toast
4. No explicit conflict resolution — teacher must redo the operation

### 4. RTL Specifics

All layouts use logical CSS properties. The mockups are Arabic-first (RTL).

**Icons requiring `rtl:rotate-180`**:
- `ChevronLeft` / `ChevronRight` — chevron direction reverses in RTL. Down = expanded. In RTL, `ChevronLeft` (pointing right in LTR) is the collapsed state; `ChevronDown` is expanded.
- `ArrowRight` / `ArrowLeft` — used for back navigation. In RTL, back arrow points left (`ArrowLeft`), not right.
- `GripVertical` — does NOT need rotation (neutral orientation).

**Layout rules**:
- Grip handle at row **start** (right side in RTL)
- ⋯ menu at row **end** (left side in RTL)
- Guide lines on the **inline-start** side (right side in RTL) — using `border-inline-start`
- Indentation uses `margin-inline-start` (padding on right in RTL)
- Item type tiles maintain their color — no rotation needed
- Chevron direction: `rtl:rotate-180` applied to `ChevronDown` maps to "down" icon that rotates to correct visual direction in RTL

### 5. State Inventory

Every async region at every level must handle:

| State | Chapter List (course page) | Lesson List (chapter page) | Item List (inside lesson) |
|-------|---------------------------|---------------------------|---------------------------|
| **Loading** | `Skeleton` rows (3-4) | `Skeleton` rows (4-5) | `Skeleton` rows (2-3) |
| **Empty** | "No chapters yet" + "New Chapter" button | "No lessons yet" + "New Lesson" button | "No items yet" + "Add Item" button |
| **Error** | Error message + "Retry" button | Error message + "Retry" button | Error message inline |
| **Populated** | Chapter rows (each clickable) | Lesson cards (each expandable) | Item rows |

**Item processing states** (surfaced on item row + bubbled to lesson):

| State | Item Row Indicator | Lesson Badge (bubbled) |
|-------|-------------------|----------------------|
| `uploading` | Spinner overlay on tile + "Uploading..." text | Processing chip badge |
| `processing` | Amber status chip with loader icon | Processing chip badge |
| `ready` | Green "جاهز" chip | — (no badge, lesson is clean) |
| `failed` | Red "فشل" chip on item; toast on error | Warning badge |
| `empty` (no file) | — (no chip, item has no content yet) | — |

### 6. Cache Strategy (SWR / next cache)

The app uses `fetch` with `cache: "no-store"` (no Next.js Data Cache for dynamic data). The client-side cache is managed via `revalidateTag` on mutations and a simple SWR pattern.

**Tag naming**: Each resource gets a unique tag per instance:

| Tag Pattern | Mutations that invalidate |
|------------|--------------------------|
| `chapters-{courseId}` | Create, reorder, delete, rename chapter |
| `lessons-{courseId}-{chapterId}` | Create, reorder, delete, rename lesson; create/delete item (affects lesson count) |
| `items-{courseId}-{lessonId}` | Create, reorder, delete, rename item |
| `course-{courseId}` | Only when `use_chapters` changes (infrequent, handled by page refresh) |

**Revalidation rule**: `revalidateTag()` fires ONLY on mutations we trigger (not on initial page load or navigation). The pattern:
1. On mutation → call API → if success → `revalidateTag()` + update local state
2. On navigation back to a previously visited page → client cache serves data (or refetches if stale)
3. No automatic polling — mutations are the only trigger for revalidation

### 7. Route Design

| Route | Mode | Content |
|-------|------|---------|
| `courses/[courseId]` | `use_chapters=true` | Chapter list (each row clickable → chapter page) |
| `courses/[courseId]` | `use_chapters=false` | Lesson list directly (lessons expand inline to items) |
| `courses/[courseId]/chapters/[chapterId]` | Both (only reachable in chaptered mode) | Chapter page: lesson list with inline item expansion |
| Detail panel (not route) | Both | Lightweight slide-over panel for item detail/edit |

**Justification for panel (not route)**: The spec requires preserving scroll position and expanded state when navigating back. A route change would destroy component state. A panel/drawer (`Sheet` from shadcn/ui) overlays on the current page, preserving all context. This is especially important on mobile where navigation is the primary interaction model.

### 8. Flat Mode + Chaptered Mode: Shared Components

The same lesson and item components serve both modes. The branching happens at the **orchestrator level** (`course-content-editor.tsx`):

```typescript
if (use_chapters) {
  // Render ChapterList (each chapter navigable)
} else {
  // Render LessonList directly (no chapter wrapper)
}
```

**Shared components**:
- `LessonCard` — identical in both modes (expandable, shows items inline, has ⋯ menu)
- `ItemCard` — identical in both modes (type tile, title, status chip)
- `ItemList` — identical in both modes (DnD, create button)
- `UploadDialog` — identical in both modes

**Different components**:
- Course-level page: chapter list (chaptered) vs lesson list (flat) — orchestrated by the parent
- `ChapterCard` — only in chaptered mode (row on course page)
- `ChapterList` — only in chaptered mode
- Chapter page route — only in chaptered mode

### 9. Design Asset References

- `design/course_tree_editor_redesign.html` — Full course-level tree mockup. Establishes: chapter rows at top level, lesson rows indented with guide line, item rows further indented, colored type tiles, status chips, plus buttons at each level.
- `design/hybrid_chapter_page.html` — Chapter page mockup. Establishes: breadcrumb nav, chapter header with edit button, lesson cards with border, lesson expansion showing items, processing state badges, "إضافة عنصر" and "درس جديد" buttons.

Design decisions derived from mockups (no invented visual detail):
- Only lesson cards get a `border` — chapters/items are rows without borders
- Depth via `border-inline-start` guide line + `margin-inline-start` indentation
- At rest rows: grip → chevron → title → count → ⋯ menu
- ⋯ menu (`DropdownMenu`) contains: Edit, Delete, Move to Chapter (for lessons)
- Item tiles: 22×22px with 6px radius, colored background, white icon
- Status chips: green "جاهز", amber "بيتحول" with loader, neutral count text

### 10. Open Question: Cross-chapter Lesson Moves

**Decision**: Option B — menu action with chapter picker, recorded in spec as the recommendation. The plan uses a "Move to Chapter" action inside the lesson's ⋯ `DropdownMenu`, which opens a `Dialog` with a select/list of available chapters. This keeps the interaction within the chapter page and does not require a same-screen drag gesture across levels.
