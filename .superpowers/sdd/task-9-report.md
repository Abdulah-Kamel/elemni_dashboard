# Task 9 Report: Simplify admin pages to thin shells

## Status: ✅ Complete

## Changes
- **`teachers/page.tsx`**: Added `TaxonomyManager` imports and inline grid rendering for subjects + grades below `TeachersList`. Removed server-side data fetching.
- **`grades/page.tsx`**: Replaced with thin shell — just renders `<TaxonomyManager>` with inline props.
- **`streams/page.tsx`**: Replaced with thin shell — just renders `<TaxonomyManager>` with inline props.
- **`subjects/page.tsx`**: Replaced with thin shell — just renders `<TaxonomyManager>` with inline props.

All pages now:
- Use `setRequestLocale` + `verifySession` for locale/auth
- Delegate all data fetching to client components via React Query
- No server-side data fetching

## Verification
- `npx tsc --noEmit`: No new errors (only pre-existing ones)
- Committed as `8910d78` with message: `refactor: simplify admin pages to thin shells`
