# Video Watch Limits & Extra-View Grants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution method (chosen by the user):** each task is delegated to the Codex CLI via the `codex-delegate` skill with the **Model** line on the task (never gpt-6-astra). The orchestrator writes the brief, re-runs the gates, reviews the diff and commits; Codex never commits.

**Goal:** Teachers set a per-video watch limit and grant/revoke extra views per student from the dashboard.

**Architecture:** Extend the existing course-management item schema/card/dialog with `max_watch_count`. Add a `src/features/video-grants/` feature (zod schema, server actions over `apiFetch`, three client components) mounted in the existing student detail sheet.

**Tech Stack:** Next.js 16 (App Router, server actions), React 19, TypeScript strict, zod, next-intl (ar default, RTL), Tailwind logical utilities, shadcn-style `@/components/ui/*`, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-06-video-watch-grants-design.md`

## Global Constraints

- Repo `/home/abdullahkm/projects/Elemni/elemni_dashboard`, branch `feat/video-watch-grants`.
- Read `CLAUDE.md` ("The boundary", "Non-negotiables") and `AGENTS.md`; Next 16 docs in `node_modules/next/dist/docs/`.
- All API calls through `apiFetch` from `@/lib/api/client` in server code; zod-parse every response. No `fetch` in components. No business rules in the frontend (the backend enforces limits, ownership and enrolment).
- Never auto-retry the grant POST; idempotency is the `Idempotency-Key` header chosen by the dialog.
- All user-facing strings in `src/i18n/messages/ar.json` and `en.json`; logical Tailwind only (`ms-/me-/ps-/pe-/start/end`).
- `granted_views` 1–1000; `reason` ≤ 500 chars; `max_watch_count` 1–1000 or `null` (unlimited).
- Follow the action pattern in `src/features/course-management/items-actions.ts` (`ActionResult<T>`, logger, `Unauthorized` → redirect to sign-in).
- Gates: `npm test` (Vitest), `npm run lint`, `npm run build`.

## Review Focus

1. Double-clicking "Grant" or a network retry must not create two grants → the same `Idempotency-Key` is reused until success. → Task 3 test `reuses the idempotency key on retry`.
2. Clearing the watch-limit input must send `null` (unlimited), not `0` or `""`. → Task 1 test `empty limit saves null`.
3. A grant for a video whose title can't be resolved (deleted item, other course) still renders → "Video #id". → Task 3 test `falls back to the item id`.
4. A student with no active subscription → "Grant extra views" disabled with a reason, not an API 400. → Task 3 test `disables granting without an active subscription`.
5. Backend 400 "not actively enrolled" (subscription expired between page load and submit) → the localized enrolment message, form stays open. → Task 2 test `maps the enrolment error`.

---

### Task 1: Watch limit on video items

**Model:** `gpt-6.1-sol`, effort `medium`.

**Files:**
- Modify: `src/features/course-management/items-schema.ts`
- Modify: `src/features/course-management/components/item-card.tsx` (video items: limit field + badge)
- Modify: `src/features/course-management/components/create-item-dialog.tsx` (optional limit field)
- Modify: `src/i18n/messages/{ar,en}.json`
- Test: `src/features/course-management/__tests__/watch-limit.test.tsx` (new), plus existing `create-item-dialog.test.tsx` must stay green

**Interfaces:**
- Produces: `itemOutSchema.max_watch_count: number | null`; `ItemCreate.max_watch_count?: number | null`; `ItemUpdate.max_watch_count?: number | null`; `parseWatchLimit(input: string): { ok: true; value: number | null } | { ok: false }` exported from `src/features/course-management/watch-limit.ts`.

- [ ] **Step 1: Failing tests** — `watch-limit.test.tsx`:

```tsx
import { describe, expect, it } from "vitest"
import { itemOutSchema, itemUpdateSchema, itemCreateSchema } from "@/features/course-management/items-schema"
import { parseWatchLimit } from "@/features/course-management/watch-limit"

