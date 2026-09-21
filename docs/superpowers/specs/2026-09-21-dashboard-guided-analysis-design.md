# Dashboard Guided Analysis Design

## Goal

Enhance the teacher dashboard with useful analysis instead of charts. The dashboard should explain the existing analytics data in actionable, evidence-based language without requiring new backend endpoints.

## Scope

Keep the existing date filter, five KPI cards, and top-earning-courses table. Add a guided-analysis section between the KPI cards and the table.

The feature uses only the existing teacher analytics and top-course responses. It must not claim trends, growth, decline, benchmarks, or prior-period comparisons because the API does not provide evidence for those conclusions.

## Layout

The guided-analysis section contains two responsive cards:

1. **Business performance** explains the relationship between gross revenue, teacher earnings, and subscriptions.
2. **Portfolio health** explains the balance of active and archived courses and the concentration of earnings in the leading course.

Each card presents supporting metrics and a concise factual interpretation. The cards appear side by side when space permits and stack on smaller screens. Existing visual tokens, RTL behavior, and dashboard card patterns remain unchanged.

## Derived Metrics

All calculations use the currently displayed, date-filtered response:

- **Teacher share:** `total_earnings / total_revenue`
- **Earnings per subscription:** `total_earnings / subscription_count`
- **Active-course ratio:** `active_courses_count / (active_courses_count + archived_courses_count)`
- **Top-course concentration:** highest `earning_amount` in `topCourses` divided by `total_earnings`

Ratios display as localized percentages. Monetary values use the dashboard's existing locale-aware EGP formatting.

## Interpretation Rules

Interpretations describe only the current filtered period:

- Teacher share states that teacher earnings account for the calculated percentage of gross revenue.
- Earnings per subscription states the calculated average for the selected period.
- Portfolio mix states the active and archived counts and the calculated active-course percentage.
- Top-course concentration states that the leading course accounts for the calculated percentage of teacher earnings.

The interface must not assign qualitative statuses such as "strong," "healthy," or "needs attention." Those labels require business rules or benchmarks that the API does not provide.

## Data Flow

`TeacherAnalyticsView` derives the analysis from `analyticsQuery.data`, falling back to its existing server-provided initial data. Applying or resetting a date filter updates the query, KPI cards, analysis cards, and top-courses table from the same response.

No additional request, persistence, or backend contract is introduced. Derived analysis should remain in a focused presentation component or pure calculation functions so the rules can be tested independently.

## Empty And Error States

- If a denominator is zero, display localized "Not enough data" copy instead of a percentage, infinity, or `NaN`.
- If there are no top courses or total earnings are zero, top-course concentration is unavailable.
- If all course counts are zero, the active-course ratio is unavailable.
- Existing page-level API error handling remains authoritative. The analysis section must not fabricate fallback business data.
- While a date-filter request retains previous data, the existing query behavior remains unchanged; all displayed sections continue to represent one consistent response.

## Localization And Accessibility

- Add complete Arabic and English copy for titles, metric labels, interpretations, and unavailable-data messages.
- Use semantic section headings and descriptive text; do not encode meaning through color alone.
- Preserve logical layout utilities and correct RTL ordering.
- Derived numbers use tabular numerals and locale-aware formatting.
- Analysis remains readable without JavaScript-generated graphics or chart accessibility fallbacks.

## Testing

Tests cover:

- Derived calculations for representative values.
- Zero denominators and missing top-course data.
- Recalculation after a date-filter query returns new data.
- Arabic and English rendering, including RTL-compatible layout.
- Semantic section headings and visible textual interpretations.
- Regression coverage confirming the existing KPI cards and top-courses table remain present.

## Out Of Scope

- Charts or chart-library changes.
- New analytics endpoints or response fields.
- Historical comparisons, forecasts, recommendations, or AI-generated analysis.
- Changes to the dashboard navigation, date-filter behavior, KPI definitions, or top-courses table.
