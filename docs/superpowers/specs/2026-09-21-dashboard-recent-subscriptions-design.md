# Dashboard Recent Subscriptions Design

## Goal

Add an honest recent-activity section to the teacher dashboard using the latest five real subscription records exposed by the existing backend.

## Scope

The section represents subscription activity only. It must not display fabricated lesson completions, assignment submissions, or other events that the API does not provide.

Recent subscriptions are independent of the analytics date filter. The dashboard always shows the latest five records across all payment statuses.

## Data Source

Request:

`GET /api/v1/teachers/me/subscriptions?payment_status=all&skip=0&limit=5`

The backend orders this endpoint by `Enrollment.purchased_at DESC`, so requesting the first five records returns the latest five subscriptions without loading the complete student roster.

The frontend must parse the response with the existing `teacherSubscriptionsPageSchema`. A focused query should return the page's `items` array without changing the existing full-roster query used by the students screen.

## Dashboard Data Flow

The dashboard server load requests analytics summary, top courses, and recent subscriptions. Recent subscriptions are secondary content:

- Analytics summary and top courses retain the existing page-level success and error behavior.
- A recent-subscriptions failure must not hide otherwise valid analytics content.
- A recent-subscriptions authorization failure follows the existing authentication redirect behavior.
- A non-authorization recent-subscriptions failure produces an unavailable state local to the activity card.

The recent-subscriptions request does not run again when the analytics date range changes. The existing client-side analytics query continues to update only the KPI cards, guided analysis, and top-courses table.

## Presentation

Add a focused `RecentSubscriptions` card below the top-courses table. Its heading is "Recent subscriptions," with a localized link to the existing `/students` route.

Render at most five stacked rows. Each row contains:

- Student initials and full name.
- A localized "Subscribed to {course}" description.
- Payment status using the existing localized status vocabulary and visual treatment.
- Locale-aware paid amount using the record's currency, falling back to `EGP` through the existing schema default.
- Locale-aware absolute purchase date.

Rows use semantic list markup. The layout remains compact on desktop and stacks metadata cleanly on mobile. It follows existing dashboard cards, tokens, focus states, and logical RTL-safe utilities. The feed does not include search, filters, pagination, charts, relative-time timers, or unsupported activity types.

## States

- **Ready:** render up to five newest subscription rows.
- **Empty:** render localized copy explaining that no subscription activity is available yet.
- **Unavailable:** render localized copy explaining that recent subscriptions could not be loaded while leaving the rest of the dashboard intact.
- **Unauthorized:** use the existing authentication redirect rather than rendering an unavailable card.

No state may insert sample subscription data.

## Localization And Accessibility

- Add matching Arabic and English keys for the section title, view-all link, subscription description, empty copy, and unavailable copy.
- Reuse the existing localized payment-status labels rather than introducing duplicate status wording.
- Use a heading, semantic list, descriptive course link or text, and a keyboard-visible students link.
- Do not communicate payment status through color alone.
- Format money and dates with the active locale; keep monetary numerals directionally stable in RTL layouts.

## Testing

Tests cover:

- The focused query requests `payment_status=all`, `skip=0`, and `limit=5`, parses the existing paginated schema, and returns only `items`.
- The server dashboard passes ready, empty, and unavailable activity states without changing analytics success behavior.
- Unauthorized subscription responses still trigger the existing authentication path.
- The component renders no more than five rows with student, course, status, amount, and absolute date.
- Empty and unavailable states contain no fabricated activity.
- Arabic and English message keys remain in parity.
- Semantic list/heading behavior and the `/students` link remain accessible.
- Existing analytics filtering tests continue to prove that recent subscriptions do not change with the date filter.

## Out Of Scope

- Lesson-completion, assignment, login, or content-view activity.
- New backend endpoints or response fields.
- Filtering, searching, pagination, or live updates within the card.
- Applying the analytics date range to subscriptions.
- Changes to the students page or its full-roster pagination behavior.
