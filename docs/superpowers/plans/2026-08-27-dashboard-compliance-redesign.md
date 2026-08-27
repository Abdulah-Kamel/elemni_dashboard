# Dashboard Compliance Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Vercel Web Interface Guidelines compliance to 4 dashboard pages — fix accessibility, focus states, typography, performance on existing layouts.

**Architecture:** Compliance-first pass on existing components. No structural changes, no new components. Each task touches 1-3 files and produces a self-contained, testable deliverable.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS v4, shadcn base-nova, next-intl, lucide-react

## Global Constraints

- All work in `elemni_dashboard` worktree `.worktrees/feat/dashboard-student-previews`
- No edits to `elemni_front_end` or `elemni_public_ui`
- Keep Scheherazade New font and existing color palette unchanged
- Keep existing design tokens in `globals.css` unchanged
- Follow existing code patterns (server components, `useState`, `next-intl`)
- RTL-first with logical properties (ms-, me-, ps-, pe-)
- Run `npx vitest run`, `npx tsc --noEmit`, `npx eslint src/features/` after each task

---

### Task 1: Sidebar + Topbar Focus States

**Files:**
- Modify: `src/features/shell/components/sidebar.tsx` (add focus-visible to nav links)
- Modify: `src/features/shell/components/topbar.tsx` (verify focus states)

**Interfaces:**
- Consumes: existing sidebar/topbar components
- Produces: accessible navigation shell with visible focus rings

- [ ] **Step 1: Read sidebar.tsx**

Read `src/features/shell/components/sidebar.tsx` to find the nav `<Link>` elements.

- [ ] **Step 2: Add focus-visible to sidebar nav links**

On each nav `<Link>` (around lines 87-103), add:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
```

- [ ] **Step 3: Read topbar.tsx**

Read `src/features/shell/components/topbar.tsx` to verify focus states are already handled by Button component.

- [ ] **Step 4: Run verification**

Run: `npx tsc --noEmit && npx eslint src/features/shell/components/`
Expected: Clean

- [ ] **Step 5: Commit**

```bash
git add src/features/shell/components/sidebar.tsx src/features/shell/components/topbar.tsx
git commit -m "fix: add focus-visible ring styles to sidebar nav links"
```

---

### Task 2: Dashboard Analytics Accessibility

**Files:**
- Modify: `src/features/analytics/components/teacher-analytics-view.tsx` (add aria-hidden, focus-visible)

**Interfaces:**
- Consumes: existing analytics view component
- Produces: accessible analytics cards and course links

- [ ] **Step 1: Read the file**

Read `src/features/analytics/components/teacher-analytics-view.tsx`.

- [ ] **Step 2: Add aria-hidden to decorative icons**

Find all `<Icon className="size-5" />` and `<Users className="size-4" />` inside stat cards and table rows. Add `aria-hidden="true"` to each.

- [ ] **Step 3: Add focus-visible to course links**

Find the course title `<Link>` elements. Add:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
```

- [ ] **Step 4: Add tabular-nums to stat numbers**

Find the number/stat elements. Add `tabular-nums` class or `font-variant-numeric: tabular-nums` style.

- [ ] **Step 5: Run verification**

Run: `npx tsc --noEmit && npx eslint src/features/analytics/`
Expected: Clean

- [ ] **Step 6: Commit**

```bash
git add src/features/analytics/components/teacher-analytics-view.tsx
git commit -m "fix: add aria-hidden, focus-visible, tabular-nums to analytics view"
```

---

### Task 3: Course Card Focus States

**Files:**
- Modify: `src/features/course-management/components/course-card.tsx` (add focus-visible to Manage link)

**Interfaces:**
- Consumes: existing course card component
- Produces: course card with accessible focus states on all links

- [ ] **Step 1: Read the file**

Read `src/features/course-management/components/course-card.tsx`.

- [ ] **Step 2: Add focus-visible to Manage link**

