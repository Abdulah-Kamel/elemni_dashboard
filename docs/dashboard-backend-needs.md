# Dashboard redesign — backend needs

The teacher and admin dashboards were redesigned on `feat/dashboard-redesign`
using only the existing API. These endpoints would unlock the remaining
features or remove client-side workarounds. The frontend never computes
money: every amount below must come from the API.

## Trend charts (blocked)
The overview has a slot (`src/features/dashboard/components/trend-slot.tsx`)
that renders nothing until a data source exists.

`GET /api/v1/teachers/me/analytics/timeseries?start=YYYY-MM-DD&end=YYYY-MM-DD&bucket=day|week|month`

```json
{ "bucket": "week", "currency": "EGP",
  "points": [{ "period_start": "2026-09-01", "earnings": "123.45", "revenue": "150.00", "subscriptions": 4 }] }
```
Zero-filled buckets, oldest first, money as decimal strings. An admin
equivalent (`/api/v1/admin/analytics/timeseries`, platform-wide revenue,
subscriptions and sign-ups) would power the admin overview the same way.
Adding `currency` to `/teachers/me/analytics` removes the EGP assumption.

## Counts that the frontend currently derives by loading full lists
- **Teacher overview "needs attention" and course cards** load every
  subscription and every course. A counts endpoint would replace that:
  `GET /api/v1/teachers/me/attention` → `{ expiring_subscriptions, pending_subscriptions, draft_courses, courses_without_students }`
  and `GET /api/v1/teachers/me/courses/stats` → `[{ course_id, students, pending, earnings }]`
  (the current `top-courses` endpoint caps at 100 courses).
- **Admin overview** makes four extra `limit=1` calls. Add to `/api/v1/admin/overview`:
  counts of teachers without a video library, subscriptions per payment status,
  and teachers with pending dues.

## Admin lists
- `sort_by` / `sort_order` on `/admin/teachers`, `/admin/students`,
  `/admin/subscriptions` (today sorting only reorders the loaded page, and the UI says so).
- `has_library` filter on `/admin/teachers` (today filtered in the browser over 100 rows).
- `student_id` filter on subscriptions, and `GET /admin/subscriptions/{enrollment_id}`
  so `?view=` deep links work for rows outside the current page.
- A per-teacher summary (courses, students, revenue) for the teacher side panel.

## Other
- **Global search** for the Ctrl/⌘+K palette (today it searches pages and actions only):
  `GET /api/v1/search?q=&types=course,student,teacher&limit=` →
  `{ items: [{ type, id, title, subtitle, url_hint }] }`, role-scoped, Arabic-insensitive.
- **Notifications** feed + unread count, so the bell can show real items.
- **Grant access** endpoint, if teachers should grant a student access manually
  (`grant-access-modal.tsx` exists but has no API).
- **Coupons** are still a localStorage mock (`src/features/coupons`); they need a real API.
