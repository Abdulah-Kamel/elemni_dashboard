# Dashboard Recent Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a resilient dashboard activity feed showing the latest five real teacher subscription records.

**Architecture:** A focused query requests the backend's newest-first subscription page with a five-record limit. A standalone localized feed component renders ready, empty, and unavailable states, while a dashboard loader isolates secondary subscription failures from the existing analytics boundary and passes the initial records into `TeacherAnalyticsView`.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, TypeScript, next-intl 4.13.2, Tailwind CSS, shadcn Card/Avatar/Badge, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-09-21-dashboard-recent-subscriptions-design.md`

## Global Constraints

- Display only real subscription activity from `GET /api/v1/teachers/me/subscriptions`; do not fabricate lesson, assignment, login, or content-view events.
- Always request `payment_status=all&skip=0&limit=5`; the feed is independent of the analytics date filter.
- Render at most five records in backend-provided newest-first order.
- A non-authorization subscription failure must leave valid analytics visible and render a local unavailable state.
- A subscription authorization failure must use the existing dashboard authentication redirect path.
- Reuse existing subscription schemas and payment-status vocabulary; add no backend endpoint or response field.
- Preserve Arabic/English parity, locale-aware money/dates, semantic list markup, visible focus, and RTL-safe layout.
- Do not change the students page or its existing full-roster pagination query.

---

### Task 1: Query The Latest Five Subscriptions

**Files:**
- Modify: `src/features/students/queries.ts:1-32`
- Create: `src/features/students/queries.test.ts`

**Interfaces:**
- Consumes: `endpoints.teachers.subscriptions`, `teacherSubscriptionsPageSchema`, and `apiFetch`.
- Produces: `listRecentTeacherSubscriptions(): Promise<TeacherSubscription[]>` without changing `listTeacherSubscriptions()`.

- [ ] **Step 1: Write the failing focused-query test**

Create `src/features/students/queries.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
}))

vi.mock("@/lib/api/client", () => ({
  apiFetch: mocks.apiFetch,
}))

import { listRecentTeacherSubscriptions } from "./queries"

describe("student subscription queries", () => {
  beforeEach(() => {
    mocks.apiFetch.mockReset()
  })

  it("requests and returns the latest five subscriptions across statuses", async () => {
    const items = [
      {
        enrollment_id: 17,
        purchased_at: "2026-09-21T10:00:00Z",
        expires_at: "2027-09-21T10:00:00Z",
        payment_status: "completed",
        total_paid: 250,
        currency: "EGP",
        student_id: 4,
        student_name: "Mona Ali",
        student_email: "mona@example.com",
        course: { id: 8, title: "Physics", price: 250 },
      },
    ]
    mocks.apiFetch.mockResolvedValue({
      total: 1,
      skip: 0,
      limit: 5,
      items,
    })

    await expect(listRecentTeacherSubscriptions()).resolves.toEqual(items)
    expect(mocks.apiFetch).toHaveBeenCalledWith(
      "/api/v1/teachers/me/subscriptions?payment_status=all&skip=0&limit=5",
      expect.anything(),
      { tags: ["teacher-subscriptions"] }
    )
  })
})
```

- [ ] **Step 2: Run the test and verify the missing-export failure**

Run: `npm test -- src/features/students/queries.test.ts`

Expected: FAIL because `listRecentTeacherSubscriptions` is not exported.

- [ ] **Step 3: Implement the focused query without changing the roster query**

Append to `src/features/students/queries.ts`:

```ts
export async function listRecentTeacherSubscriptions(): Promise<
  TeacherSubscription[]
> {
  const result = await apiFetch(
    `${endpoints.teachers.subscriptions}?payment_status=all&skip=0&limit=5`,
    teacherSubscriptionsPageSchema,
    { tags: ["teacher-subscriptions"] }
  )

  return result.items
}
```

- [ ] **Step 4: Run the focused test**

Run: `npm test -- src/features/students/queries.test.ts`

Expected: PASS, 1 test.

- [ ] **Step 5: Commit the query**

```bash
git add src/features/students/queries.ts src/features/students/queries.test.ts
git commit -m "feat: query recent teacher subscriptions"
```

---

### Task 2: Render The Recent Subscriptions Feed

**Files:**
- Create: `src/features/dashboard/components/recent-subscriptions.tsx`
- Create: `src/features/dashboard/components/recent-subscriptions.test.tsx`
- Modify: `src/i18n/messages/en.json:182-240`
- Modify: `src/i18n/messages/ar.json:182-240`
- Test: `tests/unit/i18n-parity.test.ts`

