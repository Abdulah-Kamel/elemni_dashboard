# Implementation Plan: Navy Visual Redesign

**Branch**: `004-navy-design-apply` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-navy-design-apply/spec.md`

## Summary

Apply the exported AI Studio visual design (navy color scheme, card layouts, glass effects, responsive sidebar) to the existing Next.js dashboard while keeping all data fetching, server actions, queries, and i18n logic intact. Covers 5 views (Overview, Courses, Students, Storage, Settings), sidebar/topbar reskin, dark mode adaptation, and mobile bottom nav.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.4, Next.js 16.2.6

**Primary Dependencies**: Tailwind CSS v4, lucide-react, shadcn/ui, chart.js (react-chartjs-2), next-intl, next-themes, class-variance-authority

**Storage**: N/A (visual-only changes; no new data persistence)

**Testing**: vitest (unit), playwright (e2e), `npm run typecheck` (TypeScript), `npm run lint` (ESLint)

**Target Platform**: Web browser — Chrome, Firefox, Safari, Edge (desktop + mobile)

**Project Type**: Web application (Next.js App Router, frontend-only)

**Performance Goals**: No visual regressions; animation/interaction FPS > 30; CSS-only transitions preferred

**Constraints**: Zero changes to `src/features/*/actions.ts`, `src/features/*/queries.ts`, `src/features/course-management/`, `src/i18n/` translation files. Only visual layer (JSX + Tailwind + globals.css) and new pages may be modified or created.

**Scale/Scope**: 5 page views + shell (sidebar, topbar, bottom nav); 2 new pages (Storage, Settings); existing pages restyled

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file (`.specify/memory/constitution.md`) contains only a template with no defined gates or principles. No violations identified. Gate passes.

## Project Structure

### Documentation (this feature)

```text
specs/004-navy-design-apply/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty — no external interfaces)
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

```text
app/                                    # Next.js App Router pages
├── globals.css                         # Design tokens (navy scheme update)
├── [locale]/
│   └── (teacher)/
│       ├── layout.tsx                  # Teacher layout (sidebar + topbar reskin)
│       ├── dashboard/page.tsx          # Overview (existing, restyled)
│       ├── courses/page.tsx            # Courses list (existing, restyled)
│       ├── courses/[courseId]/page.tsx # Course detail (existing, restyled)
│       ├── students/page.tsx           # Students (placeholder → built)
│       ├── storage/page.tsx            # Storage (NEW)
│       └── settings/page.tsx           # Settings (NEW)

src/
├── features/
│   ├── dashboard/components/
│   │   └── overview.tsx                # Visual restyle (keep data flow)
│   ├── course-management/components/
│   │   ├── course-list.tsx             # Visual restyle
│   │   └── create-course-dialog.tsx     # Visual restyle
│   ├── shell/components/
│   │   ├── sidebar.tsx                 # Full restyle + new nav items
│   │   ├── topbar.tsx                  # Full restyle + glass effect
│   │   ├── mobile-bottom-nav.tsx       # NEW component
│   │   ├── notification-dropdown.tsx   # NEW component
│   │   └── student-table.tsx           # NEW component
│   ├── storage/
│   │   └── components/
│   │       ├── storage-overview.tsx    # NEW (donut + bandwidth chart)
│   │       └── storage-table.tsx       # NEW (course breakdown)
│   └── settings/
│       └── components/
│           ├── security-card.tsx       # NEW
│           ├── branding-card.tsx       # NEW
│           └── player-preview.tsx      # NEW
└── components/ui/                      # Existing shadcn primitives (unchanged)
```

**Structure Decision**: The existing Next.js App Router + features/ structure is preserved. Visual changes are scoped to globals.css tokens and the JSX layer of feature components. New components follow the existing pattern: feature-domain folders under `src/features/`.

## Complexity Tracking

No constitution violations. No complexity tracking needed.