describe("watch limit", () => {
  it("parses items with and without max_watch_count", () => {
    const base = { id: 1, lesson_id: 2, title: "V", bunny_stream_id: "g", bunny_stream_status: "ready", document_path: null, exam_id: null, order: 1 }
    expect(itemOutSchema.parse({ ...base, max_watch_count: 3 }).max_watch_count).toBe(3)
    expect(itemOutSchema.parse(base).max_watch_count).toBeNull()
  })
  it.each([["", { ok: true, value: null }], ["  ", { ok: true, value: null }], ["3", { ok: true, value: 3 }], ["1000", { ok: true, value: 1000 }],
           ["0", { ok: false }], ["-2", { ok: false }], ["1001", { ok: false }], ["2.5", { ok: false }], ["abc", { ok: false }]])(
    "empty limit saves null / parses %j", (input, expected) => { expect(parseWatchLimit(input)).toEqual(expected) })
  it("update/create schemas accept null and reject out-of-range", () => {
    expect(itemUpdateSchema.parse({ max_watch_count: null })).toEqual({ max_watch_count: null })
    expect(itemCreateSchema.safeParse({ title: "V", max_watch_count: 0 }).success).toBe(false)
    expect(itemCreateSchema.safeParse({ title: "V", max_watch_count: 1001 }).success).toBe(false)
  })
})
```

Add component tests in the same file for `item-card.tsx` (render a video item with `max_watch_count: 3` → badge text from the `watchLimit.views` message with count 3; with `null` → `watchLimit.unlimited`; editing the field to empty and saving calls the mocked `updateItem` with `{ max_watch_count: null }`; typing `0` shows the inline error and does not call `updateItem`). Read `item-card.tsx` and an existing component test (`create-item-dialog.test.tsx`) first to mount it the same way (providers, mocks of `@/features/course-management/items-actions`).

- [ ] **Step 2: Run** `npx vitest run src/features/course-management/__tests__/watch-limit.test.tsx` → FAIL (module/field missing).

- [ ] **Step 3: Implement**

`src/features/course-management/watch-limit.ts`:

```ts
export const MAX_WATCH_LIMIT = 1000

export function parseWatchLimit(input: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = input.trim()
  if (trimmed === "") return { ok: true, value: null }
  if (!/^\d+$/.test(trimmed)) return { ok: false }
  const value = Number(trimmed)
  return value >= 1 && value <= MAX_WATCH_LIMIT ? { ok: true, value } : { ok: false }
}
```

`items-schema.ts`: add to `itemOutSchema` `max_watch_count: z.number().int().positive().nullable().optional().transform((v) => v ?? null)`; to `itemCreateSchema` and `itemUpdateSchema` `max_watch_count: z.number().int().min(1).max(1000).nullable().optional()`.

`item-card.tsx`: for items with `bunny_stream_id`, render the badge (`t("watchLimit.views", { count })` or `t("watchLimit.unlimited")`) and, in the existing edit area, a labelled number input (`t("watchLimit.label")`, hint `t("watchLimit.hint")`) prefilled with the current value; on save use `parseWatchLimit` → invalid shows `t("watchLimit.invalid")`; valid and changed → `updateItem(courseId, item.id, { max_watch_count: value })` through the card's existing update path. `create-item-dialog.tsx`: same optional input; include `max_watch_count` in the create payload only when not null.

Messages (match the namespace the item card already uses — read it first; keys below are relative to it):

```json
"watchLimit": {
  "label": "Max views per student",
  "hint": "Leave empty for unlimited views.",
  "views": "{count, plural, one {# view} other {# views}}",
  "unlimited": "Unlimited views",
  "invalid": "Enter a whole number from 1 to 1000, or leave it empty."
}
```

```json
"watchLimit": {
  "label": "أقصى عدد مشاهدات لكل طالب",
  "hint": "سيبه فاضي لو المشاهدات مفتوحة.",
  "views": "{count, plural, zero {# مشاهدة} one {مشاهدة واحدة} two {مشاهدتين} few {# مشاهدات} many {# مشاهدة} other {# مشاهدة}}",
  "unlimited": "مشاهدات مفتوحة",
  "invalid": "اكتب رقم صحيح من 1 لـ 1000، أو سيبه فاضي."
}
```

- [ ] **Step 4: Run** the test file + `npx vitest run src/features/course-management` → PASS.
- [ ] **Step 5: Commit** (orchestrator) `feat(courses): per-video watch limit on items`.

---

### Task 2: Grants data layer

**Model:** `gpt-6.1-sol`, effort `medium`.

**Files:**
- Create: `src/features/video-grants/schema.ts`, `src/features/video-grants/actions.ts`, `src/features/video-grants/errors.ts`
- Modify: `src/lib/api/endpoints.ts`
- Test: `src/features/video-grants/schema.test.ts`, `src/features/video-grants/actions.test.ts`

**Interfaces:**
- Consumes: `apiFetch`, `ApiErrorImpl` (`@/lib/api/errors`), `listLessons` (`@/features/course-management/lessons-queries`), `listItems` (`@/features/course-management/items-queries`).
- Produces:
  - `grantSchema`, `type Grant`; `grantCreateSchema`, `type GrantCreate`; `courseVideoSchema`, `type CourseVideo = { item_id: number; title: string; lesson_title: string; max_watch_count: number | null }`.
  - `type GrantErrorCode = "not_enrolled" | "not_owner" | "not_found" | "conflict" | "invalid" | "unknown"`; `mapGrantError(err: unknown): GrantErrorCode`.
  - Actions returning `GrantActionResult<T> = { success: true; data: T } | { success: false; code: GrantErrorCode }`:
    `listStudentGrants(studentId: number)`, `createGrant(input: GrantCreate, idempotencyKey: string)`, `revokeGrant(grantId: number, studentId: number)`, `listCourseVideos(courseId: number)`.
  - `endpoints.videoAnalytics.grants.list(userId: number) => string`, `.create => string`, `.revoke(grantId: number) => string`.

- [ ] **Step 1: Failing tests**

`schema.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { grantCreateSchema, grantSchema } from "./schema"

