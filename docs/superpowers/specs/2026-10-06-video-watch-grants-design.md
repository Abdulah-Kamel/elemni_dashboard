# Video Watch Limits & Extra-View Grants — Design

Date: 2026-10-06
Status: Approved in chat; pending spec review
Related: student app `elemni_front_end` branch `feat/video-analytics` (shows
"Watch limit reached — contact your teacher"); backend `elemni`
`src/video_analytics/{router,service,schemas}.py`, `src/items/schemas.py`.

## Goal

Teachers can (1) set how many times each student may watch a video and
(2) give one student extra views on one video when asked, then see and revoke
those grants — all from the dashboard. Today neither exists in any UI, so the
student app's "contact your teacher" message has no teacher-side answer.

## Decisions (from brainstorming)

- Grants live in the **student detail sheet** (Students → open a student).
- **Teachers only.** No admin screens (admins keep API access).
- A course's videos come from the authoring endpoints (`listLessons` +
  `listItems`), which use the teacher's token, include unpublished courses and
  already return `max_watch_count`.

## Backend contract (verified)

| Call | Notes |
|---|---|
| `POST /api/v1/courses/{course_id}/lessons/{lesson_id}/items` | body may include `max_watch_count` (int ≥ 1 or null) |
| `PATCH /api/v1/courses/{course_id}/items/{item_id}` | same field; `null` = unlimited |
| `ItemOut.max_watch_count` | `int | null` |
| `POST /api/v1/video-analytics/grants` | header `Idempotency-Key: <uuid>` (required); body `{user_id, item_id, granted_views (1..1000), reason? (≤500), expires_at? (ISO)}` → `GrantResponse` |
| `GET /api/v1/video-analytics/grants?user_id=&item_id=?` | teacher sees only grants on their own videos/granted by them → `GrantResponse[]` |
| `DELETE /api/v1/video-analytics/grants/{grant_id}` | → `{"status":"revoked"}` |

`GrantResponse`: `id, user_id, item_id, granted_by_id, idempotency_key,
granted_views, consumed_views, remaining_views, reason, created_at,
expires_at, revoked_at`.

Errors to map (status + `detail`):

| Status | detail | Message to teacher |
|---|---|---|
| 400 | `Grant target is not an active student` / `…not actively enrolled` | This student has no active subscription to this course. |
| 403 | `Not authorized to grant access to this video` | You can only grant views on your own videos. |
| 404 | `Video not found` / `Grant not found` | That video or grant no longer exists. |
| 409 | idempotency conflict | This request was already sent with different values — reopen the form. |
| 422 | `granted_views must be <= 1000` / validation | Enter between 1 and 1000 views. |

## 1. Watch limit per video (course builder)

- `items-schema.ts`: add `max_watch_count: z.number().int().positive().nullable()`
  to `itemOutSchema` (`.optional().default(null)` for older payloads), and
  `max_watch_count: z.number().int().min(1).max(1000).nullable().optional()` to
  `itemCreateSchema` and `itemUpdateSchema`.
- `item-card.tsx` (video items only, i.e. `bunny_stream_id` set): a
  "Max views per student" number input in the item's edit area. Empty = unlimited
  (sends `null`), else 1–1000. Saved via the existing `updateItem` action.
  The card shows a small badge: "3 views" / "Unlimited".
- `create-item-dialog.tsx`: the same optional field.
- Invalid input (0, negative, > 1000, non-integer) shows an inline error and
  does not submit.

## 2. Extra video views (student detail sheet)

New feature folder `src/features/video-grants/`:

- `schema.ts` — `grantSchema` (GrantResponse), `grantCreateSchema`
  (`user_id`, `item_id`, `granted_views` 1–1000, `reason` ≤ 500 optional,
  `expires_at` ISO optional, must be in the future), `courseVideoSchema`
  (`{item_id, title, lesson_title, max_watch_count}`).
- `actions.ts` (`"use server"`, same `ActionResult` shape and auth-redirect
  pattern as `items-actions.ts`):
  - `listStudentGrants(studentId)` → GET `/grants?user_id=`.
  - `createGrant(input, idempotencyKey)` → POST with `Idempotency-Key`.
  - `revokeGrant(grantId)` → DELETE.
  - `listCourseVideos(courseId)` → `listLessons` then `listItems` per lesson
    in parallel (reusing `course-management/lessons-queries.ts` and
    `items-queries.ts`); keeps items with `bunny_stream_id`; ordered by lesson
    then item `order`. This server-side stitching matches the existing course
    page, storage and student-preview loaders; the backend has no course-tree
    endpoint. Follow-up for the API team: `GET /api/v1/courses/{id}/items`
    (teacher-scoped, flat list with lesson title) would replace it.
  - Error mapping per the table above, returning a stable `code`.
- `lib/api/endpoints.ts`: `videoAnalytics.grants.list | create | revoke(id)`.
- Components:
  - `grant-views-section.tsx` — rendered in `student-detail-sheet.tsx` under
    Subscriptions. Shows the student's grants and a "Grant extra views" button
    (disabled with a hint when the student has no active subscription).
  - `grant-views-dialog.tsx` — course select (the student's active
    subscriptions with this teacher) → video select (`listCourseVideos`, shows
    "limit 3" / "unlimited" beside each) → views (default 1) → reason →
    expiry (optional date). Generates `crypto.randomUUID()` when the dialog
    opens and reuses it for retries of the same submission; a new key after a
    successful grant or when the dialog is reopened. Submit disabled while
    pending.
  - `grant-list.tsx` — rows: video title (resolved from the loaded course
    videos; fallback "Video #id"), "2 of 3 left", reason, expiry, status chip
    (Active / Used up / Expired / Revoked). Active rows have Revoke → confirm
    dialog → `revokeGrant` → list refreshes. Empty state text.
- A grant on a video whose `max_watch_count` is null still works (backend
  allows) but the dialog shows a note "This video has no limit".
- Delete the unused `students/components/grant-access-modal.tsx`.

## i18n

All strings in `src/i18n/messages/{ar,en}.json` under `videoGrants.*` and
`courseBuilder.watchLimit.*` (follow the existing namespace naming in the
files). Check `src/i18n/pick-messages.ts` so the students and course pages
receive the new namespaces. Logical spacing only (RTL).

## Testing

- Vitest: schemas (bounds, optional fields), actions with mocked `apiFetch`
  (Idempotency-Key header sent, body shape, each error mapped, list/revoke),
  `listCourseVideos` filtering/order, components (validation, pending state,
  key reuse on retry, list status chips, revoke confirm, empty states), item
  card limit field (null ↔ number).
- Gates: `npm test`, `npm run lint`, `npm run build`.
- Real run against the local backend: teacher `mona-ali@test.com` sets
  `max_watch_count` 1 on item 319; grants student `maya.elshenawy@test.com`
  2 views; the student app card changes from "Watch limit reached" to
  "2 more views available"; revoke returns it to the limit card.

## Out of scope

Admin grant screens; per-student watch history for teachers (no backend
endpoint); course-level default limits.