Find the "Manage" `<Link>` (around lines 121-129). Add:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
```

- [ ] **Step 3: Run verification**

Run: `npx tsc --noEmit && npx eslint src/features/course-management/components/course-card.tsx`
Expected: Clean

- [ ] **Step 4: Commit**

```bash
git add src/features/course-management/components/course-card.tsx
git commit -m "fix: add focus-visible ring to course card Manage link"
```

---

### Task 4: Chapter List + Edit Course Dialog Accessibility

**Files:**
- Modify: `src/features/course-management/components/chapter-list.tsx` (add aria-label, aria-hidden)
- Modify: `src/features/course-management/components/edit-course-dialog.tsx` (add beforeunload guard)

**Interfaces:**
- Consumes: existing chapter list and edit dialog components
- Produces: accessible chapter list and form with unsaved-changes protection

- [ ] **Step 1: Read the files**

Read `src/features/course-management/components/chapter-list.tsx` and `src/features/course-management/components/edit-course-dialog.tsx`.

- [ ] **Step 2: Add aria-label to create chapter input**

Find the `<Input>` in the create chapter dialog (around line 300). Add `aria-label={t("chapter_title")}` or similar translation key.

- [ ] **Step 3: Add aria-hidden to decorative icons**

Find `<BookOpen>`, `<Plus>`, and `<Loader2>` icons inside buttons/overlays. Add `aria-hidden="true"` to each.

- [ ] **Step 4: Add focus-visible to Create button**

Find the "Create chapter" ghost button. Add:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
```

- [ ] **Step 5: Add beforeunload guard to edit course dialog**

In `edit-course-dialog.tsx`, add a `useEffect` that listens for `beforeunload` when the form is dirty (formValues !== initialValues):
```tsx
useEffect(() => {
  if (!isDirty) return;
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [isDirty]);
```

- [ ] **Step 6: Run verification**

Run: `npx tsc --noEmit && npx eslint src/features/course-management/components/chapter-list.tsx src/features/course-management/components/edit-course-dialog.tsx`
Expected: Clean

- [ ] **Step 7: Commit**

```bash
git add src/features/course-management/components/chapter-list.tsx src/features/course-management/components/edit-course-dialog.tsx
git commit -m "fix: add aria-label, aria-hidden, focus-visible, beforeunload guard"
```

---

### Task 5: Profile Workspace Form Accessibility

**Files:**
- Modify: `src/features/student-preview/profile-workspace.tsx` (add htmlFor/id, focus styles)

**Interfaces:**
- Consumes: existing profile workspace component
- Produces: accessible profile form with labeled inputs and focus states

- [ ] **Step 1: Read the file**

Read `src/features/student-preview/profile-workspace.tsx`.

- [ ] **Step 2: Add id to inputs and htmlFor to labels**

For each form field, add matching `id` and `htmlFor`:
- Name input: `id="profile-name"`, label `htmlFor="profile-name"`
- Bio textarea: `id="profile-bio"`, label `htmlFor="profile-bio"`
- Location input: `id="profile-location"`, label `htmlFor="profile-location"`
- Avatar file input: `id="profile-avatar"`, label `htmlFor="profile-avatar"`

- [ ] **Step 3: Add focus styles to inputs**

Add to each `<input>` and `<textarea>`:
```
focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
```

- [ ] **Step 4: Add focus-visible to save button**

Add to the save `<button>`:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
```

- [ ] **Step 5: Run verification**

Run: `npx vitest run src/features/student-preview/__tests__/profile-workspace.test.tsx && npx tsc --noEmit`
Expected: Tests pass, typecheck clean

- [ ] **Step 6: Commit**

```bash
git add src/features/student-preview/profile-workspace.tsx
git commit -m "fix: add htmlFor/id associations and focus styles to profile form"
```

---

### Task 6: Typography Fixes (all pages)

**Files:**
- Grep for `...` (three dots) across `src/features/`
- Grep for straight quotes `"` in user-facing strings
- Add `tabular-nums` to any number displays

**Interfaces:**
- Consumes: existing feature components
- Produces: consistent typography across all pages

- [ ] **Step 1: Find all `...` occurrences**

Run: `grep -rn '\.\.\.' src/features/ --include="*.tsx" --include="*.ts" | grep -v 'node_modules' | grep -v '\.\.\.' | head -20`

Actually, search for the literal string `...` (three dots) that should be `…`:
Run: `grep -rn '\.\.\.' src/features/ --include="*.tsx" | grep -v 'import' | grep -v '//' | grep -v '\.ts' | head -20`

- [ ] **Step 2: Replace `...` with `…`**

For each occurrence of `...` in user-facing strings (loading states, error messages, etc.), replace with `…`.

- [ ] **Step 3: Add tabular-nums to number displays**

Search for price displays, counts, and statistics. Add `tabular-nums` class.

- [ ] **Step 4: Run verification**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All tests pass, typecheck clean

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: replace ... with … and add tabular-nums to number displays"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Run lint**

Run: `npx eslint src/features/`
Expected: 0 errors

- [ ] **Step 4: Manual keyboard navigation test**

Tab through sidebar, topbar, dashboard, courses, course detail, profile. Verify:
- All interactive elements receive visible focus ring
- Focus order is logical
- No focus traps
- Modals/dropdowns can be closed with Escape
