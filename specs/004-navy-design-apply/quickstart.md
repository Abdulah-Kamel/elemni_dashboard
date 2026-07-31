# Quickstart: Navy Visual Redesign

**Validation guide** | **Date**: 2026-07-23

## Prerequisites

- Node.js (see `.nvmrc` or `package.json` engines)
- `npm install` completed
- Next.js dev server running: `npm run dev`

## Validation Scenarios

### 1. Design Tokens

```bash
# Verify the navy primary color is applied
grep -c "00236f" app/globals.css
# Expected: > 0 matches
```

### 2. TypeScript & Lint

```bash
npm run typecheck
npm run lint
# Expected: Both pass with no errors
```

### 3. Dev Server

```bash
npm run dev
# Expected: Server starts without errors, navigate to http://localhost:3000/ar/dashboard
```

### 4. Manual Visual Checks

| Check | What to Verify |
|-------|---------------|
| Sidebar | 5 nav items visible, navy active state on current page, teacher profile at bottom |
| Topbar | Glass background, Create Course button, notification bell, locale/theme toggles, avatar |
| Mobile | Bottom nav bar visible below `md` breakpoint, sidebar hidden |
| Overview | 4 stat cards with navy values, Chart.js chart with weekly/monthly toggle, video status card, activity table |
| Courses | Course cards with cover image, navy title, student count, price, status badge |
| Students | 3 stat cards, search/filter bar, data table with progress bars, pagination, action buttons |
| Storage | Donut gauge, bandwidth chart (Chart.js), per-course breakdown table |
| Settings | Watermark toggle, PDF toggle, domain input, color picker, player preview |

### 5. Dark Mode

```bash
# Press 'd' to toggle dark mode, verify on each page:
# - Navy primary appears lighter (#90a8ff)
# - Cards have dark backgrounds
# - Text remains readable
```

### 6. Existing Test Suite

```bash
npm test
npm run typecheck
npm run lint
# Expected: All existing tests still pass (no regressions)
```

## Expected Outcomes

- All 5 pages render with the navy design consistently
- Dark mode works on all pages with adapted navy tones
- All existing data flows work without regression
- Sidebar navigation to all 5 pages works with correct active states
- Storage and Settings pages render without errors
- Responsive layout switches to bottom nav at mobile breakpoints
