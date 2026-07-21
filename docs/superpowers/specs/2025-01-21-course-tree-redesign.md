# Course Content Tree Redesign

## Date: 2025-01-21

## Overview

Redesign the Chapter → Lesson → Item card hierarchy to match a unified tree/accordion structure inspired by the reference image. The current design uses individual bordered cards for each level. The new design uses a seamless nested tree with subtle background variations, icon-based type badges, and cleaner information density.

## Current vs New

### Current Design
- **ChapterCard**: Individual bordered card (`rounded-lg border bg-card`) with drag handle, expand chevron, title, lesson count badge, edit/delete buttons
- **LessonCard**: Individual bordered card nested inside chapter body with title, description, collapsible items section with left border accent
- **ItemCard**: Individual bordered card row with order number, text-based type badge pill, title, hover-revealed actions

### New Design (from reference image)
- **Unified tree structure**: No individual card borders. Subtle background variations distinguish hierarchy levels.
- **Chapter row**: Clean header bar with chapter number + title on right (RTL), expand/collapse + drag handle + actions on left. Stats shown inline (lessons count, items count). Subtle elevated background.
- **Lesson row**: Nested directly under chapter. Number badge, title, inline status indicators ("جاهز" badges), action buttons. No separate card container.
- **Item row**: Nested under lessons. Color-coded **icon badges** (circular/square colored backgrounds with white icons) instead of text pill badges. Title next to badge. Clean row without border.
- **Add buttons**: Minimal text-only buttons for adding new chapters/lessons/items.

## Design Tokens & Styling

### Hierarchy Backgrounds
- **Page background**: `bg-page` (deepest dark)
- **Chapter row**: `bg-surface` or `bg-surface-raised` (subtle lift from page)
- **Lesson container**: Same as chapter row or very slightly muted (`bg-surface` with `bg-page` as alternating)
- **Item rows**: Transparent/inherit, separated by subtle dividers (`border-b border-border/50` or `border-border`)

### Icon Badges (replacing text pills)
- **Video**: `bg-brand-indigo` background with white icon
- **Document/PDF**: `bg-brand-amber` background with white icon  
- **Exam**: `bg-brand-rose` or distinct purple background with white icon
- **Text**: `bg-surface-strong` or muted background with white icon
- Badge shape: `rounded-md` or `rounded-lg` square (approx 28x28px), icon size ~14px, white color

### Typography
- Chapter title: `text-base font-semibold` (slightly heavier than current `font-medium`)
- Lesson title: `text-sm font-medium`
- Item title: `text-sm font-normal` (lighter, items are leaf nodes)
- Stats/counters: `text-xs text-muted-foreground`
- Status badges: `text-xs font-medium` inside small rounded pills

### Spacing & Layout
- Chapter row padding: `px-4 py-3`
- Lesson row padding: `px-4 py-2.5` (indented via parent padding or left border line)
- Item row padding: `px-4 py-2`
- Nested indentation: Not via margin, but via visual containment within the expanded chapter area. Items under lessons get additional subtle indentation or vertical line.

### Actions & Interactions
- Edit/Delete/Reorder: Icon buttons `size-7` with `variant="ghost"`, visible on hover (`group-hover:opacity-100`) OR always visible on mobile
- Drag handle: `cursor-grab`, subtle `text-muted-foreground`
- Expand/Collapse: Chevron icons with `rtl:rotate-180`
- Hover states: Subtle background highlight (`hover:bg-surface-muted/30`)

## Component Changes

### ChapterCard
- Remove outer `rounded-lg border bg-card` container
- Header becomes the primary row: `flex items-center justify-between` with `bg-surface` or `bg-surface-raised`
- Keep expand/collapse behavior but chevron is on the left side (after drag handle)
- Title format: `{order}. {title}` on the right
- Stats inline: show lessons count and items count if available
- Expanded body is a seamless container (no top border) holding the lesson list
- Remove `onToggle` from the whole row area if it conflicts with action buttons - keep toggle on chevron + title area only

### LessonCard
- Remove outer `rounded-lg border bg-card p-3` card
- Becomes a row inside the chapter tree
- Title + number on right, actions on left
- Items are shown inline (not in a separate collapsible section) OR keep collapsible but style it as a seamless nested list
- If keeping collapsible: use a subtle "Items" toggle text with chevron, expanded items show with left vertical line (`border-l-2 border-border`) and indented padding
- Status/Info area: Add a slot for badges like "جاهز" (ready), item counts, etc.

### ItemCard
- Remove outer `rounded-lg border bg-card` 
- Becomes a clean row: `flex items-center gap-3 py-2`
- Replace text badge pill with icon badge: `<span class="inline-flex items-center justify-center size-7 rounded-md bg-brand-indigo text-white">{icon}</span>`
- Remove order number display (or make it much subtler)
- Title: `text-sm`
- Actions: Keep hover-revealed or always-visible pattern
- Upload buttons: Keep but style as minimal ghost buttons

### LessonList / ItemList
- Remove gap between cards (`gap-2` currently) - items should be contiguous or separated by subtle dividers
- Consider using a flat list with `divide-y` or individual `border-b` on items

## RTL Considerations
- All layouts must work in RTL (Arabic)
- Flex directions reverse automatically, but ensure `me/ms` (margin-end/margin-start) or logical properties are used
- Chevron rotation: `rtl:rotate-180`

## Accessibility
- Keep keyboard navigation for expand/collapse (Enter/Space)
- Maintain aria-labels on action buttons
- Keep dialog patterns for edit/delete
- Ensure hover-only actions have focus-visible equivalents

## Files to Modify
1. `src/features/course-management/components/chapter-card.tsx`
2. `src/features/course-management/components/lesson-card.tsx`
3. `src/features/course-management/components/item-card.tsx`
4. `src/features/course-management/components/lesson-list.tsx` (likely - to adjust container styling)
5. `src/features/course-management/components/item-list.tsx` (likely - to adjust container styling)
6. `app/globals.css` (if new tokens needed)

## Out of Scope
- Adding checkboxes (shown in image) - UI only, no backend functionality
- Adding "hidden course" badge - this is course-level, not chapter/lesson/item level
- Adding "جاهز" status badges - unless the data exists, we can add UI placeholders or use existing data
- Changing the overall page layout (course header, stats bar) - focused on the tree components only

## Risks / Notes
- Removing individual card borders may reduce visual scannability. Mitigation: use subtle background variations and dividers.
- The reference image shows lessons and items in a very flat way. We need to ensure the nesting hierarchy is still visually clear without borders.
- If the `ReorderButtons` component is used inside the row, ensure it doesn't break the layout.
