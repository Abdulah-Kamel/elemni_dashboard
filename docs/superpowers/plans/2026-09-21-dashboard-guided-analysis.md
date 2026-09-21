# Dashboard Guided Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two textual analysis cards to the teacher dashboard that explain business performance and portfolio health from the existing filtered analytics response.

**Architecture:** A pure analytics module derives nullable ratios and averages from the existing API models. A focused presentational component formats and localizes those values, while `TeacherAnalyticsView` passes the same query result already used by its KPI cards and top-courses table so every section stays synchronized.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, TypeScript, next-intl 4.13.2, Tailwind CSS, shadcn `Card`, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-09-21-dashboard-guided-analysis-design.md`

## Global Constraints

- Use only the existing teacher analytics and top-course responses; add no endpoint or response field.
- Keep the existing date filter, five KPI cards, and top-earning-courses table.
- Do not claim trends, growth, decline, benchmarks, forecasts, recommendations, or prior-period comparisons.
- Do not assign qualitative statuses such as "strong," "healthy," or "needs attention."
- Render localized "Not enough data" copy whenever a denominator is zero or top-course data is absent.
- Preserve existing dashboard visual tokens, logical layout utilities, RTL behavior, and locale-aware formatting.
- Do not modify or discard unrelated worktree changes, especially concurrent edits in `src/i18n/messages/ar.json` and `src/i18n/messages/en.json`.

---

### Task 1: Derive Guided Analysis Metrics

**Files:**
- Create: `src/features/analytics/guided-analysis.ts`
- Test: `src/features/analytics/guided-analysis.test.ts`

**Interfaces:**
- Consumes: `TeacherAnalytics` and `TopEarningCourse[]` from `src/features/analytics/schema.ts`.
- Produces: `deriveGuidedAnalysis(summary, topCourses): GuidedAnalysis`, where every division-based metric is `number | null`.

- [ ] **Step 1: Write the failing derivation tests**

Create `src/features/analytics/guided-analysis.test.ts` with representative and zero-data cases:

```ts
import { describe, expect, it } from "vitest"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"
import { deriveGuidedAnalysis } from "./guided-analysis"

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

const topCourses: TopEarningCourse[] = [
  {
    id: 1,
    title: "Physics",
    name: "Physics",
    price: 100,
    earning_amount: 450,
    total_earnings: 450,
    student_subscription_count: 4,
    subscribed_students_count: 4,
  },
  {
    id: 2,
    title: "Math",
    name: "Math",
    price: 80,
    earning_amount: 300,
    total_earnings: 300,
    student_subscription_count: 3,
    subscribed_students_count: 3,
  },
]

describe("deriveGuidedAnalysis", () => {
  it("derives factual metrics from the current response", () => {
    expect(deriveGuidedAnalysis(summary, topCourses)).toEqual({
      teacherShare: 0.75,
      earningsPerSubscription: 100,
      activeCourseRatio: 0.75,
      topCourseConcentration: 0.5,
      activeCourses: 3,
      archivedCourses: 1,
    })
  })

  it("uses the highest course earning even if input order changes", () => {
    expect(
      deriveGuidedAnalysis(summary, [...topCourses].reverse())
        .topCourseConcentration
    ).toBe(0.5)
  })

  it("returns null instead of non-finite values when data is insufficient", () => {
    const emptySummary: TeacherAnalytics = {
      ...summary,
      total_earnings: 0,
      total_revenue: 0,
      subscription_count: 0,
      active_courses_count: 0,
      archived_courses_count: 0,
      archieved_courses_count: 0,
    }

    expect(deriveGuidedAnalysis(emptySummary, [])).toEqual({
      teacherShare: null,
      earningsPerSubscription: null,
      activeCourseRatio: null,
      topCourseConcentration: null,
      activeCourses: 0,
      archivedCourses: 0,
    })
  })
})
```

- [ ] **Step 2: Run the tests and verify the missing-module failure**

Run: `npm test -- src/features/analytics/guided-analysis.test.ts`

Expected: FAIL because `./guided-analysis` does not exist.

- [ ] **Step 3: Implement the pure derivation module**

Create `src/features/analytics/guided-analysis.ts`:

```ts
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"

export type GuidedAnalysis = {
  teacherShare: number | null
  earningsPerSubscription: number | null
  activeCourseRatio: number | null
  topCourseConcentration: number | null
  activeCourses: number
  archivedCourses: number
}

function divideOrNull(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null
}

