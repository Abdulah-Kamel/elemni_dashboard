# Dashboard Compliance Redesign — Vercel Web Interface Guidelines

## Goal

Apply Vercel Web Interface Guidelines compliance to the 4 main dashboard pages while keeping Scheherazade New font and existing color palette unchanged. This is a polish/accessibility pass, not a visual overhaul.

## Scope

**Pages:** Dashboard home, Courses list, Course detail, Profile
**Approach:** Compliance-first — fix accessibility, focus states, typography, performance on existing layouts
**Keep unchanged:** Font (Scheherazade New), color palette (navy indigo, zinc neutrals), design tokens, component library

## Global Compliance Fixes (all pages)

### Accessibility
- All icon-only buttons get `aria-label` (theme toggle, help, notifications bell)
- All form inputs get associated `<label>` elements
- Interactive elements get keyboard handlers: Enter/Space to activate buttons, Escape to close modals/dropdowns, Arrow keys for tabs/navigation
- Decorative icons get `aria-hidden="true"`
- Async updates (toasts, validation) get `aria-live="polite"`
- Replace any `<div onClick>` with `<button>` or `<a>`
- Use semantic HTML (`<button>`, `<a>`, `<label>`, `<table>`) before ARIA
- Headings hierarchical `<h1>`–`<h6>`

### Focus States
- Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to all interactive elements
- Never `outline-none` without focus replacement
- Use `:focus-visible` over `:focus`
- Sticky topbar must not cover focused elements (add `scroll-margin-top`)

### Typography
- Replace `...` with `…` (ellipsis character)
- Replace straight quotes `"` with curly `""`
- Non-breaking spaces: `10 MB`, keyboard shortcuts
- Loading states end with `…`: "Loading…", "Saving…"
- `font-variant-numeric: tabular-nums` on number columns
- `text-wrap: balance` on headings

### Content Handling
- Text containers: `truncate` or `line-clamp-*` for long content
- Flex children get `min-w-0` for truncation
- Empty states handled gracefully (not broken UI)

### Performance
- Large lists (>50 items): virtualize
- Below-fold images: `loading="lazy"`
- `<link rel="preconnect">` for CDN domains
- `<link rel="preload" as="font">` for critical fonts

### Anti-patterns to Fix
- Any `transition: all` → list explicit properties
- Any `<div onClick>` → `<button>` or `<a>`
- Images without dimensions → add `width`/`height`
- Form inputs without labels → add labels
- Icon buttons without `aria-label` → add labels

---

## Page 1: Dashboard Home

**File:** `app/[locale]/(teacher)/dashboard/page.tsx` + `src/features/dashboard/overview.tsx` + `src/features/analytics/teacher-analytics-view.tsx`

### Fixes

1. **Date range filter form**
   - `<label>` on date inputs
   - `autocomplete` attributes on date fields
   - Inline error messages with `aria-live="polite"`
   - Submit button stays enabled until request starts; spinner during request

2. **Analytics cards**
   - Numbers: `font-variant-numeric: tabular-nums`
   - Headings: `text-wrap: balance`

3. **Charts**
   - `aria-label` on chart containers
   - Text summary fallback for screen readers

4. **Empty state**
   - Clean empty state when no data (not broken UI)

5. **Loading state**
   - Skeleton placeholders with `aria-busy="true"`

---

## Page 2: Courses List

**File:** `app/[locale]/(teacher)/courses/page.tsx` + `src/features/course-management/components/course-list.tsx` + `course-card.tsx`

### Fixes

1. **Course cards**
   - `<a>` wrapping card (not `<div onClick>`)
   - Image gets `width`/`height`/`alt`
   - Truncate long titles with `truncate` or `line-clamp-*`
   - Hover state: `hover:` utilities

2. **Create Course button**
   - Proper `<button>` with loading spinner during request

3. **Filters/search**
   - Input with `<label>`
   - `autocomplete` attribute
   - `aria-live` for results count

4. **Pagination**
   - Keyboard accessible
   - `aria-label="Page navigation"`
   - Current page: `aria-current="page"`

5. **Empty state**
   - Clean "No courses yet" with action button

6. **Error state**
   - Inline error with fix suggestion (not just "Something went wrong")

7. **Course count**
   - `font-variant-numeric: tabular-nums`

---

## Page 3: Course Detail

**File:** `app/[locale]/(teacher)/courses/[courseId]/page.tsx` + `src/features/course-management/components/` (chapter-list, lesson-list, item-list, edit-course-dialog, course-card-actions)

### Fixes

1. **Course header**
   - Title: `text-wrap: balance`
   - Badge: proper contrast ratio
   - Metadata: `tabular-nums` on price

2. **Edit Course dialog**
   - Form inputs with `<label>`
   - `autocomplete` on all fields
   - Inline errors with `aria-live="polite"`
   - Submit spinner during request
   - `beforeunload` guard for unsaved changes

3. **Course actions**
   - Publish/unpublish: confirmation modal (destructive action)
   - Loading states with `aria-busy="true"`

4. **Chapter/lesson lists**
   - Keyboard reorder (not just drag)
   - `aria-label` on reorder buttons
   - `aria-roledescription="sortable"` on reorderable items

5. **Item cards**
   - Video/document indicators with `aria-label`
   - Expand/collapse with `aria-expanded`

6. **Navigation**
   - Back link: proper `<a>`
   - Breadcrumb: `aria-label="Breadcrumb"`

7. **Student preview workspace**
   - Preview frame: `title="Student preview"`
   - Keyboard navigation in tabs

---

## Page 4: Profile

**File:** `app/[locale]/(teacher)/profile/page.tsx` + `src/features/student-preview/profile-workspace.tsx`

### Fixes

1. **Profile form**
   - All inputs with `<label>`
   - `autocomplete` on name/email/phone
   - File input with clear label and accepted types

2. **Avatar upload**
   - `accept="image/*"` with visible file type hint
   - Loading state during upload
   - Error state for invalid files

3. **Save button**
   - Disabled when not dirty (already done)
   - Spinner during save
   - `aria-live` for save success/error

4. **Dirty state**
   - `beforeunload` guard when there are unsaved changes

5. **Preview frame**
   - `title="Profile preview"` for screen readers
   - Keyboard navigation between editor and preview

6. **Object URL cleanup**
   - Already handled — verify no memory leaks

---

## What Stays the Same

- Font: Scheherazade New (Arabic/Latin)
- Colors: Navy indigo (#00236f), zinc neutrals, brand palette
- Design tokens: All existing CSS variables in `globals.css`
- Component library: shadcn base-nova components (Button, Card, Dialog, etc.)
- Layout structure: Sidebar + Topbar + MobileBottomNav
- RTL support: Logical properties (ms-, me-, ps-, pe-)
- i18n: next-intl with getTranslations/useTranslations
- Dark mode: Class-based with `.dark` on `<html>`

## Testing

After implementation:
1. Keyboard-only navigation test (Tab through all interactive elements)
2. Screen reader test (VoiceOver/NVDA)
3. axe-core automated accessibility audit
4. Visual regression (screenshots before/after)
5. Run existing test suite (420+ tests)
