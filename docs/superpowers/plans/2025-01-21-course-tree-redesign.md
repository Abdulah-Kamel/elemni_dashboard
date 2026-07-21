# Course Content Tree Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ChapterCard, LessonCard, ItemCard, and their list containers to use a unified tree structure with icon badges, subtle backgrounds, and no individual card borders.

**Architecture:** Flatten the nested card hierarchy into contiguous rows with subtle background variations. Replace text pill badges with colored square icon badges. Keep all existing functionality (drag-drop, dialogs, CRUD) intact.

**Tech Stack:** React, Next.js, Tailwind CSS v4, shadcn/ui, dnd-kit, next-intl

## Global Constraints
- Maintain RTL support (Arabic locale)
- Keep all existing CRUD, reorder, dialog functionality
- Use existing design tokens (`bg-card`, `bg-surface`, `text-muted-foreground`, etc.)
- No backend changes - UI only
- No new dependencies

---

## File Map

| File | Responsibility |
|------|--------------|
| `item-card.tsx` | Leaf node row with icon badge, title, hover actions |
| `lesson-card.tsx` | Mid-level node with title, item list container (no longer an independent card) |
| `chapter-card.tsx` | Top-level row with expand/collapse, stats, action buttons |
| `lesson-list.tsx` | Container with DnD + create button. Contains `SortableLessonCard` inline |
| `item-list.tsx` | Container with DnD + create button. Contains `SortableItemCard` inline |

---

## Task 1: Redesign ItemCard

**Files:**
- Modify: `src/features/course-management/components/item-card.tsx`

**Interfaces:**
- Consumes: Same props (`item`, `courseId`, `lessonId`, `onUpdate`, `onDelete`)
- Produces: Same callbacks, different visual output

- [ ] **Step 1: Replace text badge with icon badge**

Change the `itemType` function return type and styling:

```tsx
function itemType(item: ItemOut): { label: string; icon: React.ReactNode; bg: string } {
  if (item.bunny_stream_id) return { label: "type_video", icon: <Film className="size-3.5" />, bg: "bg-brand-indigo" };
  if (item.document_path) return { label: "type_document", icon: <FileText className="size-3.5" />, bg: "bg-brand-amber" };
  if (item.exam_id) return { label: "type_exam", icon: <ClipboardList className="size-3.5" />, bg: "bg-brand-rose" };
  return { label: "type_text", icon: <File className="size-3.5" />, bg: "bg-surface-strong" };
}
```

- [ ] **Step 2: Remove card border, convert to clean row**

Replace the outer div:

```tsx
// OLD:
<div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-all duration-200 hover:bg-surface-muted/50 group">

// NEW:
<div className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-surface-muted/30 group">
```

- [ ] **Step 3: Replace badge span with icon badge**

Replace the type badge:

```tsx
// OLD:
<span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${type.color}`}>
  {type.icon}
  {t(type.label)}
</span>

// NEW:
<span className={`inline-flex items-center justify-center size-7 rounded-md text-white ${type.bg}`} title={t(type.label)}>
  {type.icon}
</span>
```

- [ ] **Step 4: Remove order number display**

Remove or hide the order number span (the image doesn't show order numbers on items). If keeping for accessibility, make it much subtler:

```tsx
// Option A: Remove completely
// Just delete: <span className="text-xs text-on-surface-subtle w-4 shrink-0 text-center">{item.order}</span>

// Option B: Keep but hide visually (screen readers only)
<span className="sr-only">{item.order}</span>
```

Use **Option A** (remove) for visual match to image.

- [ ] **Step 5: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: No errors in `item-card.tsx`

---

## Task 2: Redesign LessonCard

**Files:**
- Modify: `src/features/course-management/components/lesson-card.tsx`

**Interfaces:**
- Consumes: Same props
- Produces: Same callbacks, different visual output

- [ ] **Step 1: Remove outer card border and padding**

Replace outer div:

```tsx
// OLD:
<div className="rounded-lg border bg-card p-3">

