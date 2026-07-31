# Tasks: Navy Visual Redesign

**Input**: Design documents from `specs/004-navy-design-apply/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks grouped by user story for independent implementation. Small, ordered tasks suitable for subagent dispatch.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths

---

## Phase 1: Setup — Design Tokens (Shared Foundation)

**Purpose**: Update globals.css with navy color scheme. Every page depends on these tokens.

- [ ] T001 Replace brand tokens in `app/globals.css` — swap indigo values for navy (#00236f, #00164e, #dce1ff)
- [ ] T002 [P] Add dark mode navy tokens to the `.dark` block in `app/globals.css` (lighter navy primaries)
- [ ] T003 [P] Update border token `--border` from `#E4E4E7` to `#c5c5d3` in `app/globals.css`
- [ ] T004 [P] Update sidebar width token `--spacing-sidebar-width` from `240px` to `280px` in `app/globals.css`
- [ ] T005 [P] Update `--color-primary-deep` and `--color-on-primary-tint` tokens in `app/globals.css`
- [ ] T006 Verify build: run `npm run typecheck` and `npm run lint` — must pass

**Checkpoint**: Navy tokens active. Build passes.

---

## Phase 2: Foundational — Navigation Shell (US2)

**Purpose**: Restyle sidebar, topbar, add mobile bottom nav. All other pages depend on this frame.

### Sidebar

- [ ] T007 [P] [US2] Add new nav items (Students, Storage, Settings) to `PRIMARY_NAV` array in `src/features/shell/components/sidebar.tsx` with correct lucide-react icons
- [ ] T008 [P] [US2] Add teacher profile section (avatar + name + role) to bottom of sidebar in `src/features/shell/components/sidebar.tsx`
- [ ] T009 [US2] Apply navy active state styling to sidebar nav items (tinted bg, right border highlight) in `src/features/shell/components/sidebar.tsx`
- [ ] T010 [US2] Update sidebar width to 280px and adjust layout in `src/features/shell/components/sidebar.tsx`

### Topbar

- [ ] T011 [P] [US2] Add glass effect background (`bg-surface/90 backdrop-blur-md`) to topbar in `src/features/shell/components/topbar.tsx`
- [ ] T012 [P] [US2] Add Create Course button to topbar in `src/features/shell/components/topbar.tsx`
- [ ] T013 [P] [US2] Create NotificationDropdown component in `src/features/shell/components/notification-dropdown.tsx`
- [ ] T014 [US2] Wire NotificationDropdown into topbar with unread badge in `src/features/shell/components/topbar.tsx`

### Mobile Bottom Nav

- [ ] T015 [P] [US2] Create MobileBottomNav component in `src/features/shell/components/mobile-bottom-nav.tsx` with all 5 tabs
- [ ] T016 [US2] Integrate MobileBottomNav into teacher layout at `app/[locale]/(teacher)/layout.tsx`

### Layout Integration

- [ ] T017 [US2] Update teacher layout `app/[locale]/(teacher)/layout.tsx` to pass required props to restyled sidebar and topbar
- [ ] T018 Verify build: `npm run typecheck && npm run lint` — must pass

**Checkpoint**: Sidebar shows 5 nav items with navy active states, topbar has glass + buttons + notifications, mobile shows bottom nav. TypeScript/lint clean.

---

## Phase 3: US1 — Overview Page Restyle (Priority: P1)

**Goal**: Restyle the dashboard overview with navy cards, Chart.js chart, video status card, and activity table.

- [ ] T019 [P] [US1] Restyle stat cards in `src/features/dashboard/components/overview.tsx`: white rounded-2xl cards, navy values, icon in tinted circle, trend badge
- [ ] T020 [P] [US1] Restyle chart section in `src/features/dashboard/components/overview.tsx`: navy card layout, weekly/monthly toggle, use existing Chart.js integration
- [ ] T021 [P] [US1] Create VideoProcessingCard component in `src/features/dashboard/components/video-processing-card.tsx` with status badges
- [ ] T022 [US1] Integrate VideoProcessingCard into the overview layout in `src/features/dashboard/components/overview.tsx`
- [ ] T023 [P] [US1] Restyle activity table in `src/features/dashboard/components/overview.tsx`: rounded-2xl container, tinted header, hover rows, progress bars
- [ ] T024 Verify overview renders: `npm run dev` and navigate to `/ar/dashboard` — cards, chart, video status, and table display correctly