export function deriveGuidedAnalysis(
  summary: TeacherAnalytics,
  topCourses: TopEarningCourse[]
): GuidedAnalysis {
  const courseCount =
    summary.active_courses_count + summary.archived_courses_count
  const leadingCourseEarnings = topCourses.reduce(
    (highest, course) => Math.max(highest, course.earning_amount),
    0
  )

  return {
    teacherShare: divideOrNull(
      summary.total_earnings,
      summary.total_revenue
    ),
    earningsPerSubscription: divideOrNull(
      summary.total_earnings,
      summary.subscription_count
    ),
    activeCourseRatio: divideOrNull(
      summary.active_courses_count,
      courseCount
    ),
    topCourseConcentration:
      topCourses.length > 0
        ? divideOrNull(leadingCourseEarnings, summary.total_earnings)
        : null,
    activeCourses: summary.active_courses_count,
    archivedCourses: summary.archived_courses_count,
  }
}
```

- [ ] **Step 4: Run the derivation tests**

Run: `npm test -- src/features/analytics/guided-analysis.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit the metric derivation**

```bash
git add src/features/analytics/guided-analysis.ts src/features/analytics/guided-analysis.test.ts
git commit -m "feat: derive dashboard analysis metrics"
```

---

### Task 2: Render Localized Guided Analysis Cards

**Files:**
- Create: `src/features/analytics/components/guided-analysis.tsx`
- Create: `src/features/analytics/components/guided-analysis.test.tsx`
- Modify: `src/i18n/messages/en.json:182-216`
- Modify: `src/i18n/messages/ar.json:182-216`
- Test: `tests/unit/i18n-parity.test.ts`

**Interfaces:**
- Consumes: `summary: TeacherAnalytics`, `topCourses: TopEarningCourse[]`, and `currency: string`.
- Produces: `GuidedAnalysisSection`, a semantic two-card section using `deriveGuidedAnalysis` and next-intl namespace `analytics.analysis`.

- [ ] **Step 1: Write failing component tests**

Create `src/features/analytics/components/guided-analysis.test.tsx`. Mock `useLocale` as `en` and map these translation keys: `title`, `subtitle`, `business.title`, `business.teacher_share`, `business.teacher_share_description`, `business.earnings_per_subscription`, `business.earnings_per_subscription_description`, `portfolio.title`, `portfolio.active_ratio`, `portfolio.active_ratio_description`, `portfolio.top_course_concentration`, `portfolio.top_course_concentration_description`, and `unavailable`.

The translation mock must interpolate named values:

```tsx
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () =>
    (key: string, values?: Record<string, string | number>) => {
      const messages: Record<string, string> = {
        title: "Performance analysis",
        subtitle: "What the selected period shows.",
        "business.title": "Business performance",
        "business.teacher_share": "Teacher share",
        "business.teacher_share_description":
          "Teacher earnings account for {value} of gross revenue.",
        "business.earnings_per_subscription": "Earnings per subscription",
        "business.earnings_per_subscription_description":
          "Average teacher earnings were {value} per subscription.",
        "portfolio.title": "Portfolio health",
        "portfolio.active_ratio": "Active-course share",
        "portfolio.active_ratio_description":
          "{active} of {total} courses are active ({value}).",
        "portfolio.top_course_concentration": "Leading-course share",
        "portfolio.top_course_concentration_description":
          "The leading course accounts for {value} of teacher earnings.",
        unavailable: "Not enough data",
      }
      return (messages[key] ?? key).replace(
        /\{(\w+)\}/g,
        (_, name: string) => String(values?.[name] ?? `{${name}}`)
      )
    },
}))
```

Add one test that renders the Task 1 representative fixture and asserts:

```tsx
expect(screen.getByRole("heading", { name: "Performance analysis" })).toBeDefined()
expect(screen.getByRole("heading", { name: "Business performance" })).toBeDefined()
expect(screen.getByRole("heading", { name: "Portfolio health" })).toBeDefined()
expect(screen.getAllByText("75%")).toHaveLength(2)
expect(screen.getAllByText(/100\.00/).length).toBeGreaterThanOrEqual(1)
expect(screen.getByText(/3 of 4 courses are active \(75%\)/)).toBeDefined()
expect(screen.getByText(/leading course accounts for 50%/i)).toBeDefined()
```

Add a second test with zero totals and no courses that expects four occurrences of `Not enough data` and asserts that the rendered text contains neither `NaN` nor `Infinity`.

- [ ] **Step 2: Run the component test and verify the missing-component failure**

Run: `npm test -- src/features/analytics/components/guided-analysis.test.tsx`

Expected: FAIL because `./guided-analysis` does not exist.

- [ ] **Step 3: Implement the semantic two-card component**

Create `src/features/analytics/components/guided-analysis.tsx` with:

```tsx
"use client"

import { useLocale, useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { deriveGuidedAnalysis } from "@/features/analytics/guided-analysis"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"

type Props = {
  summary: TeacherAnalytics
  topCourses: TopEarningCourse[]
  currency: string
}

export function GuidedAnalysisSection({
  summary,
  topCourses,
  currency,
}: Props) {
  const t = useTranslations("analytics.analysis")
  const locale = useLocale()
  const analysis = deriveGuidedAnalysis(summary, topCourses)
  const courseTotal = analysis.activeCourses + analysis.archivedCourses
  const unavailable = t("unavailable")
  const teacherShare = formatPercent(analysis.teacherShare, locale, unavailable)
  const averageEarnings = formatMoney(
    analysis.earningsPerSubscription,
    locale,
    currency,
    unavailable
  )
  const activeRatio = formatPercent(
    analysis.activeCourseRatio,
    locale,
    unavailable
  )
  const concentration = formatPercent(
    analysis.topCourseConcentration,
    locale,
    unavailable
  )

  return (
    <section aria-labelledby="guided-analysis-title" className="space-y-md">
      <div>
        <h2 id="guided-analysis-title" className="text-title-lg font-semibold text-foreground">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-on-surface-muted">{t("subtitle")}</p>
      </div>

      <div className="grid gap-md lg:grid-cols-2">
        <Card className="rounded-2xl border border-border p-md shadow-xs">
          <h3 className="text-title-md font-semibold text-foreground">
            {t("business.title")}
          </h3>
          <dl className="mt-4 space-y-4">
            <AnalysisItem
              label={t("business.teacher_share")}
              value={teacherShare}
              description={
                analysis.teacherShare === null
                  ? ""
                  : t("business.teacher_share_description", { value: teacherShare })
              }
            />
            <AnalysisItem
              label={t("business.earnings_per_subscription")}
              value={averageEarnings}
              description={
                analysis.earningsPerSubscription === null
                  ? ""
                  : t("business.earnings_per_subscription_description", {
                      value: averageEarnings,
                    })
              }
            />
          </dl>
        </Card>

        <Card className="rounded-2xl border border-border p-md shadow-xs">
          <h3 className="text-title-md font-semibold text-foreground">
            {t("portfolio.title")}
          </h3>
          <dl className="mt-4 space-y-4">
            <AnalysisItem
              label={t("portfolio.active_ratio")}
              value={activeRatio}
              description={
                analysis.activeCourseRatio === null
                  ? ""
                  : t("portfolio.active_ratio_description", {
                      active: analysis.activeCourses,
                      total: courseTotal,
                      value: activeRatio,
                    })
              }
            />
            <AnalysisItem
              label={t("portfolio.top_course_concentration")}
              value={concentration}
              description={
                analysis.topCourseConcentration === null
                  ? ""
                  : t("portfolio.top_course_concentration_description", {
                      value: concentration,
                    })
              }
            />
          </dl>
        </Card>
      </div>
    </section>
  )
}

function AnalysisItem({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div>
      <dt className="text-sm font-semibold text-on-surface-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-primary tabular-nums" dir="ltr">
        {value}
      </dd>
      {description ? (
        <p className="mt-1 text-sm text-on-surface-muted">{description}</p>
      ) : null}
    </div>
  )
}

function formatPercent(value: number | null, locale: string, fallback: string) {
  return value === null
    ? fallback
    : new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value)
}

function formatMoney(
  value: number | null,
  locale: string,
  currency: string,
  fallback: string
) {
  return value === null
    ? fallback
    : new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
}
```

- [ ] **Step 4: Add complete English and Arabic messages**

Add this object beside `analytics.stats` in `src/i18n/messages/en.json`:

```json
"analysis": {
  "title": "Performance analysis",
  "subtitle": "What the selected period shows about your teaching business.",
  "business": {
    "title": "Business performance",
    "teacher_share": "Teacher share",
    "teacher_share_description": "Teacher earnings account for {value} of gross revenue in this period.",
    "earnings_per_subscription": "Earnings per subscription",
    "earnings_per_subscription_description": "Average teacher earnings were {value} per completed subscription."
  },
  "portfolio": {
    "title": "Portfolio health",
    "active_ratio": "Active-course share",
    "active_ratio_description": "{active} of {total} courses are active ({value}).",
    "top_course_concentration": "Leading-course share",
    "top_course_concentration_description": "The leading course accounts for {value} of teacher earnings in this period."
  },
  "unavailable": "Not enough data"
}
```

Add the same key structure in `src/i18n/messages/ar.json`:

```json
"analysis": {
  "title": "تحليل الأداء",
  "subtitle": "ما توضحه الفترة المحددة عن نشاطك التعليمي.",
  "business": {
    "title": "أداء النشاط",
    "teacher_share": "حصة المعلم",
    "teacher_share_description": "تمثل أرباح المعلم {value} من إجمالي الإيرادات خلال هذه الفترة.",
    "earnings_per_subscription": "الأرباح لكل اشتراك",
    "earnings_per_subscription_description": "بلغ متوسط أرباح المعلم {value} لكل اشتراك مكتمل."
  },
  "portfolio": {
    "title": "حالة الدورات",
    "active_ratio": "نسبة الدورات النشطة",
    "active_ratio_description": "عدد الدورات النشطة {active} من أصل {total} ({value}).",
    "top_course_concentration": "حصة الدورة الأعلى ربحًا",
    "top_course_concentration_description": "تمثل الدورة الأعلى ربحًا {value} من أرباح المعلم خلال هذه الفترة."
  },
  "unavailable": "لا توجد بيانات كافية"
}
```

- [ ] **Step 5: Run component and translation-parity tests**

Run: `npm test -- src/features/analytics/components/guided-analysis.test.tsx tests/unit/i18n-parity.test.ts`

Expected: PASS with no missing or mismatched translation keys.

- [ ] **Step 6: Commit the analysis component and translations**

Inspect the existing i18n diffs first and stage only this task's merged edits, preserving unrelated changes.

```bash
git add src/features/analytics/components/guided-analysis.tsx src/features/analytics/components/guided-analysis.test.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add guided dashboard analysis cards"
```

---

### Task 3: Integrate Analysis With Filtered Dashboard Data

**Files:**
- Modify: `src/features/analytics/components/teacher-analytics-view.tsx:24-30,74-75,183-205`
- Modify: `src/features/analytics/components/teacher-analytics-view.test.tsx:10-39,86-136,163-326`

**Interfaces:**
- Consumes: `GuidedAnalysisSection({ summary, topCourses, currency })` from Task 2.
- Produces: A dashboard where KPI cards, guided analysis, and the top-courses table all render from `displayedData` and update together after date filtering.

- [ ] **Step 1: Extend the existing view test with failing integration assertions**

Add the Task 2 analysis keys to the existing next-intl mock. Change the mock translator signature to accept interpolation values and perform the same `{name}` replacement used in Task 2.

In `renders initial data from server props`, add:

```tsx
expect(
  screen.getByRole("heading", { name: "Performance analysis" })
).toBeDefined()
expect(screen.getByText(/Teacher earnings account for/)).toBeDefined()
```

Change `filteredSummary.total_earnings` to `360`, `filteredSummary.subscription_count` to `6`, and `filteredTopCourses[0].earning_amount` plus `total_earnings` to `180`. In the apply-filter test, assert after the query settles:

```tsx
expect(screen.getByText(/Teacher earnings account for 60%/)).toBeDefined()
expect(screen.getByText(/Average teacher earnings were/)).toBeDefined()
expect(screen.getByText(/leading course accounts for 50%/i)).toBeDefined()
```

Add a regression test that renders zero totals with an empty course list and expects the existing KPI headings, `Performance analysis`, `Not enough data`, and the top-course empty message to coexist.

- [ ] **Step 2: Run the existing view tests and verify failure**

Run: `npm test -- src/features/analytics/components/teacher-analytics-view.test.tsx`

Expected: FAIL because `TeacherAnalyticsView` does not render `GuidedAnalysisSection`.

- [ ] **Step 3: Integrate the section using the displayed query result**

Import the component in `teacher-analytics-view.tsx`:

```tsx
import { GuidedAnalysisSection } from "@/features/analytics/components/guided-analysis"
```

Render it immediately after the KPI `<section>` and before the top-courses `<Card>`:

```tsx
<GuidedAnalysisSection
  summary={displayedData.summary}
  topCourses={displayedData.topCourses}
  currency={currency}
/>
```

Do not derive from the original `summary` or `topCourses` props; using `displayedData` is what keeps analysis synchronized with applied and reset filters.

- [ ] **Step 4: Run analytics tests**

Run: `npm test -- src/features/analytics/guided-analysis.test.ts src/features/analytics/components/guided-analysis.test.tsx src/features/analytics/components/teacher-analytics-view.test.tsx`

Expected: PASS for derivation, component, filter-update, empty-data, RTL, and existing table-link behavior.

- [ ] **Step 5: Run project verification**

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npm run lint -- src/features/analytics/guided-analysis.ts src/features/analytics/guided-analysis.test.ts src/features/analytics/components/guided-analysis.tsx src/features/analytics/components/guided-analysis.test.tsx src/features/analytics/components/teacher-analytics-view.tsx src/features/analytics/components/teacher-analytics-view.test.tsx`

Expected: exit code 0 with no lint errors in changed TypeScript files.

Run: `npm test -- tests/unit/i18n-parity.test.ts src/features/analytics`

Expected: exit code 0.

- [ ] **Step 6: Commit the integration**

```bash
git add src/features/analytics/components/teacher-analytics-view.tsx src/features/analytics/components/teacher-analytics-view.test.tsx
git commit -m "feat: integrate analysis into teacher dashboard"
```