const grant = { id: 9, user_id: 5, item_id: 319, granted_by_id: 3, idempotency_key: "0b6f3b9e-1d5e-4c7a-9f1e-2a3b4c5d6e7f",
  granted_views: 3, consumed_views: 1, remaining_views: 2, reason: null, created_at: "2026-10-06T10:00:00Z", expires_at: null, revoked_at: null }

describe("grant schemas", () => {
  it("parses a backend grant", () => { expect(grantSchema.parse(grant).remaining_views).toBe(2) })
  it.each([0, 1001, 1.5])("rejects granted_views %s", (n) => {
    expect(grantCreateSchema.safeParse({ user_id: 5, item_id: 319, granted_views: n }).success).toBe(false)
  })
  it("rejects a reason over 500 chars and a past expiry", () => {
    expect(grantCreateSchema.safeParse({ user_id: 5, item_id: 319, granted_views: 1, reason: "x".repeat(501) }).success).toBe(false)
    expect(grantCreateSchema.safeParse({ user_id: 5, item_id: 319, granted_views: 1, expires_at: "2000-01-01T00:00:00Z" }).success).toBe(false)
  })
})
```

`actions.test.ts` (mock `apiFetch`, `listLessons`, `listItems`, `next/headers`, `@/lib/auth/redirect` like other action tests):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiErrorImpl } from "@/lib/api/errors"

const m = vi.hoisted(() => ({ apiFetch: vi.fn(), listLessons: vi.fn(), listItems: vi.fn(), redirect: vi.fn() }))
vi.mock("@/lib/api/client", () => ({ apiFetch: m.apiFetch }))
vi.mock("@/features/course-management/lessons-queries", () => ({ listLessons: m.listLessons }))
vi.mock("@/features/course-management/items-queries", () => ({ listItems: m.listItems }))
vi.mock("@/lib/auth/redirect", () => ({ redirectToAuth: m.redirect }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

import { createGrant, listCourseVideos, listStudentGrants, revokeGrant } from "./actions"

const err = (type: string, status: number, message: string) => new ApiErrorImpl({ type, status, message } as never)

beforeEach(() => { Object.values(m).forEach((f) => f.mockReset()) })

describe("video grant actions", () => {
  it("sends the Idempotency-Key header and the exact body", async () => {
    m.apiFetch.mockResolvedValue({})
    await createGrant({ user_id: 5, item_id: 319, granted_views: 2, reason: "lost views" }, "key-1")
    expect(m.apiFetch).toHaveBeenCalledWith("/api/v1/video-analytics/grants", expect.anything(), expect.objectContaining({
      method: "POST", headers: expect.objectContaining({ "Idempotency-Key": "key-1" }),
      body: JSON.stringify({ user_id: 5, item_id: 319, granted_views: 2, reason: "lost views" }) }))
  })
  it("maps the enrolment error", async () => {
    m.apiFetch.mockRejectedValue(err("Upstream", 400, "Grant target is not actively enrolled"))
    expect(await createGrant({ user_id: 5, item_id: 319, granted_views: 1 }, "k")).toEqual({ success: false, code: "not_enrolled" })
  })
  it.each([
    [err("Forbidden", 403, "Not authorized to grant access to this video"), "not_owner"],
    [err("NotFound", 404, "Video not found"), "not_found"],
    [err("Conflict", 409, "Idempotency key reused with different payload"), "conflict"],
    [err("Validation", 422, "granted_views must be <= 1000"), "invalid"],
    [new Error("boom"), "unknown"],
  ])("maps %s", async (e, code) => {
    m.apiFetch.mockRejectedValue(e)
    expect(await createGrant({ user_id: 5, item_id: 319, granted_views: 1 }, "k")).toEqual({ success: false, code })
  })
  it("lists a student's grants and revokes one", async () => {
    m.apiFetch.mockResolvedValueOnce([]).mockResolvedValueOnce({ status: "revoked" })
    expect(await listStudentGrants(5)).toEqual({ success: true, data: [] })
    expect(m.apiFetch.mock.calls[0][0]).toBe("/api/v1/video-analytics/grants?user_id=5")
    expect(await revokeGrant(9, 5)).toEqual({ success: true, data: null })
    expect(m.apiFetch.mock.calls[1][0]).toBe("/api/v1/video-analytics/grants/9")
    expect(m.apiFetch.mock.calls[1][2]).toMatchObject({ method: "DELETE" })
  })
  it("lists only video items, lesson then item order", async () => {
    m.listLessons.mockResolvedValue([{ id: 2, title: "B", order: 2 }, { id: 1, title: "A", order: 1 }])
    m.listItems.mockImplementation(async (_c: number, lessonId: number) => lessonId === 1
      ? [{ id: 11, title: "doc", bunny_stream_id: null, order: 1, max_watch_count: null }, { id: 12, title: "v1", bunny_stream_id: "g", order: 2, max_watch_count: 3 }]
      : [{ id: 21, title: "v2", bunny_stream_id: "h", order: 1, max_watch_count: null }])
    expect(await listCourseVideos(57)).toEqual({ success: true, data: [
      { item_id: 12, title: "v1", lesson_title: "A", max_watch_count: 3 },
      { item_id: 21, title: "v2", lesson_title: "B", max_watch_count: null } ] })
  })
  it("redirects to sign-in on Unauthorized", async () => {
    m.apiFetch.mockRejectedValue(err("Unauthorized", 401, "expired"))
    await listStudentGrants(5)
    expect(m.redirect).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/features/video-grants` → FAIL (modules missing).