**Independent Test**: Load `/ar/dashboard` — 4 stat cards with navy values, Chart.js chart, video card, and activity table all render with new styling.

---

## Phase 4: US3 — Courses Page Restyle (Priority: P1)

**Goal**: Restyle course cards, create dialog, and course detail with navy design.

### Course List

- [ ] T025 [P] [US3] Restyle course cards in `src/features/course-management/components/course-list.tsx`: cover image, navy title, student count + price, status badge, action buttons
- [ ] T026 [P] [US3] Add dashed "Add Course" CTA card to end of course grid in `src/features/course-management/components/course-list.tsx`

### Create Course Dialog

- [ ] T027 [US3] Restyle CreateCourseDialog in `src/features/course-management/components/create-course-dialog.tsx`: rounded-2xl modal, navy header, rounded-xl inputs, navy submit button

### Course Detail

- [ ] T028 [P] [US3] Restyle course detail header (back link, title, badge) in `app/[locale]/(teacher)/courses/[courseId]/page.tsx`
- [ ] T029 [US3] Update chapter/lesson list styling in `src/features/course-management/components/chapter-list.tsx` and `lesson-list.tsx` with new card/token styles

- [ ] T030 Verify courses render: navigate to `/ar/courses` and `/ar/courses/{id}` — cards, dialog, detail page all use navy styling

**Independent Test**: Load `/ar/courses` — course cards with cover images, navy titles, status badges render. Create dialog opens with navy styling.

---

## Phase 5: US4 — Students Page (Priority: P2)

**Goal**: Build out the students page from placeholder with stat cards, search/filter, data table, pagination, and modals.

- [ ] T031 [P] [US4] Create students page route at `app/[locale]/(teacher)/students/page.tsx` with session check
- [ ] T032 [P] [US4] Create StudentStatsBar component in `src/features/students/components/student-stats-bar.tsx` (3 stat cards)
- [ ] T033 [P] [US4] Create StudentFilters component in `src/features/students/components/student-filters.tsx` (search + status pills)
- [ ] T034 [P] [US4] Create StudentTable component in `src/features/students/components/student-table.tsx` with progress bars, status badges, action buttons
- [ ] T035 [P] [US4] Create StudentPagination component in `src/features/students/components/student-pagination.tsx`
- [ ] T036 [P] [US4] Create GrantAccessModal component in `src/features/students/components/grant-access-modal.tsx`
- [ ] T037 [US4] Wire all student components together in the students page with local state for filters and pagination
- [ ] T038 Verify students page: navigate to `/ar/students` — stat cards, search, table with student rows, pagination all render

**Independent Test**: Load `/ar/students` — stat cards show counts, search filters the table, status pills work, pagination controls visible.

---

## Phase 6: US5 — Storage Page (NEW, Priority: P3)

**Goal**: Create the storage page with donut gauge, bandwidth chart, and course breakdown table.

- [ ] T039 [P] [US5] Create storage page route at `app/[locale]/(teacher)/storage/page.tsx`
- [ ] T040 [P] [US5] Create StorageGauge component in `src/features/storage/components/storage-gauge.tsx` (SVG donut)
- [ ] T041 [P] [US5] Create BandwidthChart component in `src/features/storage/components/bandwidth-chart.tsx` (Chart.js line chart with 7/30 day toggle)
- [ ] T042 [P] [US5] Create StorageTable component in `src/features/storage/components/storage-table.tsx` (course breakdown with search)
- [ ] T043 [P] [US5] Create UploadFAB component in `src/features/storage/components/upload-fab.tsx` (floating upload button)
- [ ] T044 [US5] Wire all storage components together on the storage page
- [ ] T045 Verify storage page: navigate to `/ar/storage` — donut chart, bandwidth chart, course table all render

**Independent Test**: Load `/ar/storage` — donut gauge shows percentage, bandwidth chart renders with toggle, course table shows data.

---

## Phase 7: US6 — Settings Page (NEW, Priority: P3)

**Goal**: Create the settings page with security toggles, branding inputs, and live player preview.

