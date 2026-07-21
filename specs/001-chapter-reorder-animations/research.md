# Research: Chapter Reorder with Animations

## Unknowns Resolved

### 1. Drag-and-Drop Library

**Decision**: Use `@dnd-kit/core` + `@dnd-kit/sortable`

**Rationale**:
- Industry-standard React DnD library with first-class sortable list support
- Built-in accessibility (keyboard sorting via `KeyboardSensor`)
- Smooth reorder animations via `DragOverlay` and `SortableContext` (CSS transform-based, runs at 60fps)
- `@base-ui/react` has no DnD primitives
- `@dnd-kit` has better accessibility than native HTML5 DnD

**Alternatives considered**:
- Native HTML5 Drag and Drop: poor accessibility, no built-in animations, inconsistent browser behavior
- `react-beautiful-dnd`: unmaintained since 2022

### 2. Animation Approach

**Decision**: CSS transitions via Tailwind (`transition-all duration-300 ease-out`) combined with `@dnd-kit`'s built-in `DragOverlay` and layout animations

**Rationale**:
- `@dnd-kit/sortable` handles item shift animations via CSS transforms automatically
- `DragOverlay` provides the floating "ghost" element that follows the cursor
- Tailwind's `transition-all duration-300` classes handle enter/exit transitions
- `tw-animate-css` is available for any additional fade/slide animations if needed
- No need for `framer-motion` — `@dnd-kit`'s animations are sufficient and more lightweight

### 3. Reorder Action Pattern

**Decision**: Follow existing `ActionResult<T>` pattern from `chapters-actions.ts`

**Rationale**:
- Consistency with existing `createChapter`, `updateChapter`, `deleteChapter`
- Same error handling (Unauthorized → redirectToSignIn, other → return error)
- Same logging pattern (`logger.action`, `logger.actionDone`, `logger.actionError`)
- API endpoint already defined: `PUT /api/v1/courses/{courseId}/chapters/reorder`
- Accepts `ReorderRequest { items: ReorderItem[] }`, returns `ChapterOut[]`

### 4. Import Pattern for ReorderItemSchema

**Decision**: Move `reorderItemSchema` from `lessons-schema.ts` to a shared schema file (`chapters-schema.ts` or a new shared module). Both chapters and lessons need it.

**Rationale**: Avoid circular dependencies and keep the schema co-located with its primary consumer. Since this feature is about chapters, define it in `chapters-schema.ts`. Update `lessons-schema.ts` to re-export from there.

### 5. Optimistic UI Pattern

**Decision**: Use React 19 `useOptimistic` hook for instant UI updates with automatic rollback on error

**Rationale**:
- Current pattern waits for server response (no optimism)
- Spec FR-05 requires optimistic UI with rollback
- `useOptimistic` is available in React 19 (bundled with Next.js 16) and handles rollback automatically
- If `useOptimistic` proves problematic, fall back to manual state + `try/catch` rollback

### 6. Toast Notifications

**Decision**: Use existing `sonner` toast library (already configured)

**Rationale**:
- Already installed (version 2.0.7)
- Already configured with `<Toaster />` in root layout
- Custom theme-aware wrapper in `@/components/ui/sonner`
- Usage: `toast.success("Chapters reordered")` / `toast.error("Reorder failed")`

## Dependencies to Add

| Package | Version | Purpose |
|---------|---------|---------|
| `@dnd-kit/core` | ^6.x | Core drag-and-drop primitives |
| `@dnd-kit/sortable` | ^6.x | Sortable list preset (handles item shifting) |
| `@dnd-kit/utilities` | ^6.x | Utility functions (CSS transform, array move) |