- [ ] **Step 3: Implement**

`endpoints.ts` — add:

```ts
  videoAnalytics: {
    grants: {
      create: "/api/v1/video-analytics/grants",
      list: (userId: number) => `/api/v1/video-analytics/grants?user_id=${userId}`,
      revoke: (grantId: number) => `/api/v1/video-analytics/grants/${grantId}`,
    },
  },
```

`schema.ts`:

```ts
import { z } from "zod"

export const grantSchema = z.object({
  id: z.number().int(), user_id: z.number().int(), item_id: z.number().int(),
  granted_by_id: z.number().int().nullable(), idempotency_key: z.string(),
  granted_views: z.number().int(), consumed_views: z.number().int(), remaining_views: z.number().int(),
  reason: z.string().nullable(), created_at: z.string(), expires_at: z.string().nullable(), revoked_at: z.string().nullable(),
})
export type Grant = z.infer<typeof grantSchema>

export const grantCreateSchema = z.object({
  user_id: z.number().int().positive(),
  item_id: z.number().int().positive(),
  granted_views: z.number().int().min(1).max(1000),
  reason: z.string().trim().max(500).optional(),
  expires_at: z.string().datetime({ offset: true }).refine((v) => Date.parse(v) > Date.now(), "expiry must be in the future").optional(),
})
export type GrantCreate = z.infer<typeof grantCreateSchema>

export const courseVideoSchema = z.object({
  item_id: z.number().int(), title: z.string(), lesson_title: z.string(), max_watch_count: z.number().int().nullable(),
})
export type CourseVideo = z.infer<typeof courseVideoSchema>
```

