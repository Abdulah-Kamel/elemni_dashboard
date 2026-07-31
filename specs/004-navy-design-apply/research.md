# Research: Navy Visual Redesign

**Phase 0** | **Date**: 2026-07-23

## Decisions

### Color Scheme
- **Decision**: Adopt navy (#00236f) primary from exported design
- **Rationale**: User explicitly chose Option 1 (navy over current indigo)
- **Alternatives considered**: Keep current indigo (#4F46E5)

### Dark Mode
- **Decision**: Adapt navy scheme for dark mode (lighter navy primaries on dark surfaces)
- **Rationale**: User chose "Adapt the navy scheme for dark"
- **Alternatives considered**: Light-only, or fall back to existing indigo dark theme

### Icons
- **Decision**: Keep lucide-react (do not switch to Material Symbols)
- **Rationale**: User explicitly chose lucide-react
- **Alternatives considered**: Material Symbols as in exported design

### Charts
- **Decision**: Use Chart.js (via existing react-chartjs-2) for chart rendering
- **Rationale**: User explicitly chose "use chart.js that corresponds to this" (the exported chart layout)
- **Alternatives considered**: Custom SVG charts from exported design, other chart libraries

### Approach
- **Decision**: Token-swap + component restyle (Approach A)
- **Rationale**: Keeps all existing data fetching, server actions, queries, and i18n intact
- **Alternatives considered**: Port components from scratch, minimal token-only path

## Dependencies

- Exported design source: `elemni-redsing/` (reference for card layouts, glass effects, spacing)
- Current dashboard: globals.css tokens, feature components in `src/features/*/components/`

## Integration Patterns

- shadcn/ui primitives used where they match the design; custom Tailwind classes for unique elements
- next-intl i18n integration preserved unchanged
- next-themes dark mode integration preserved; new navy dark values added to `.dark` block in globals.css