- [ ] T046 [P] [US6] Create settings page route at `app/[locale]/(teacher)/settings/page.tsx`
- [ ] T047 [P] [US6] Create SecurityCard component in `src/features/settings/components/security-card.tsx` (watermark toggle, PDF toggle, domain whitelist)
- [ ] T048 [P] [US6] Create BrandingCard component in `src/features/settings/components/branding-card.tsx` (color picker, logo upload)
- [ ] T049 [P] [US6] Create PlayerPreview component in `src/features/settings/components/player-preview.tsx` (video mockup with watermark overlay)
- [ ] T050 [US6] Wire all settings components together with save handler and toast notification
- [ ] T051 Verify settings page: navigate to `/ar/settings` — toggles work, color picker updates preview, save shows toast

**Independent Test**: Load `/ar/settings` — toggle watermark on/off changes preview, change color updates preview, save shows success toast.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across all pages.

- [ ] T052 [P] Run full validation: `npm run typecheck && npm run lint && npm test`
- [ ] T053 [P] Verify dark mode on all 5 pages (Overview, Courses, Students, Storage, Settings) — navy adapts correctly
- [ ] T054 [P] Verify mobile bottom nav works on all 5 pages at viewport below `md` breakpoint
- [ ] T055 [P] Quick manual pass: compare each page layout against the exported design reference in `elemni-redsing/src/components/views/`
- [ ] T056 Verify all icons render correctly (no missing lucide-react icon imports)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup/Tokens)**: No dependencies — start immediately
- **Phase 2 (Foundational/Shell)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3+ (User Stories)**: All depend on Phase 2 completion
  - Phases 3, 4, 5, 6, 7 can proceed in parallel if staffed (different feature domains)
  - Or sequentially in priority order (US1 → US3 → US4 → US5 → US6)
- **Phase 8 (Polish)**: Depends on all desired phases being complete

### User Story Dependencies

- **US1 (Overview)**: Depends on Phase 1 + 2 — No dependencies on other stories
- **US3 (Courses)**: Depends on Phase 1 + 2 — No dependencies on other stories
- **US4 (Students)**: Depends on Phase 1 + 2 — No dependencies on other stories
- **US5 (Storage)**: Depends on Phase 1 + 2 — New page, no dependencies
- **US6 (Settings)**: Depends on Phase 1 + 2 — New page, no dependencies

### Within Each Phase

- Tasks within a phase marked [P] can run in parallel
- Non-[P] tasks depend on preceding tasks within the same phase

---

## Parallel Execution Examples (Subagent Dispatch)

```bash
# Phase 1 — all token changes are independent:
Subagent 1: T002 Add dark mode navy tokens in app/globals.css
Subagent 2: T003 Update border token in app/globals.css
Subagent 3: T004 Update sidebar width token in app/globals.css
Subagent 4: T005 Update primary-deep/on-primary-tint tokens in app/globals.css

# Phase 2 — sidebar, topbar, bottom nav are independent:
Subagent 1: T007-T010 Sidebar restyle in src/features/shell/components/sidebar.tsx
Subagent 2: T011-T014 Topbar restyle in src/features/shell/components/topbar.tsx
Subagent 3: T015-T016 MobileBottomNav in src/features/shell/components/mobile-bottom-nav.tsx

# Phase 3 — stat cards, chart, video card, table are independent:
Subagent 1: T019 Restyle stat cards in overview.tsx
Subagent 2: T020 Restyle chart section in overview.tsx
Subagent 3: T021-T022 Create and integrate VideoProcessingCard

# Phases 5, 6, 7 — different feature domains, fully independent:
Subagent 1: T031-T038 Students page (Phase 5)
Subagent 2: T039-T045 Storage page (Phase 6)
Subagent 3: T046-T051 Settings page (Phase 7)
```

---

## Implementation Strategy

### MVP Scope (Phase 1 + 2 + 3 only)

1. Complete Phase 1: Tokens — navy scheme active
2. Complete Phase 2: Shell — sidebar, topbar, bottom nav work
3. Complete Phase 3: US1 — overview page restyled
4. **STOP and VALIDATE**: Check /ar/dashboard renders correctly
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready (navy shell)
2. Add Phase 3 (US1) → Overview restyled → Demo
3. Add Phase 4 (US3) → Courses restyled → Demo
4. Add Phase 5 (US4) → Students built → Demo
5. Add Phase 6 (US5) → Storage built → Demo
6. Add Phase 7 (US6) → Settings built → Demo

---

## Notes

- [P] tasks = different files, no dependencies — suitable for subagent dispatch
- Each user story is independently testable — can be verified without other stories complete
- All existing data fetching, server actions, queries, and i18n remain untouched
- Run `npm run typecheck && npm run lint` after each phase before moving to next