`errors.ts`:

```ts
import { ApiErrorImpl } from "@/lib/api/errors"

export type GrantErrorCode = "not_enrolled" | "not_owner" | "not_found" | "conflict" | "invalid" | "unknown"

// Backend detail strings: elemni/src/video_analytics/service.py grant_video_exception.
export function mapGrantError(err: unknown): GrantErrorCode {
  if (!(err instanceof ApiErrorImpl)) return "unknown"
  if (err.status === 400 && /active(ly enrolled| student)/.test(err.message)) return "not_enrolled"
  if (err.type === "Forbidden") return "not_owner"
  if (err.type === "NotFound") return "not_found"
  if (err.type === "Conflict") return "conflict"
  if (err.type === "Validation" || err.status === 400) return "invalid"
  return "unknown"
}
```

`actions.ts` (`"use server"`): each action wraps `apiFetch` in try/catch; `Unauthorized` → `redirectToAuth(locale, "/students")` (copy the `redirectToSignIn` helper pattern from `items-actions.ts`); other errors → `{ success: false, code: mapGrantError(err) }`. `createGrant` validates with `grantCreateSchema` first (failure → `{ success: false, code: "invalid" }`), then `apiFetch(endpoints.videoAnalytics.grants.create, grantSchema, { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify(parsed) })`. `listStudentGrants` → `grantSchema.array()` with `tags: [\`grants:${studentId}\`]`; `createGrant` and `revokeGrant` call `revalidateTag(\`grants:${studentId}\`)` (createGrant uses `input.user_id`). `revokeGrant` parses `z.object({ status: z.literal("revoked") })` and returns `data: null`. `listCourseVideos(courseId)`: `const lessons = (await listLessons(courseId)).sort((a, b) => a.order - b.order)`; `Promise.all(lessons.map((l) => listItems(courseId, l.id)))`; flatten keeping `bunny_stream_id` items sorted by `order`, mapping to `CourseVideo`.

- [ ] **Step 4: Run** `npx vitest run src/features/video-grants` → PASS.
- [ ] **Step 5: Commit** (orchestrator) `feat(grants): video grant schema, actions and error mapping`.

---

### Task 3: Grants UI in the student detail sheet

**Model:** `gpt-6.1-sol`, effort `medium`.

**Files:**
- Create: `src/features/video-grants/components/grant-views-section.tsx`, `grant-views-dialog.tsx`, `grant-list.tsx`
- Modify: `src/features/students/components/student-detail-sheet.tsx` (mount the section under Subscriptions)
- Delete: `src/features/students/components/grant-access-modal.tsx` (confirm with `rg GrantAccessModal src` that nothing imports it)
- Modify: `src/i18n/messages/{ar,en}.json` (`videoGrants` namespace); ensure the students page passes the namespace to the client (check how `student` messages reach `StudentDetailSheet`, e.g. `pickMessages` in the page/layout)
- Test: `src/features/video-grants/components/grant-views.test.tsx`

**Interfaces:**
- Consumes: Task 2 actions/types; `StudentSubscriptionRow` (`@/features/students/components/student-table`) for the student's subscriptions; `@/components/ui/{button,dialog,select,input,textarea,label}` (use what exists — check `src/components/ui`).
- Produces: `<GrantViewsSection studentId={number} subscriptions={StudentSubscriptionRow[]} now={number} />`.