**Interfaces:**
- Consumes: `subscriptions: TeacherSubscription[] | null`, where `null` means unavailable and `[]` means ready but empty.
- Produces: `RecentSubscriptions`, a semantic activity card that renders no more than five records and links to `/students`.

- [ ] **Step 1: Write failing feed tests**

Create `src/features/dashboard/components/recent-subscriptions.test.tsx`. Mock `next-intl`, the localized `Link`, and `PaymentStatusBadge`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RecentSubscriptions } from "./recent-subscriptions"
import type { TeacherSubscription } from "@/features/students/schema"

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () =>
    (key: string, values?: Record<string, string | number>) => {
      const messages: Record<string, string> = {
        title: "Recent subscriptions",
        view_all: "View all students",
        subscribed_to: "Subscribed to {course}",
        empty: "No subscription activity yet.",
        unavailable: "Recent subscriptions could not be loaded.",
      }
      return (messages[key] ?? key).replace(
        /\{(\w+)\}/g,
        (_, name: string) => String(values?.[name] ?? `{${name}}`)
      )
    },
}))

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock("@/features/billing/components/payment-status-badge", () => ({
  PaymentStatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}))

const baseSubscription: TeacherSubscription = {
  enrollment_id: 1,
  purchased_at: "2026-09-21T10:00:00Z",
  expires_at: "2027-09-21T10:00:00Z",
  payment_status: "completed",
  total_paid: 250,
  currency: "EGP",
  student_id: 4,
  student_name: "Mona Ali",
  student_email: "mona@example.com",
  course: { id: 8, title: "Physics", price: 250 },
}

function subscription(overrides: Partial<TeacherSubscription> = {}) {
  return { ...baseSubscription, ...overrides }
}
```

Add tests that assert:

```tsx
it("renders at most five newest subscriptions as a semantic list", () => {
  const subscriptions = Array.from({ length: 6 }, (_, index) =>
    subscription({
      enrollment_id: index + 1,
      student_name: `Student ${index + 1}`,
    })
  )
  render(<RecentSubscriptions subscriptions={subscriptions} />)

  expect(screen.getByRole("heading", { name: "Recent subscriptions" })).toBeDefined()
  expect(screen.getByRole("list").children).toHaveLength(5)
  expect(screen.getByText("Student 1")).toBeDefined()
  expect(screen.queryByText("Student 6")).toBeNull()
  expect(screen.getAllByText("Subscribed to Physics")).toHaveLength(5)
  expect(screen.getAllByText("completed")).toHaveLength(5)
  expect(screen.getAllByText(/250\.00/)).toHaveLength(5)
  expect(screen.getAllByText("Sep 21, 2026")).toHaveLength(5)
  expect(screen.getByRole("link", { name: "View all students" }).getAttribute("href")).toBe("/students")
})

it("distinguishes empty and unavailable states without fabricated rows", () => {
  const { rerender } = render(<RecentSubscriptions subscriptions={[]} />)
  expect(screen.getByText("No subscription activity yet.")).toBeDefined()
  expect(screen.queryByRole("list")).toBeNull()

  rerender(<RecentSubscriptions subscriptions={null} />)
  expect(screen.getByText("Recent subscriptions could not be loaded.")).toBeDefined()
  expect(screen.queryByRole("list")).toBeNull()
})
```

- [ ] **Step 2: Run the test and verify the missing-component failure**

Run: `npm test -- src/features/dashboard/components/recent-subscriptions.test.tsx`

Expected: FAIL because `./recent-subscriptions` does not exist.

- [ ] **Step 3: Implement the feed component**

Create `src/features/dashboard/components/recent-subscriptions.tsx`:

```tsx
"use client"

import { useLocale, useTranslations } from "next-intl"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { PaymentStatusBadge } from "@/features/billing/components/payment-status-badge"
import type { TeacherSubscription } from "@/features/students/schema"
import { Link } from "@/i18n/routing"

