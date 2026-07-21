# Implementation Plan: Chapter Reorder with Animations

## Technical Context

**Feature**: Drag-and-drop chapter reorder with smooth animations, move up/down buttons, optimistic UI, and accessibility support.

**Current State**: 
- `ChapterList` renders chapters from `initialChapters` with edit/delete actions, no reorder capability
- `ChapterCard` has expand/collapse, edit, delete — no drag handle, no move buttons, no order display
- `chapters-schema.ts` has `ChapterOut`, `ChapterCreate`, `ChapterUpdate` — no reorder schema
- `chapters-actions.ts` has `createChapter`, `updateChapter`, `deleteChapter` — no `reorderChapters`
- `chapters-queries.ts` only has `listChapters`
- `endpoints.ts` defines `courses.chapters.reorder(courseId)` → `PUT /api/v1/courses/{courseId}/chapters/reorder`
- API accepts `ReorderRequest { items: ReorderItem[] }` where `ReorderItem { id: number, order: number }`
- API returns `ChapterOut[]` on success
- No drag-and-drop library in package.json; only `tw-animate-css` for Tailwind animations
- Existing `lessons-schema.ts` already defines `reorderItemSchema` that can be reused

**Key unknowns**:
1. Which drag-and-drop pattern to use (native HTML5 DnD vs library like @dnd-kit/pragmatic-drag-and-drop)
2. Animation approach (CSS transitions via Tailwind vs lightweight animation library)
3. How to display chapter order numbers in the UI

## Constitution Check

No `.specify/memory/constitution.md` exists. No constitutional constraints apply.

## Gate Evaluation

| Gate | Status | Notes |
|------|--------|-------|
| Spec exists and approved | ✅ PASS | `spec.md` written, quality checklist all pass |
| No NEEDS CLARIFICATION markers | ✅ PASS | 0 markers in spec |
| Dependencies available | ⚠️ Needs verification | Reorder endpoint exists in API; reorderItemSchema in lessons-schema is reusable |
| Technical feasibility confirmed | ✅ PASS | Drag-and-drop + animation is standard web UI pattern |

Gate evaluation: **ALL PASS** — proceed to Phase 0.

---

## Phase 0: Research

**Goal**: Resolve technical unknowns and document decisions.

### Unknowns to Research

1. **Drag-and-drop library choice**: Pick between native HTML5 DnD vs @dnd-kit vs pragmatic-drag-and-drop
2. **Animation approach**: CSS transitions (via Tailwind/tw-animate-css) vs framer-motion
3. **Reorder action pattern**: Follow existing `createChapter`/`updateChapter` `ActionResult<T>` pattern or use a simpler approach
4. **Import pattern**: Should `reorderItemSchema` be moved to chapters-schema or imported from lessons-schema?

### Deliverable

`research.md` with all decisions documented.

---

## Phase 1: Design

### 1. Data Model (`data-model.md`)

Define the client-side state model for reorder operations based on the API contract.

### 2. Contracts (`/contracts/`)

Define:
- The reorder server action interface
- Component prop contracts for drag-and-drop state

### 3. Quickstart (`quickstart.md`)

Validation guide for testing the feature end-to-end.

---

## Phase 2: Implementation (future)

Implementation details in `tasks.md`.

## Phase 3: Verification (future)

Test plans and acceptance criteria.
