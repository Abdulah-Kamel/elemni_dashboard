# Data Model: Navy Visual Redesign

**Phase 1** | **Date**: 2026-07-23

## Design Tokens (New Values)

The primary data for this feature is the CSS token system in `app/globals.css`. No new runtime data entities are introduced.

### Token Changes

| Token | Current Value | New Value | Context |
|-------|---------------|-----------|---------|
| `--brand-indigo` | `#4F46E5` | `#00236f` | Primary brand color |
| `--brand-indigo-deep` | `#312E81` | `#00164e` | Darkest navy |
| `--brand-indigo-tint` | `#EEF2FF` | `#dce1ff` | Light navy tint |
| `--color-on-primary` | `#FFFFFF` | `#FFFFFF` | No change (white on navy) |
| `--color-on-primary-tint` | `#312E81` | `#00164e` | Text on tinted backgrounds |
| `--border` | `#E4E4E7` | `#c5c5d3` | Slightly darker border |
| `--border-strong` | `#D4D4D8` | same | No change |
| `--spacing-sidebar-width` | `240px` | `280px` | Wider sidebar |

### New Dark Mode Tokens (`.dark` block)

| Token | Light Value | Dark Value |
|-------|-------------|------------|
| `--brand-indigo` (primary) | `#00236f` | `#90a8ff` (lighter for contrast) |
| `--brand-indigo-tint` | `#dce1ff` | `#1e3a8a` (dark tint) |
| `--surface` | `#FFFFFF` | `#18181B` (existing) |
| `--on-surface` | `#18181B` | `#FAFAFA` (existing) |

### Card/Component Tokens (New)

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-card` | `1rem` (16px) | Main cards (`rounded-2xl`) |
| `--radius-modal` | `1rem` (16px) | Modals |
| `--radius-input` | `0.75rem` (12px) | Inputs, buttons |
| `--radius-pill` | `9999px` | Badges, avatars |

## Navigation Structure

The sidebar nav items are the primary navigation entities:

| ID | Label Key | Route | Icon | Priority |
|----|-----------|-------|------|----------|
| overview | `sidebar.overview` | `/dashboard` | `LayoutGrid` | P1 |
| my_courses | `sidebar.my_courses` | `/courses` | `BookOpen` | P1 |
| students | `sidebar.students` | `/students` | `GraduationCap` | P2 |
| storage | `sidebar.storage` | `/storage` | `Cloud` | P3 |
| settings | `sidebar.settings` | `/settings` | `Settings` | P3 |

## Existing Data Entities (Unchanged)

All existing database entities, API contracts, and i18n schemas remain untouched. See existing `src/features/*/schema.ts` files.