Behaviour:
- Section title `videoGrants.title` ("Extra video views"). Loads `listStudentGrants(studentId)` and, for each distinct active-subscription course, `listCourseVideos(courseId)` (to resolve titles and fill the dialog). Loading → skeleton rows; error → `videoGrants.loadError` + Retry.
- "Grant extra views" button; disabled with `videoGrants.noActiveSubscription` when no subscription has `payment_status === "completed"` and `expires_at > now`.
- Dialog: course select (active subscriptions only) → video select (`title — lesson`, suffix `videoGrants.limitN` / `videoGrants.unlimited`) → views number (default 1, 1–1000) → reason textarea (≤ 500, counter) → optional expiry date (date input; sent as end-of-day local ISO). When the chosen video has `max_watch_count === null` show `videoGrants.noLimitNote`. `const keyRef = useRef(crypto.randomUUID())` set when the dialog opens; a failed submit keeps the key; success closes the dialog, resets the key, refreshes the list, toasts `videoGrants.granted`. Submit disabled while pending. Error codes → `videoGrants.errors.<code>` shown inline.
- List rows: title (fallback `videoGrants.videoFallback` with `{id}`), `videoGrants.remaining` ("{remaining} of {granted} left"), reason, expiry (`Intl.DateTimeFormat(locale)`), status chip: `revoked_at` → Revoked; `expires_at` past → Expired; `remaining_views === 0` → Used up; else Active. Active rows: Revoke → confirm dialog (`videoGrants.revokeConfirm`) → `revokeGrant(id, studentId)` → refresh. Empty state `videoGrants.empty`.

- [ ] **Step 1: Failing tests** — `grant-views.test.tsx` (mock `@/features/video-grants/actions`; render with `NextIntlClientProvider` + real `en.json`, as other component tests do):

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
// providers/imports as in src/features/students/components/student-roster.test.tsx
const a = vi.hoisted(() => ({ listStudentGrants: vi.fn(), listCourseVideos: vi.fn(), createGrant: vi.fn(), revokeGrant: vi.fn() }))
vi.mock("@/features/video-grants/actions", () => a)

// fixtures: one active subscription to course 57; videos [{item_id:319,title:"Lecture 1",lesson_title:"L",max_watch_count:1}]
// helper renderSection({ subscriptions, grants })