export function RecentSubscriptions({
  subscriptions,
}: {
  subscriptions: TeacherSubscription[] | null
}) {
  const t = useTranslations("analytics.recent_subscriptions")
  const locale = useLocale()
  const visibleSubscriptions = subscriptions?.slice(0, 5) ?? null

  return (
    <Card className="overflow-hidden rounded-2xl border border-border shadow-xs">
      <div className="flex items-center justify-between gap-4 border-b border-border px-md py-4">
        <h2 className="text-title-lg font-semibold text-foreground">
          {t("title")}
        </h2>
        <Link
          href="/students"
          className="text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("view_all")}
        </Link>
      </div>

      {visibleSubscriptions === null ? (
        <ActivityState message={t("unavailable")} />
      ) : visibleSubscriptions.length === 0 ? (
        <ActivityState message={t("empty")} />
      ) : (
        <ul className="divide-y divide-border">
          {visibleSubscriptions.map((subscription) => (
            <li
              key={subscription.enrollment_id}
              className="flex flex-col gap-3 px-md py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-10 shrink-0 bg-primary-tint text-primary">
                  <AvatarFallback className="font-semibold">
                    {getInitials(subscription.student_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {subscription.student_name}
                  </p>
                  <p className="truncate text-sm text-on-surface-muted">
                    {t("subscribed_to", { course: subscription.course.title })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <PaymentStatusBadge status={subscription.payment_status} />
                <span className="font-semibold text-foreground tabular-nums" dir="ltr">
                  {formatMoney(subscription.total_paid, subscription.currency, locale)}
                </span>
                <time
                  dateTime={subscription.purchased_at}
                  className="text-sm text-on-surface-muted tabular-nums"
                >
                  {formatDate(subscription.purchased_at, locale)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function ActivityState({ message }: { message: string }) {
  return <p className="px-md py-8 text-center text-sm text-on-surface-muted">{message}</p>
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value)
  )
}
```

- [ ] **Step 4: Add matching English and Arabic messages**

Add under `analytics` in `src/i18n/messages/en.json`:

```json
"recent_subscriptions": {
  "title": "Recent subscriptions",
  "view_all": "View all students",
  "subscribed_to": "Subscribed to {course}",
  "empty": "No subscription activity yet.",
  "unavailable": "Recent subscriptions could not be loaded."
}
```

Add the same key structure in `src/i18n/messages/ar.json`:

```json
"recent_subscriptions": {
  "title": "أحدث الاشتراكات",
  "view_all": "عرض كل الطلاب",
  "subscribed_to": "اشترك في {course}",
  "empty": "لا يوجد نشاط اشتراكات حتى الآن.",
  "unavailable": "تعذر تحميل أحدث الاشتراكات."
}
```

- [ ] **Step 5: Run component and translation tests**

Run: `npm test -- src/features/dashboard/components/recent-subscriptions.test.tsx tests/unit/i18n-parity.test.ts`

Expected: PASS for feed behavior and Arabic/English key parity.

- [ ] **Step 6: Commit the feed and translations**

```bash
git add src/features/dashboard/components/recent-subscriptions.tsx src/features/dashboard/components/recent-subscriptions.test.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add recent subscriptions feed"
```

---

### Task 3: Load And Integrate Recent Subscriptions Resiliently

**Files:**
- Create: `src/features/dashboard/load-overview.ts`
- Create: `src/features/dashboard/load-overview.test.ts`
- Modify: `app/[locale]/(teacher)/dashboard/page.tsx:1-98`
- Modify: `src/features/dashboard/components/overview.tsx:1-37`
- Modify: `src/features/analytics/components/teacher-analytics-view.tsx:31-52,205-278`
- Modify: `src/features/analytics/components/teacher-analytics-view.test.tsx`

**Interfaces:**
- Consumes: `listRecentTeacherSubscriptions()` from Task 1 and `RecentSubscriptions` from Task 2.
- Produces: `loadDashboardOverview(filters): Promise<DashboardResult>`, where a ready result includes `recentSubscriptions: TeacherSubscription[] | null`.

- [ ] **Step 1: Write failing loader tests**

Create `src/features/dashboard/load-overview.test.ts` with this setup:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TeacherAnalytics, TopEarningCourse } from "@/features/analytics/schema"
import type { TeacherSubscription } from "@/features/students/schema"

const mocks = vi.hoisted(() => ({
  getTeacherAnalytics: vi.fn(),
  listTopEarningCourses: vi.fn(),
  listRecentTeacherSubscriptions: vi.fn(),
}))

vi.mock("@/features/analytics/queries", () => ({
  getTeacherAnalytics: mocks.getTeacherAnalytics,
  listTopEarningCourses: mocks.listTopEarningCourses,
}))
vi.mock("@/features/students/queries", () => ({
  listRecentTeacherSubscriptions: mocks.listRecentTeacherSubscriptions,
}))

import { loadDashboardOverview } from "./load-overview"

const summary: TeacherAnalytics = {
  total_earnings: 900,
  sum_earning_money: 900,
  total_revenue: 1200,
  student_subscription_count: 9,
  subscription_count: 9,
  active_courses_count: 3,
  archived_courses_count: 1,
  archieved_courses_count: 1,
  start_date: null,
  end_date: null,
}
const topCourses: TopEarningCourse[] = [{
  id: 8,
  title: "Physics",
  name: "Physics",
  price: 250,
  earning_amount: 450,
  total_earnings: 450,
  student_subscription_count: 4,
  subscribed_students_count: 4,
}]
const subscriptions: TeacherSubscription[] = [{
  enrollment_id: 17,
  purchased_at: "2026-09-21T10:00:00Z",
  expires_at: "2027-09-21T10:00:00Z",
  payment_status: "completed",
  total_paid: 250,
  currency: "EGP",
  student_id: 4,
  student_name: "Mona Ali",
  student_email: "mona@example.com",
  course: { id: 8, title: "Physics", price: 250 },
}]

describe("loadDashboardOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
```

Cover these exact behaviors:

```ts
it("returns analytics and recent subscriptions together", async () => {
  mocks.getTeacherAnalytics.mockResolvedValue(summary)
  mocks.listTopEarningCourses.mockResolvedValue(topCourses)
  mocks.listRecentTeacherSubscriptions.mockResolvedValue(subscriptions)

  await expect(loadDashboardOverview({ start: "2026-09-01" })).resolves.toEqual({
    kind: "ready",
    summary,
    topCourses,
    recentSubscriptions: subscriptions,
  })
})

it("keeps analytics ready when recent subscriptions fail upstream", async () => {
  mocks.getTeacherAnalytics.mockResolvedValue(summary)
  mocks.listTopEarningCourses.mockResolvedValue(topCourses)
  mocks.listRecentTeacherSubscriptions.mockRejectedValue({ type: "Upstream", status: 503 })

  await expect(loadDashboardOverview({})).resolves.toEqual({
    kind: "ready",
    summary,
    topCourses,
    recentSubscriptions: null,
  })
})

it("returns unauthorized when recent subscriptions are unauthorized", async () => {
  mocks.getTeacherAnalytics.mockResolvedValue(summary)
  mocks.listTopEarningCourses.mockResolvedValue(topCourses)
  mocks.listRecentTeacherSubscriptions.mockRejectedValue({ type: "Unauthorized", status: 401 })

  await expect(loadDashboardOverview({})).resolves.toEqual({ kind: "unauthorized" })
})

it("preserves the existing analytics error result", async () => {
  mocks.getTeacherAnalytics.mockRejectedValue({
    type: "Upstream",
    status: 503,
    message: "Unavailable",
  })
  mocks.listTopEarningCourses.mockResolvedValue(topCourses)
  mocks.listRecentTeacherSubscriptions.mockResolvedValue(subscriptions)

  await expect(loadDashboardOverview({})).resolves.toEqual({
    kind: "error",
    error: {
      type: "Upstream",
      status: 503,
      message: "Unavailable",
    },
  })
})
})
```

- [ ] **Step 2: Run the loader test and verify the missing-module failure**

Run: `npm test -- src/features/dashboard/load-overview.test.ts`

Expected: FAIL because `./load-overview` does not exist.

- [ ] **Step 3: Extract and extend the dashboard loader**

Create `src/features/dashboard/load-overview.ts`:

```ts
import {
  getTeacherAnalytics,
  listTopEarningCourses,
} from "@/features/analytics/queries"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"
import { listRecentTeacherSubscriptions } from "@/features/students/queries"
import type { TeacherSubscription } from "@/features/students/schema"
import type { ApiError } from "@/lib/api/errors"

export type DashboardResult =
  | {
      kind: "ready"
      summary: TeacherAnalytics
      topCourses: TopEarningCourse[]
      recentSubscriptions: TeacherSubscription[] | null
    }
  | { kind: "error"; error: ApiError }
  | { kind: "unauthorized" }

type DashboardFilters = { start?: string; end?: string }

async function loadRecentSubscriptions() {
  try {
    return await listRecentTeacherSubscriptions()
  } catch (error) {
    if (isUnauthorized(error)) throw error
    return null
  }
}

export async function loadDashboardOverview(
  filters: DashboardFilters
): Promise<DashboardResult> {
  try {
    const [summary, topCourses, recentSubscriptions] = await Promise.all([
      getTeacherAnalytics(filters),
      listTopEarningCourses({ ...filters, limit: 5 }),
      loadRecentSubscriptions(),
    ])
    return { kind: "ready", summary, topCourses, recentSubscriptions }
  } catch (error) {
    if (isUnauthorized(error)) return { kind: "unauthorized" }
    const apiError = error as Error & {
      type?: ApiError["type"]
      status?: number
    }
    return {
      kind: "error",
      error: {
        type: apiError.type ?? "Upstream",
        status: apiError.status ?? 0,
        message: apiError.message ?? "Error",
      } as ApiError,
    }
  }
}

function isUnauthorized(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
  )
}
```

Replace the local `DashboardResult` and `loadOverview` in the dashboard page with an import of `loadDashboardOverview`, then pass `result.recentSubscriptions` to `Overview`.

- [ ] **Step 4: Thread records through Overview and TeacherAnalyticsView**

Add required `recentSubscriptions: TeacherSubscription[] | null` props to both components. `Overview` passes the value unchanged. Import and render the feed after the top-courses card in `TeacherAnalyticsView`:

```tsx
<RecentSubscriptions subscriptions={recentSubscriptions} />
```

Because this prop comes from the initial server load and is not part of `analyticsQuery.data`, applying or resetting the date filter must not replace it.

- [ ] **Step 5: Extend the existing view tests**

Mock `RecentSubscriptions` in `teacher-analytics-view.test.tsx`:

```tsx
vi.mock("@/features/dashboard/components/recent-subscriptions", () => ({
  RecentSubscriptions: ({
    subscriptions,
  }: {
    subscriptions: TeacherSubscription[] | null
  }) => (
    <div data-testid="recent-subscriptions">
      {subscriptions === null
        ? "recent-unavailable"
        : subscriptions.map((item) => item.student_name).join(",")}
    </div>
  ),
}))

const recentSubscriptions: TeacherSubscription[] = [
  {
    enrollment_id: 17,
    purchased_at: "2026-09-21T10:00:00Z",
    expires_at: "2027-09-21T10:00:00Z",
    payment_status: "completed",
    total_paid: 250,
    currency: "EGP",
    student_id: 4,
    student_name: "Mona Ali",
    student_email: "mona@example.com",
    course: { id: 8, title: "Physics", price: 250 },
  },
]
```

Import `TeacherSubscription` and pass `recentSubscriptions={recentSubscriptions}` to every `TeacherAnalyticsView` render.

Add a filter-independence test:

```tsx
it("keeps recent subscriptions unchanged when analytics filters update", async () => {
  getTeacherAnalyticsAction.mockResolvedValue({
    summary: filteredSummary,
    topCourses: filteredTopCourses,
  })
  renderWithQuery(
    <TeacherAnalyticsView
      summary={summary}
      topCourses={topCourses}
      filters={{}}
      recentSubscriptions={recentSubscriptions}
    />
  )

  expect(screen.getByTestId("recent-subscriptions").textContent).toBe("Mona Ali")
  const props = mockDateRangeFilterForm.mock.calls[0][0]
  props.onApply!({ start: "2025-01-01", end: "2025-01-31" })

  await waitFor(() => expect(screen.getByText("Physics 101")).toBeDefined())
  expect(screen.getByTestId("recent-subscriptions").textContent).toBe("Mona Ali")
})
```

Add an unavailable-state test rendering the standard analytics fixtures with `recentSubscriptions={null}` and asserting:

```tsx
expect(screen.getByTestId("recent-subscriptions").textContent).toBe(
  "recent-unavailable"
)
```

- [ ] **Step 6: Run focused integration tests**

Run: `npm test -- src/features/dashboard/load-overview.test.ts src/features/analytics/components/teacher-analytics-view.test.tsx`

Expected: PASS for ready, secondary failure, unauthorized, analytics error, filter independence, and unavailable rendering.

- [ ] **Step 7: Run project verification**

Run: `npm run lint -- src/features/students/queries.ts src/features/students/queries.test.ts src/features/dashboard/load-overview.ts src/features/dashboard/load-overview.test.ts src/features/dashboard/components/recent-subscriptions.tsx src/features/dashboard/components/recent-subscriptions.test.tsx src/features/dashboard/components/overview.tsx src/features/analytics/components/teacher-analytics-view.tsx src/features/analytics/components/teacher-analytics-view.test.tsx "app/[locale]/(teacher)/dashboard/page.tsx"`

Expected: exit code 0.

Run: `npm test`

Expected: all test files pass. The existing `localStorage` experimental warnings may still appear.

Run: `npm run typecheck`

Expected: no new errors in changed files. The repository currently reports seven pre-existing missing PNG/WebP module declaration errors in auth, shell, and student-preview files.

- [ ] **Step 8: Commit dashboard integration**

```bash
git add src/features/dashboard/load-overview.ts src/features/dashboard/load-overview.test.ts "app/[locale]/(teacher)/dashboard/page.tsx" src/features/dashboard/components/overview.tsx src/features/analytics/components/teacher-analytics-view.tsx src/features/analytics/components/teacher-analytics-view.test.tsx
git commit -m "feat: show recent subscriptions on dashboard"
```