// NEW:
<div className="px-4 py-2.5 transition-colors hover:bg-surface-muted/30">
```

- [ ] **Step 2: Flatten header layout**

Change header from `items-start justify-between` to `items-center justify-between`:

```tsx
<div className="flex items-center justify-between gap-2">
  <div className="min-w-0 flex-1">
    <h4 className="text-sm font-medium">
      <span className="text-muted-foreground me-1">{lesson.order}.</span>
      {lesson.title}
    </h4>
    {lesson.description && (
      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
        {lesson.description}
      </p>
    )}
  </div>
  {/* actions stay the same */}
</div>
```

- [ ] **Step 3: Update items section styling**

Change the items container to be a seamless nested list:

```tsx
// OLD:
<div className="border-t mt-2 pt-2">
  <button ...>
    {itemsExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
    <span>Items</span>
  </button>
  {itemsExpanded && (
    <div className="mt-2 pl-1 border-l-2 border-border ml-1">
      <ItemList ... />
    </div>
  )}
</div>

// NEW:
<div className="mt-1.5">
  <button
    onClick={() => setItemsExpanded((v) => !v)}
    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
  >
    {itemsExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
    <span>{t("items")}</span>
  </button>
  {itemsExpanded && (
    <div className="mt-1.5">
      <ItemList
        initialItems={initialItems}
        courseId={courseId}
        lessonId={lesson.id}
        error={null}
      />
    </div>
  )}
</div>
```

Note: Remove the `border-t mt-2 pt-2` and `border-l-2 border-border ml-1` - the image shows items as flat rows without left border accent.

- [ ] **Step 3b: Add items translation key**

Add `"items": "Items"` to the lessons translations namespace if not already present. Check `messages/ar.json` and `messages/en.json` under the `"lessons"` key.

- [ ] **Step 4: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

---

## Task 3: Redesign SortableLessonCard (in lesson-list.tsx)

**Files:**
- Modify: `src/features/course-management/components/lesson-list.tsx`

**Interfaces:**
- Consumes: Same props
- Produces: Same callbacks

- [ ] **Step 1: Remove inner card border in SortableLessonCard**

Find the inner div with `rounded-lg border bg-card p-3` inside `SortableLessonCard` and change to match `LessonCard`:

```tsx
<div className="px-4 py-2.5 transition-colors hover:bg-surface-muted/30">
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <Button
        size="icon"
        variant="ghost"
        className="size-6 shrink-0 cursor-grab active:cursor-grabbing"
        {...(attributes as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        {...(listeners as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        aria-label={dragHandleLabel}
      >
        <GripVertical className="size-3.5 text-muted-foreground" />
      </Button>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium">
          <span className="text-muted-foreground me-1">{lesson.order}.</span>
          {lesson.title}
        </h4>
        {lesson.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {lesson.description}
          </p>
        )}
      </div>
    </div>
    {/* action buttons stay same */}
  </div>
</div>
```

Note: The drag handle stays. The action buttons (reorder up/down, edit, delete) stay but the container no longer has `rounded-lg border bg-card p-3`.

- [ ] **Step 2: Update DragOverlay style**

Change the drag overlay to match the new row style:

```tsx
// OLD:
<div className="opacity-90 shadow-lg rounded-lg border bg-card p-3">
  <h4 className="text-sm font-medium">{activeLesson.title}</h4>
</div>

// NEW:
<div className="opacity-90 shadow-lg px-4 py-2.5 bg-surface-raised">
  <h4 className="text-sm font-medium">{activeLesson.title}</h4>
</div>
```

- [ ] **Step 3: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

---

## Task 4: Redesign ChapterCard

**Files:**
- Modify: `src/features/course-management/components/chapter-card.tsx`

**Interfaces:**
- Consumes: Same props
- Produces: Same callbacks

- [ ] **Step 1: Change outer container style**

Replace outer div:

```tsx
// OLD:
<div className="rounded-lg border bg-card">

// NEW:
<div className="bg-surface-raised rounded-lg overflow-hidden">
```

This keeps a subtle rounded container for the whole chapter, but removes the heavy border.

- [ ] **Step 2: Update header row styling**

Change header from plain flex to a slightly more prominent bar:

```tsx
<div
  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-surface-muted/20"
  onClick={() => { onToggle?.(); }}
  role="button"
  tabIndex={0}
  aria-label={t("chapter_title")}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle?.();
    }
  }}
>
  {/* content stays same */}
</div>
```

- [ ] **Step 3: Update expanded body styling**

Change the expanded body container:

```tsx
// OLD:
<div className="border-t px-4 py-3">
  <LessonList ... />
</div>

// NEW:
<div className="border-t border-border/50 px-4 py-2">
  <LessonList ... />
</div>
```

Note: Use `border-border/50` for a subtler divider. Reduce padding to `py-2` for tighter density.

- [ ] **Step 4: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

---

## Task 5: Redesign SortableItemCard (in item-list.tsx)

**Files:**
- Modify: `src/features/course-management/components/item-list.tsx`

**Interfaces:**
- Consumes: Same props
- Produces: Same callbacks

- [ ] **Step 1: Update SortableItemCard wrapper styling**

The `SortableItemCard` already doesn't add card borders - it just wraps `ItemCard` with drag handles. After Task 1 changes `ItemCard` to remove its own border, the wrapper should be updated for cleaner spacing:

```tsx
<div ref={setNodeRef} style={style} className="transition-all duration-300 ease-out">
  <div className="flex items-center gap-1 px-2">
    <button ...>...</button>
    <div className="flex flex-col gap-0.5">...</div>
    <div className="flex-1 min-w-0">
      <ItemCard ... />
    </div>
  </div>
</div>
```

Note: Add `px-2` to the drag handle wrapper for alignment. The ItemCard itself will have `px-4 py-2`.

- [ ] **Step 2: Update DragOverlay style**

```tsx
// OLD:
<div className="opacity-90 shadow-lg rounded-lg border bg-card p-3">
  <p className="text-sm font-medium">{activeItem.title}</p>
</div>

// NEW:
<div className="opacity-90 shadow-lg px-4 py-2 bg-surface-raised">
  <p className="text-sm font-medium">{activeItem.title}</p>
</div>
```

- [ ] **Step 3: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

---

## Task 6: Final Verification

**Files:**
- All modified files

- [ ] **Step 1: Type-check entire project**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run dev server and visually inspect**

Run: `npm run dev` (or `pnpm dev` / `yarn dev` - check package.json)
Open the course management page in browser.
Verify:
- Chapters show as rounded containers with subtle background
- Lessons are flat rows without card borders
- Items show colored square icon badges (not text pills)
- Items are flat rows without card borders
- Drag and drop still works
- Edit/delete dialogs still work
- Create buttons still work
- RTL layout looks correct

- [ ] **Step 3: Commit changes**

```bash
git add -A
git commit -m "ui: redesign course content tree with icon badges and flat hierarchy"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Remove individual card borders | Tasks 1, 2, 3, 4, 5 |
| Icon badges instead of text pills | Task 1 |
| Subtle background variations | Tasks 2, 4 |
| Flat tree structure | Tasks 2, 3, 4 |
| Keep all functionality | All tasks (no logic changes) |
| RTL support | Maintained in all tasks (no rtl: classes removed) |

## Placeholder Scan

No TBD, TODO, or vague instructions found. All steps contain exact code changes.

## Type Consistency Check

- `itemType` function signature changes from returning `color` string to `bg` string. This is an internal function only used within ItemCard, so no external interface impact.
- All component props remain identical.
- All callback signatures remain identical.
