# Task 2 Report: Tighten profile schema

## What was implemented
- Changed `img` field in `updateProfileRequestSchema` from `z.string().nullable().optional()` to `z.string().url().nullable().optional()`
- Verified `cover_subtitle` is only a UI/i18n key (not in schema), so no action needed

## Verification results
`npm run typecheck`:
- No new errors introduced
- All errors are pre-existing in `elemni-redsing/` and `src/features/course-management/`

## Files changed
- `src/features/profile/schema.ts` — one-line change: added `.url()` validator to `img`

## Self-review findings
- The change is minimal and correct
- The `.url()` validator will now reject non-URL strings, preventing invalid image references
- `nullable().optional()` is preserved so omitting or explicitly nulling the field is still valid
- No test updates needed (validator narrowing is backward-compatible for valid URLs)

## Issues or concerns
- None
