# Teacher Side Animations — Design Spec

**Date:** 2026-08-27  
**Status:** Approved  
**Scope:** Add entrance animations to all teacher-side pages, matching admin-side patterns.

## Motion Thesis

- **Mode:** Operate — motion serves feedback, state, and continuity.
- **Focal moment:** None — supporting transitions, not authored sequences.
- **Continuity:** `animate-slide-up` on every page header and section entrance.
- **Feedback:** `card-hover` lift on interactive cards, `useAutoAnimate` on dynamic lists.
- **Budget:** CSS-only (transforms + opacity), zero new JS animation libraries.

## Existing Infrastructure (reusable, zero new deps)

| Utility | Effect | Source |
|---------|--------|--------|
| `animate-slide-up` | Fade + slide up 0.35s | `globals.css:278` |
| `animate-stagger-1..8` | Progressive delays 50–400ms | `globals.css:286` |
| `card-hover` | Lift + shadow on hover 0.2s | `globals.css:328` |
| `animate-fade-in` | Fade 0.25s | `globals.css:282` |
| `useAutoAnimate({ duration: 180 })` | Smooth list reorder | `@formkit/auto-animate` |
| `prefers-reduced-motion` | Disables spatial, keeps opacity | `globals.css:318` |

## Patterns

### 1. Page headers
```tsx
<header className="flex animate-slide-up ...">
```

### 2. Card grids (Dashboard, Students, Storage, Settings)
```tsx
const stagger = ["animate-stagger-1","animate-stagger-2","animate-stagger-3","animate-stagger-4"]
<Card className={`card-hover animate-slide-up ${stagger[index]} ...`}>
```

### 3. Course list grid
```tsx
<Card className={`card-hover animate-slide-up ${stagger[index % stagger.length]} ...`}>
```

### 4. Student table
```tsx
const [rowsRef] = useAutoAnimate({ duration: 180 })
<TableBody ref={rowsRef}>
```

### 5. Profile/Settings sections
```tsx
<section className="animate-slide-up animate-stagger-1 ...">
<section className="animate-slide-up animate-stagger-2 ...">
```

## Pages to Animate

| Teacher Page | Route | Components | Animations |
|-------------|-------|------------|------------|
| Dashboard | `/dashboard` | `TeacherAnalyticsView` | `animate-slide-up` + stagger on stat cards; `card-hover` |
| Courses | `/courses` | `CourseList`, `CourseCard` | `animate-slide-up` on header; stagger + `card-hover` on cards |
| Course Detail | `/courses/[id]` | Chapter/lesson sections | `animate-slide-up` on header sections |
| Students | `/students` | `StudentStatsBar`, `StudentTable` | `animate-slide-up` + stagger on stats; `useAutoAnimate` on table |
| Profile | `/profile` | `TeacherProfilePreview` | `animate-slide-up` + stagger on sections |
| Settings | `/settings` | `SecurityCard`, `BrandingCard`, `PlayerPreview` | `animate-slide-up` + stagger + `card-hover` |
| Storage | `/storage` | `StorageDashboard` | `animate-slide-up` + stagger + `card-hover` on stat cards |

## Files to Edit

1. `src/features/dashboard/components/teacher-analytics-view.tsx`
2. `src/features/course-management/components/course-list.tsx`
3. `src/features/course-management/components/course-card.tsx`
4. `src/features/students/components/student-roster.tsx`
5. `src/features/profile/components/teacher-profile-preview.tsx`
6. `src/features/settings/components/settings-dashboard.tsx`
7. `src/features/storage/components/storage-dashboard.tsx`
8. Course detail page or component (header sections)

## Accessibility

- All animations use `prefers-reduced-motion: reduce` (already in `globals.css:318`).
- No layout-property animation — only transforms + opacity.
- No `will-change` needed (short CSS animations, GPU-composited).

## Scope Exclusions

- No page-level route transitions (not in admin either).
- No new dependencies.
- `lessons/` and `billing/` are stub pages — skip.
- Dialog animations already work via shared shadcn/ui primitives.
