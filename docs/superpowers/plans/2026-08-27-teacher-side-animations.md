# Teacher Side Animations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add entrance animations (slide-up, stagger, card-hover) and list animations (auto-animate) to all teacher-side pages, matching the admin-side animation patterns.

**Architecture:** Apply existing CSS animation utilities (`animate-slide-up`, `animate-stagger-*`, `card-hover`) from `globals.css` to teacher-side components. Add `useAutoAnimate` to the student table for smooth list transitions. No new dependencies, no new utility classes — pure class additions.

**Tech Stack:** Tailwind CSS (existing animation utilities), `@formkit/auto-animate` (already installed), React (server + client components).

## Global Constraints

- All animation utilities are defined in `app/globals.css` (lines 278–335). No new CSS needed.
- `prefers-reduced-motion: reduce` is already handled in `globals.css:318` — disables spatial movement, keeps opacity.
- `@formkit/auto-animate` v0.10.0 is already in `package.json`.
- Stagger array pattern: `["animate-stagger-1","animate-stagger-2","animate-stagger-3","animate-stagger-4"]` — index-modulo for grids with >4 items.
- Server components can use CSS animation classes directly (no client boundary needed for CSS-only animations).
- `useAutoAnimate` requires `"use client"` directive.

---

### Task 1: Dashboard — TeacherAnalyticsView

**Files:**
- Modify: `src/features/analytics/components/teacher-analytics-view.tsx:79-140`

**Interfaces:**
- Consumes: `Card` from `@/components/ui/card`, `stats` array (local)
- Produces: Animated dashboard stat cards and header

- [ ] **Step 1: Add `animate-slide-up` to header**

In `teacher-analytics-view.tsx`, change line 81 from:
```tsx
<header className="flex flex-col gap-2">
```
to:
```tsx
<header className="flex animate-slide-up flex-col gap-2">
```

- [ ] **Step 2: Add stagger array and animate stat cards**

After line 77 (closing `]`), add:
```tsx
const stagger = ["animate-stagger-1", "animate-stagger-2", "animate-stagger-3", "animate-stagger-4", "animate-stagger-5"]
```

Change line 124 from:
```tsx
{stats.map(({ label, value, icon: Icon }) => (
```
to:
```tsx
{stats.map(({ label, value, icon: Icon }, index) => (
```

Change line 127 from:
```tsx
className="rounded-2xl border border-border p-md shadow-xs"
```
to:
```tsx
className={`card-hover animate-slide-up ${stagger[index]} rounded-2xl border border-border p-md shadow-xs`}
```

- [ ] **Step 3: Animate the top-courses table card**

Change line 142 from:
```tsx
<Card className="rounded-2xl border border-border shadow-xs">
```
to:
```tsx
<Card className="animate-slide-up animate-stagger-6 rounded-2xl border border-border shadow-xs">
```

- [ ] **Step 4: Animate the date-range filter card**

Change line 90 from:
```tsx
<Card className="rounded-2xl border border-border p-md shadow-xs">
```
to:
```tsx
<Card className="animate-slide-up animate-stagger-1 rounded-2xl border border-border p-md shadow-xs">
```

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No errors related to `teacher-analytics-view`

- [ ] **Step 6: Commit**

```bash
git add src/features/analytics/components/teacher-analytics-view.tsx
git commit -m "feat(teacher): add entrance animations to dashboard analytics view"
```

---

### Task 2: Courses — CourseList and CourseCard

**Files:**
- Modify: `src/features/course-management/components/course-list.tsx:77-136`
- Modify: `src/features/course-management/components/course-card.tsx:42-46`

**Interfaces:**
- Consumes: `CourseCard` from local import, `filteredCourses` array
- Produces: Animated course grid with stagger and card-hover

- [ ] **Step 1: Add `animate-slide-up` to filter/search bar**