describe("GrantViewsSection", () => {
  it("disables granting without an active subscription", async () => { /* subscription expired → button disabled + hint text */ })
  it("grants views and refreshes the list", async () => { /* open dialog, pick course/video, views 2, submit → createGrant called with {user_id, item_id:319, granted_views:2} and a key; list reloads */ })
  it("reuses the idempotency key on retry", async () => {
    a.createGrant.mockResolvedValueOnce({ success: false, code: "unknown" }).mockResolvedValueOnce({ success: true, data: {} })
    /* submit twice → both calls received the same second argument; after success, reopening the dialog uses a different key */
  })
  it("shows the enrolment error inline and keeps the form", async () => { /* code not_enrolled → en videoGrants.errors.not_enrolled text visible, dialog still open */ })
  it("falls back to the item id when a title is unknown", async () => { /* grant item_id 999 → "Video #999" */ })
  it("shows status chips and revokes an active grant after confirmation", async () => { /* active, expired, revoked, used-up rows; Revoke on active → confirm → revokeGrant(9, 5) → list refetched */ })
  it("rejects views outside 1–1000 without calling the API", async () => { /* 0 and 1001 → inline error, createGrant not called */ })
})
```

Write each test body fully (the comments above state the exact setup and assertions; no comment may remain in place of code).

- [ ] **Step 2: Run** `npx vitest run src/features/video-grants/components` → FAIL.
- [ ] **Step 3: Implement** the three components, mount `<GrantViewsSection studentId={student.student_id} subscriptions={subscriptions} now={now} />` in `student-detail-sheet.tsx` as a new `<section aria-labelledby="student-video-grants-title" className="border-t border-border p-5">` after the subscriptions section, delete `grant-access-modal.tsx`, add messages:

```json
"videoGrants": {
  "title": "Extra video views",
  "grant": "Grant extra views",
  "noActiveSubscription": "This student has no active subscription with you.",
  "course": "Course", "video": "Video", "views": "Extra views", "reason": "Reason (optional)", "expiry": "Expires on (optional)",
  "limitN": "limit {count}", "unlimited": "unlimited",
  "noLimitNote": "This video has no watch limit, so extra views are not needed yet.",
  "submit": "Grant", "cancel": "Cancel", "granted": "Extra views granted.",
  "remaining": "{remaining} of {granted} left",
  "status": { "active": "Active", "usedUp": "Used up", "expired": "Expired", "revoked": "Revoked" },
  "revoke": "Revoke", "revokeConfirm": "Revoke this grant? Unused views will be removed.",
  "empty": "No extra views granted yet.", "loadError": "Could not load grants.", "retry": "Retry",
  "videoFallback": "Video #{id}",
  "invalidViews": "Enter a whole number from 1 to 1000.",
  "errors": {
    "not_enrolled": "This student has no active subscription to this course.",
    "not_owner": "You can only grant views on your own videos.",
    "not_found": "That video or grant no longer exists.",
    "conflict": "This request was already sent with different values. Close the form and try again.",
    "invalid": "Check the values and try again.",
    "unknown": "Something went wrong on our side. Try again in a moment."
  }
}
```

Arabic (`ar.json`), same keys:

```json
"videoGrants": {
  "title": "مشاهدات إضافية للفيديو",
  "grant": "إضافة مشاهدات",
  "noActiveSubscription": "الطالب ده مالوش اشتراك فعّال معاك.",
  "course": "الكورس", "video": "الفيديو", "views": "عدد المشاهدات الإضافية", "reason": "السبب (اختياري)", "expiry": "تنتهي في (اختياري)",
  "limitN": "الحد {count}", "unlimited": "مفتوح",
  "noLimitNote": "الفيديو ده مالوش حد مشاهدات، فمش محتاج مشاهدات إضافية دلوقتي.",
  "submit": "إضافة", "cancel": "إلغاء", "granted": "تمت إضافة المشاهدات.",
  "remaining": "متبقي {remaining} من {granted}",
  "status": { "active": "فعّال", "usedUp": "اتستهلك", "expired": "منتهي", "revoked": "ملغي" },
  "revoke": "إلغاء", "revokeConfirm": "إلغاء الإضافة دي؟ المشاهدات اللي ماتستخدمتش هتتشال.",
  "empty": "مفيش مشاهدات إضافية لحد دلوقتي.", "loadError": "تعذر تحميل المشاهدات الإضافية.", "retry": "حاول تاني",
  "videoFallback": "فيديو رقم {id}",
  "invalidViews": "اكتب رقم صحيح من 1 لـ 1000.",
  "errors": {
    "not_enrolled": "الطالب ده مالوش اشتراك فعّال في الكورس ده.",
    "not_owner": "تقدر تضيف مشاهدات على فيديوهاتك بس.",
    "not_found": "الفيديو أو الإضافة دي مبقتش موجودة.",
    "conflict": "الطلب ده اتبعت قبل كده بقيم مختلفة. اقفل النموذج وجرب تاني.",
    "invalid": "راجع القيم وجرب تاني.",
    "unknown": "حصلت مشكلة عندنا. جرب تاني كمان شوية."
  }
}
```

- [ ] **Step 4: Run** `npx vitest run src/features/video-grants src/features/students` → PASS; `npm run lint`; `npm run build`.
- [ ] **Step 5: Commit** (orchestrator) `feat(students): grant and revoke extra video views`.

---

### Task 4: Full gates and real run (orchestrator)

- [ ] `npm test`, `npm run lint`, `npm run build` in the dashboard → all green.
- [ ] Real run against the local backend (dashboard dev server on a free port, backend on :8001): sign in as `mona-ali@test.com` / `teacher123`; set item 319 "Max views per student" = 1; open Students → `maya.elshenawy@test.com` → grant 2 views with a reason → row shows "2 of 2 left, Active"; the student app (`/en/my-courses/57?item=319` as that student) shows "2 more views available"; revoke → row "Revoked" and the student app shows the watch-limit card. Screenshot each step and check them; restore item 319 to 3 views afterwards.
- [ ] Read-only Codex review of the branch (`gpt-6.1-sol`, high); verify findings before fixing.
- [ ] Push `feat/video-watch-grants`.
