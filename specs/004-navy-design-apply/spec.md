# Feature Specification: Navy Visual Redesign

**Feature Branch**: `004-navy-design-apply`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Apply the visual design from the exported AI Studio app (elemni-redsing/) onto the existing Next.js dashboard — navy color scheme, card layouts, glass effects — while keeping all existing data fetching, server actions, queries, and i18n logic intact."

## User Scenarios & Testing

### User Story 1 — Teacher sees redesigned dashboard overview (Priority: P1)

A teacher logs in and sees the dashboard overview with navy-themed stat cards, SVG-style chart section, video processing status card, and activity table — all populated with real data from the existing backend.

**Why this priority**: The overview is the first page every teacher sees; it sets the visual tone for the entire app.

**Independent Test**: Can be tested by loading the dashboard page and verifying that (a) stat cards show navy headers and icons in tinted circles, (b) the chart area renders with Chart.js data matching the existing performance queries, (c) video processing card renders status badges correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated teacher session, **When** the dashboard page loads, **Then** four stat cards are displayed with navy (#00236f) numeric values, icon in tinted circle, trend badge, and correct data from the existing `getOverviewData` query.

2. **Given** the dashboard is rendering, **When** the chart section renders, **Then** it uses Chart.js (via the existing `chart-loader`) inside the new navy-styled card layout with weekly/monthly toggle buttons.

3. **Given** a teacher views the dashboard, **When** the video processing card is rendered, **Then** it shows recent video items from the overview data with appropriate status badges (ready/processing/uploaded).

4. **Given** the activity table is rendered, **When** rows are displayed, **Then** they follow the new table styling (rounded-2xl container, tinted header, hover rows, progress bars).

---

### User Story 2 — Teacher navigates redesigned sidebar and topbar (Priority: P1)

A teacher uses the left sidebar and top header bar to navigate the app. All five nav items (Overview, Courses, Students, Storage, Settings) are visible with navy active states, and the topbar includes a Create Course button and notification dropdown.

**Why this priority**: Navigation and chrome are the persistent frame around all pages; they must be right before individual page work can be evaluated.

**Independent Test**: Can be tested by (a) verifying the sidebar shows 5 nav items with correct icons, (b) clicking each item navigates to the correct route, (c) the topbar renders with glass effect, Create Course button, and notification bell.

**Acceptance Scenarios**:

1. **Given** the teacher layout renders, **When** the sidebar is visible on desktop, **Then** it shows 5 navigation items (Overview, Courses, Students, Storage, Settings) with lucide-react icons mapped from the exported design's intent.

2. **Given** a nav item is active, **When** its route matches the current path, **Then** it appears with navy background tint (`bg-[#dbe1ff]`) and a right border highlight in navy.

3. **Given** the teacher layout renders, **When** the topbar is visible, **Then** it shows: glass background (`bg-surface/90 backdrop-blur-md`), Create Course button (navy primary), notification bell with unread dot, locale toggle, theme toggle, and user avatar.

4. **Given** the viewport is mobile-sized, **When** the layout renders, **Then** a bottom navigation bar appears with all 5 tabs replacing the sidebar.

---

### User Story 3 — Teacher manages courses with redesigned visuals (Priority: P1)

A teacher visits the courses page and sees course cards with cover images, navy titles, status badges, and action buttons. The existing course management features (create, edit, publish, unpublish) remain fully functional.

**Why this priority**: Courses is a core feature with high daily usage.

**Independent Test**: Can be tested by loading the courses page and verifying the new card layout renders with existing course data.

**Acceptance Scenarios**:

1. **Given** the courses page loads, **When** course cards render, **Then** each card shows a cover image, navy title, student count with icon, price, status badge, and action buttons — matching the exported design's card layout.

2. **Given** the course list has items, **When** a course is in published state, **Then** the status badge shows as green (`bg-emerald-600`). When in draft state, the badge shows as gray.

3. **Given** a teacher clicks Create Course, **When** the dialog opens, **Then** it matches the exported design's modal styling (rounded-2xl, navy header, rounded-xl inputs).

4. **Given** a teacher navigates to a course detail page, **When** chapters/lessons load, **Then** the existing component structure is preserved but restyled with the new visual tokens.

---

### User Story 4 — Teacher views and manages students (Priority: P2)

A teacher visits the students page and sees a fully built page with stat cards, search/filter bar, data table with progress bars and status badges, pagination, and action buttons for blocking and granting access.

**Why this priority**: The current students page is a placeholder; building it out with the new visuals adds significant functionality.

**Independent Test**: Can be tested by loading the students page and verifying the table renders, filters work, and action buttons are present.

**Acceptance Scenarios**:

1. **Given** the students page loads, **When** the page renders, **Then** three stat cards show (total students, active students, pending access) with navy values.

2. **Given** the search bar is used, **When** a teacher types a query, **Then** the student table filters in real-time by name, email, or course.

3. **Given** a status filter is selected, **When** a teacher clicks a filter pill (all/active/blocked/completed), **Then** the table filters to matching students.

4. **Given** a teacher clicks the block/unblock button on a student row, **When** confirmed, **Then** the student's status toggles and the UI updates.

5. **Given** a teacher clicks the grant access button, **When** the modal opens and a type is selected, **Then** the access type is applied to the student.

---

### User Story 5 — Teacher views storage analytics (Priority: P3)

A teacher visits the storage page and sees a donut gauge for S3 usage, a bandwidth line chart, and a per-course storage breakdown table with search.

**Why this priority**: Storage is a new page that provides visibility into resource consumption.

**Independent Test**: Can be tested by loading the storage page with sample course data and verifying all three sections render.

**Acceptance Scenarios**:

1. **Given** the storage page loads, **When** the page renders, **Then** a donut gauge shows S3 storage usage percentage with an SVG circle.

2. **Given** the storage page loads, **When** the bandwidth chart renders, **Then** it uses Chart.js with a line chart showing daily bandwidth consumption, with a 7-day/30-day toggle.

3. **Given** course data exists, **When** the storage breakdown table renders, **Then** each course row shows video count, storage size, bandwidth consumed, and status.

---

### User Story 6 — Teacher configures player settings (Priority: P3)

A teacher visits the settings page and configures watermark toggle, PDF download permission, domain whitelisting, player color, and logo upload — with a live preview panel.

**Why this priority**: Settings is a new page that enables player-level configuration.

**Independent Test**: Can be tested by loading the settings page, toggling options, and verifying the preview updates.

**Acceptance Scenarios**:

1. **Given** the settings page loads, **When** a teacher toggles watermark on/off, **Then** the live preview panel shows/hides watermark overlays.

2. **Given** the settings page loads, **When** a teacher changes the player color, **Then** the preview updates to reflect the new color.

3. **Given** a teacher configures settings, **When** they click Save, **Then** the settings are persisted and a success toast appears.

---

### Edge Cases

- What happens when the overview data query fails? The existing error handling (`Placeholder` component) should render with the new styling.
- What happens on ultra-wide monitors (>1440px)? The content area should max out at 1440px per the design.
- What happens when there are zero courses? The dashed "Add Course" CTA card should fill the grid.
- What happens when storage data is unavailable? The donut gauge shows 0% gracefully.

## Requirements

### Functional Requirements

- **FR-001**: System MUST apply the navy (#00236f) primary color scheme to all dashboard pages, replacing the current indigo (#4F46E5).
- **FR-002**: System MUST support dark mode with adapted navy tones (lighter navy primaries on dark backgrounds).
- **FR-003**: Sidebar MUST show 5 navigation items: Overview, Courses, Students, Storage, Settings with correct lucide-react icons.
- **FR-004**: Sidebar MUST use navy active state styling (tinted background + border highlight).
- **FR-005**: Sidebar MUST include a teacher profile section at the bottom (avatar, name, role).
- **FR-006**: Topbar MUST use glass effect background (`backdrop-blur-md`) and include Create Course button, notification bell, locale/theme toggles, and user avatar.
- **FR-007**: Mobile devices MUST show a bottom navigation bar with all 5 tabs instead of the sidebar.
- **FR-008**: Overview page stat cards MUST use white rounded-2xl cards with navy values, icon in tinted circle, and trend badge.
- **FR-009**: Overview chart MUST use Chart.js inside the new card layout with weekly/monthly toggle.
- **FR-010**: Overview page MUST include a video processing status card showing recent items with status badges.
- **FR-011**: Courses page MUST use the new card layout (cover image, navy title, student count, price, status badge, action buttons).
- **FR-012**: Create Course dialog MUST use the new modal styling (rounded-2xl, navy header, rounded-xl inputs).
- **FR-013**: Students page MUST display 3 stat cards (total, active, pending), search bar, status filter pills, data table with progress bars and action buttons, and pagination controls.
- **FR-014**: Grant Access modal MUST allow selecting access type (lifetime, 3-month, 6-month, view-only).
- **FR-015**: Storage page MUST render an S3 storage donut gauge, bandwidth line chart (Chart.js), and per-course storage breakdown table with search.
- **FR-016**: Settings page MUST provide watermark toggle, PDF download toggle, domain whitelist input, player color picker, logo upload, and live player preview.
- **FR-017**: All pages MUST use lucide-react icons (not Material Symbols) mapped to approximate the exported design's icon intent.
- **FR-018**: All existing data fetching, server actions, queries, and i18n translation logic MUST remain unchanged.
- **FR-019**: Toast notifications (success/error messages) MUST match the exported design's floating toast style (navy background, rounded-2xl).
- **FR-020**: Responsive layout MUST follow the exported design: 280px sidebar on desktop, bottom nav on mobile, max content width 1440px.

### Key Entities

- **Design Tokens**: CSS custom properties in `globals.css` defining colors, radii, spacing, and typography — the single source of truth for the new navy theme.
- **Page Routes**: Next.js App Router pages under `app/[locale]/(teacher)/` — Overview, Courses, Course Detail, Students, Storage (new), Settings (new).
- **Feature Components**: React components in `src/features/` — the visual layer (JSX + Tailwind classes) gets restyled while data/action layers remain unchanged.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 5 pages (Overview, Courses, Students, Storage, Settings) render with the navy design consistently — verified by visual comparison of CSS token values in `globals.css`.
- **SC-002**: Dark mode switching works on all pages with adapted navy tones — verified by toggling theme and confirming readable contrast on all surfaces.
- **SC-003**: All existing data flows continue to work without regression — verified by the existing test suite passing (`npm test`, `npm run typecheck`, `npm run lint`).
- **SC-004**: Sidebar navigation to all 5 pages works correctly with proper active state indication — verified by clicking each nav item and confirming the route loads and the active state highlights in navy.
- **SC-005**: Storage and Settings pages render without errors on first load — verified by navigating to each new page with sample/mocked data.
- **SC-006**: The responsive layout adapts correctly at mobile breakpoints (bottom nav replaces sidebar) — verified by resizing the viewport below the `md` breakpoint.

## Assumptions

- All existing i18n translation keys are sufficient; no new translation keys are introduced for the visual change aside from Storage and Settings pages.
- The exported design's SVG charts are re-implemented using Chart.js (already in the project as `react-chartjs-2`) to match the layout intent.
- Dark mode uses adapted navy tones (lighter navy primaries, darker surfaces) rather than an exact inversion of the light scheme.
- The existing shadcn/ui component primitives (`Card`, `Button`, `Input`, `Table`, `Avatar`, `Badge`) are used where they match the design intent, with custom Tailwind classes for unique visual elements.
- Student data for the Students page will come from the existing backend API (the placeholder will be replaced with a real query component).
- Storage and Settings pages use mock/local state initially, matching the exported design's demo pattern, until backend endpoints become available.
- The Grant Access modal is a client-side modal with local state (no server persistence required for the initial implementation).