In `course-list.tsx`, change line 79 from:
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
```
to:
```tsx
<div className="flex animate-slide-up flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
```

- [ ] **Step 2: Add stagger to course grid**

Change line 124 from:
```tsx
<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
```
to:
```tsx
<div className="grid animate-slide-up gap-5 sm:grid-cols-2 xl:grid-cols-3">
```

- [ ] **Step 3: Add stagger classes to course cards in the grid**

Change lines 125-134 from:
```tsx
{filteredCourses.map((course) => (
  <CourseCard
    key={course.id}
    course={course}
    teacherProfileId={teacherProfileId}
    locale={locale}
    gradeName={gradeNames[course.grade_id]}
    streamName={streamNames[course.stream_id]}
  />
))}
```
to:
```tsx
const stagger = ["animate-stagger-1", "animate-stagger-2", "animate-stagger-3", "animate-stagger-4", "animate-stagger-5", "animate-stagger-6"]
{filteredCourses.map((course, index) => (
  <CourseCard
    key={course.id}
    course={course}
    teacherProfileId={teacherProfileId}
    locale={locale}
    gradeName={gradeNames[course.grade_id]}
    streamName={streamNames[course.stream_id]}
    className={`animate-slide-up ${stagger[index % stagger.length]}`}
  />
))}
```

Note: The `stagger` const should be placed inside the return block before the grid, or extracted outside the component. Placing it as a module-level const is cleanest:
```tsx
const STAGGER = ["animate-stagger-1", "animate-stagger-2", "animate-stagger-3", "animate-stagger-4", "animate-stagger-5", "animate-stagger-6"]
```
Place this after the `FILTERS` const at line 16.

- [ ] **Step 4: Update CourseCard to accept className prop**

In `course-card.tsx`, update the function signature to accept an optional `className`:

Change lines 25-37 from:
```tsx
export function CourseCard({
  course,
  teacherProfileId,
  locale,
  gradeName,
  streamName,
}: {
  course: CourseOut
  teacherProfileId: number
  locale: string
  gradeName?: string
  streamName?: string
}) {
```
to:
```tsx
export function CourseCard({
  course,
  teacherProfileId,
  locale,
  gradeName,
  streamName,
  className,
}: {
  course: CourseOut
  teacherProfileId: number
  locale: string
  gradeName?: string
  streamName?: string
  className?: string
}) {
```

Then update line 45 to merge the className:
```tsx
className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md ${className ?? ""}`}
```

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No errors related to `course-list` or `course-card`

- [ ] **Step 6: Commit**

```bash
git add src/features/course-management/components/course-list.tsx src/features/course-management/components/course-card.tsx
git commit -m "feat(teacher): add entrance animations to course list and cards"
```

---

### Task 3: Students — StudentStatsBar, StudentTable, StudentRoster

**Files:**
- Modify: `src/features/students/components/student-stats-bar.tsx:40-56`
- Modify: `src/features/students/components/student-table.tsx:55-139`
- Modify: `src/features/students/components/student-roster.tsx:152-201`

**Interfaces:**
- Consumes: `StudentStatsBar`, `StudentTable`, `StudentFilters`, `StudentPagination` (existing)
- Produces: Animated stat cards, smooth table list transitions, staggered sections

- [ ] **Step 1: Add animations to StudentStatsBar**

In `student-stats-bar.tsx`, add stagger array and animate cards:

Change line 41 from:
```tsx
<div className="grid grid-cols-1 gap-md sm:grid-cols-3">
```
to:
```tsx
const stagger = ["animate-stagger-1", "animate-stagger-2", "animate-stagger-3"]
return (
<div className="grid grid-cols-1 gap-md sm:grid-cols-3">
```

Wait — this is a component with implicit return. Let me restructure properly.

Change lines 40-56 from:
```tsx
  return (
    <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, iconClassName }) => (
        <div
          key={label}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-xs"
        >
```
to:
```tsx
  const stagger = ["animate-stagger-1", "animate-stagger-2", "animate-stagger-3"]

  return (
    <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, iconClassName }, index) => (
        <div
          key={label}
          className={`card-hover animate-slide-up ${stagger[index]} flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-xs`}
        >
```

- [ ] **Step 2: Add `useAutoAnimate` to StudentTable**

In `student-table.tsx`, add `useAutoAnimate` import and ref:

After line 2 (`import { useLocale, useTranslations } from "next-intl"`), add:
```tsx
import { useRef } from "react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
```

After line 53 (inside `StudentTable` function, after the formatter declarations), add:
```tsx
const [tableBodyRef] = useAutoAnimate({ duration: 180 })
```

Change line 68 from:
```tsx
<TableBody>
```
to:
```tsx
<TableBody ref={tableBodyRef}>
```

- [ ] **Step 3: Animate StudentRoster sections**

In `student-roster.tsx`, add `animate-slide-up` to the stats bar wrapper and filters section:

Change lines 153-159 from:
```tsx
    <div className="flex flex-col gap-xl">
      <StudentStatsBar
        totalStudents={stats.totalStudents}
        completedSubscriptions={stats.completedSubscriptions}
        pendingSubscriptions={stats.pendingSubscriptions}
      />
      <div className="flex flex-col gap-md">
```
to:
```tsx
    <div className="flex flex-col gap-xl">
      <div className="animate-slide-up">
        <StudentStatsBar
          totalStudents={stats.totalStudents}
          completedSubscriptions={stats.completedSubscriptions}
          pendingSubscriptions={stats.pendingSubscriptions}
        />
      </div>
      <div className="flex animate-slide-up animate-stagger-1 flex-col gap-md">
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No errors related to `student-*` components

- [ ] **Step 5: Commit**

```bash
git add src/features/students/components/student-stats-bar.tsx src/features/students/components/student-table.tsx src/features/students/components/student-roster.tsx
git commit -m "feat(teacher): add entrance animations to students page"
```

---

### Task 4: Profile — TeacherProfilePreview

**Files:**
- Modify: `src/features/profile/components/teacher-profile-preview.tsx:53-167`

**Interfaces:**
- Consumes: `TeacherProfile`, `CourseOut[]` (existing props)
- Produces: Animated profile sections with stagger

- [ ] **Step 1: Animate header section**

In `teacher-profile-preview.tsx`, change line 55 from:
```tsx
<header className="flex flex-col gap-md rounded-2xl border border-primary/20 bg-primary-tint/50 p-lg sm:flex-row sm:items-center sm:justify-between">
```
to:
```tsx
<header className="flex animate-slide-up flex-col gap-md rounded-2xl border border-primary/20 bg-primary-tint/50 p-lg sm:flex-row sm:items-center sm:justify-between">
```

- [ ] **Step 2: Animate profile info section**

Change line 79 from:
```tsx
<section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
```
to:
```tsx
<section className="animate-slide-up animate-stagger-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
```

- [ ] **Step 3: Animate stats section**

Change line 126 from:
```tsx
<section className="mx-auto grid max-w-4xl gap-md sm:grid-cols-3" aria-label={t("public_stats")}>
```
to:
```tsx
<section className="animate-slide-up animate-stagger-2 mx-auto grid max-w-4xl gap-md sm:grid-cols-3" aria-label={t("public_stats")}>
```

- [ ] **Step 4: Animate stats cards inside the section**

Change line 182 from:
```tsx
<article className="rounded-2xl border border-border bg-surface p-lg text-center shadow-xs">
```
to:
```tsx
<article className="card-hover rounded-2xl border border-border bg-surface p-lg text-center shadow-xs">
```

- [ ] **Step 5: Animate courses section**

Change line 132 from:
```tsx
<section className="space-y-md">
```
to:
```tsx
<section className="animate-slide-up animate-stagger-3 space-y-md">
```

- [ ] **Step 6: Animate course cards grid**

Change line 153 from:
```tsx
<div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
```
to:
```tsx
<div className="grid animate-slide-up gap-md md:grid-cols-2 xl:grid-cols-3">
```

- [ ] **Step 7: Add `card-hover` to PreviewCourseCard**

Change line 205 from:
```tsx
<article className="flex min-h-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
```
to:
```tsx
<article className="card-hover flex min-h-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
```

- [ ] **Step 8: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No errors related to `teacher-profile-preview`

- [ ] **Step 9: Commit**

```bash
git add src/features/profile/components/teacher-profile-preview.tsx
git commit -m "feat(teacher): add entrance animations to profile page"
```

---

### Task 5: Settings — SettingsDashboard

**Files:**
- Modify: `src/features/settings/components/settings-dashboard.tsx:37-72`

**Interfaces:**
- Consumes: `SecurityCard`, `BrandingCard`, `PlayerPreview` (existing)
- Produces: Animated settings sections with stagger

- [ ] **Step 1: Animate header**

In `settings-dashboard.tsx`, change line 39 from:
```tsx
<header className="flex items-center justify-between">
```
to:
```tsx
<header className="flex animate-slide-up items-center justify-between">
```

- [ ] **Step 2: Animate the card grid wrapper**

Change line 49 from:
```tsx
<div className="grid grid-cols-1 gap-lg lg:grid-cols-12">
```
to:
```tsx
<div className="grid animate-slide-up animate-stagger-1 grid-cols-1 gap-lg lg:grid-cols-12">
```

- [ ] **Step 3: Add `card-hover` to SecurityCard, BrandingCard, PlayerPreview**

These are separate component files. Read them first, then add `card-hover` class to their root elements.

Read each file and add `card-hover` to the outermost Card/container element:

- `src/features/settings/components/security-card.tsx` — add `card-hover` to root element
- `src/features/settings/components/branding-card.tsx` — add `card-hover` to root element
- `src/features/settings/components/player-preview.tsx` — add `card-hover` to root element

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No errors related to settings components

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/components/settings-dashboard.tsx src/features/settings/components/security-card.tsx src/features/settings/components/branding-card.tsx src/features/settings/components/player-preview.tsx
git commit -m "feat(teacher): add entrance animations to settings page"
```

---

### Task 6: Storage — StorageDashboard

**Files:**
- Modify: `src/features/storage/components/storage-dashboard.tsx:74-199`

**Interfaces:**
- Consumes: `StorageTable`, `Card` (existing)
- Produces: Animated storage stat cards and sections

- [ ] **Step 1: Animate header**

In `storage-dashboard.tsx`, change line 76 from:
```tsx
<header>
```
to:
```tsx
<header className="animate-slide-up">
```

- [ ] **Step 2: Add stagger to stat cards section**

Change line 85 from:
```tsx
<section className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
```
to:
```tsx
<section className="grid animate-slide-up animate-stagger-1 gap-md sm:grid-cols-2 xl:grid-cols-5">
```

- [ ] **Step 3: Add `card-hover` to stat cards**

Change line 89 from:
```tsx
className="rounded-2xl border border-border p-5 shadow-xs"
```
to:
```tsx
className="card-hover rounded-2xl border border-border p-5 shadow-xs"
```

- [ ] **Step 4: Animate content-mix and largest-course sections**

Change line 104 from:
```tsx
<section className="grid gap-md lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
```
to:
```tsx
<section className="grid animate-slide-up animate-stagger-2 gap-md lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
```

- [ ] **Step 5: Add `card-hover` to the two section cards**

Change line 105 from:
```tsx
<Card className="rounded-2xl border border-border p-5 shadow-xs">
```
to:
```tsx
<Card className="card-hover rounded-2xl border border-border p-5 shadow-xs">
```

Change line 146 from:
```tsx
<Card className="rounded-2xl border border-border p-5 shadow-xs">
```
to:
```tsx
<Card className="card-hover rounded-2xl border border-border p-5 shadow-xs">
```

- [ ] **Step 6: Animate MetricTile**

Change line 205 from:
```tsx
<div className="rounded-2xl border border-border bg-surface-muted p-4">
```
to:
```tsx
<div className="card-hover rounded-2xl border border-border bg-surface-muted p-4">
```

- [ ] **Step 7: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No errors related to `storage-dashboard`

- [ ] **Step 8: Commit**

```bash
git add src/features/storage/components/storage-dashboard.tsx
git commit -m "feat(teacher): add entrance animations to storage page"
```

---

### Task 7: Course Detail — CourseEditor Header

**Files:**
- Modify: `app/[locale]/(teacher)/courses/[courseId]/page.tsx:126-193`

**Interfaces:**
- Consumes: `ChapterList`, `LessonList`, `EditCourseDialog`, `CourseCardActions` (existing)
- Produces: Animated course detail header and curriculum section

- [ ] **Step 1: Animate the back link**

In `page.tsx`, change line 129 from:
```tsx
<Link
  href={`/${locale}/courses`}
  className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
>
```
to:
```tsx
<Link
  href={`/${locale}/courses`}
  className="animate-slide-up inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
>
```

- [ ] **Step 2: Animate the course info section**

Change line 141 from:
```tsx
<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
```
to:
```tsx
<div className="flex animate-slide-up animate-stagger-1 flex-col justify-between gap-4 sm:flex-row sm:items-start">
```

- [ ] **Step 3: Animate the curriculum section**

Change line 195 from:
```tsx
<section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
```
to:
```tsx
<section className="animate-slide-up animate-stagger-2 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No errors related to course detail page

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/\(teacher\)/courses/\[courseId\]/page.tsx
git commit -m "feat(teacher): add entrance animations to course detail page"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Lint check**

Run: `npm run lint`
Expected: No new lint errors

- [ ] **Step 3: Visual smoke test notes**

Verify these pages load and show entrance animations:
- `/dashboard` — stat cards slide up with stagger
- `/courses` — course cards slide up with stagger
- `/courses/[id]` — header and curriculum section slide up
- `/students` — stats slide up, table rows animate on filter
- `/profile` — sections slide up with stagger
- `/settings` — cards slide up with stagger
- `/storage` — stat cards slide up with stagger

- [ ] **Step 4: Reduced motion check**

In browser DevTools: Rendering → Emulate `prefers-reduced-motion: reduce`
Verify: All spatial movement stops, content remains visible

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(teacher): animation polish from visual verification"
```
