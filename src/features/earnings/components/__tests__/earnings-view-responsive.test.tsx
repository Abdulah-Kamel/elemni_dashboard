import { render, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"
import { EarningsView } from "../earnings-view"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      eyebrow: "Activity",
      title: "Earnings",
      subtitle: "Track your earnings",
      pending_dues: "Pending Dues",
      pending_dues_hint: "Hint",
      summary_title: "Summary",
      "summary.filtered_cost": "Total Cost",
      "summary.bandwidth_cost": "Bandwidth Cost",
      "summary.storage_cost": "Storage Cost",
      "summary.storage_now": "Storage Used",
      "units.mb": "MB",
      "units.gb": "GB",
      "units.kb": "KB",
      "units.bytes": "bytes",
      not_available: "N/A",
      "chart.title": "Chart",
      "chart.subtitle": "Chart subtitle",
      "chart.badge": "Last 12",
      "chart.label": "Cost chart",
      "chart.cost": "Cost",
      "ledger.title": "Ledger",
      "ledger.subtitle": "Ledger subtitle",
      "ledger.entries": "Entries",
      "ledger.refreshing": "Refreshing...",
      "ledger.date": "Date",
      "ledger.bandwidth": "Bandwidth",
      "ledger.storage": "Storage",
      "ledger.bandwidth_cost": "Bandwidth Cost",
      "ledger.storage_cost": "Storage Cost",
      "ledger.total": "Total",
      "ledger.caption": "Caption",
      "ledger.showing": "Showing",
      "ledger.rows_per_page": "Rows per page",
      "ledger.all": "All",
      "ledger.pagination": "Pagination",
      "ledger.previous": "Previous",
      "ledger.next": "Next",
      "ledger.refresh_error": "Error",
      "ledger.retry": "Retry",
      "empty.title": "Empty",
      "empty.note": "No data",
      "filters.range": "Date Range",
      "filters.all_time": "All Time",
      "filters.choose": "Choose",
      "filters.dialog_title": "Dialog",
      "filters.dialog_description": "Dialog desc",
      "filters.apply": "Apply",
      "filters.reset": "Reset",
      "filters.cancel": "Cancel",
      "filters.min_cost": "Min Cost",
      "filters.max_cost": "Max Cost",
      "filters.sort": "Sort",
      "filters.sort_date": "Date",
      "filters.sort_cost": "Cost",
      "filters.sort_bandwidth": "Bandwidth",
      "filters.sort_storage": "Storage",
      "filters.order": "Order",
      "filters.desc": "Desc",
      "filters.asc": "Asc",
    }
    return messages[key] ?? key
  },
}))

vi.mock("@/features/analytics/components/date-range-filter-form", () => ({
  DateRangeFilterForm: ({ triggerClassName }: { triggerClassName?: string }) => (
    <button className={triggerClassName} data-testid="date-range-trigger">
      Date Range
    </button>
  ),
}))

vi.mock("@/features/earnings/actions", () => ({
  getTeacherUsageAction: vi.fn().mockResolvedValue({
    items: [
      {
        id: 1,
        teacher_profile_id: 1,
        teacher_name: "Teacher",
        teacher_email: "teacher@test.com",
        teacher_slug: "teacher",
        date: "2026-09-01",
        bandwidth_bytes: 1024,
        storage_bytes: 2048,
        bandwidth_cost_per_gb: 0.5,
        storage_cost_per_gb_monthly: 0.3,
        bandwidth_cost_amount: 5.0,
        storage_cost_amount: 3.0,
        cost_amount: 8.0,
        created_at: "2026-09-01T00:00:00Z",
      },
    ],
    total: 1,
    skip: 0,
    limit: 10,
    summary: {
      total_bandwidth_bytes: 1024,
      total_storage_bytes: 2048,
      total_bandwidth_cost: 5.0,
      total_storage_cost: 3.0,
      total_cost: 8.0,
      log_count: 1,
      pending_dues: 0,
      storage_used_mb: 2.0,
    },
  }),
}))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const data = {
  items: [
    {
      id: 1,
      teacher_profile_id: 1,
      teacher_name: "Teacher",
      teacher_email: "teacher@test.com",
      teacher_slug: "teacher",
      date: "2026-09-01",
      bandwidth_bytes: 1024,
      storage_bytes: 2048,
      bandwidth_cost_per_gb: 0.5,
      storage_cost_per_gb_monthly: 0.3,
      bandwidth_cost_amount: 5.0,
      storage_cost_amount: 3.0,
      cost_amount: 8.0,
      created_at: "2026-09-01T00:00:00Z",
    },
  ],
  total: 1,
  skip: 0,
  limit: 10,
  summary: {
    total_bandwidth_bytes: 1024,
    total_storage_bytes: 2048,
    total_bandwidth_cost: 5.0,
    total_storage_cost: 3.0,
    total_cost: 8.0,
    log_count: 1,
    pending_dues: 0,
    storage_used_mb: 2.0,
  },
}

const filters = {
  startDate: undefined,
  endDate: undefined,
  minCost: undefined,
  maxCost: undefined,
  sortBy: "date" as const,
  sortOrder: "desc" as const,
  skip: 0,
  limit: 10 as const,
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe("EarningsView responsive", () => {
  it("renders ledger table inside a scrollable container", async () => {
    renderWithProviders(<EarningsView data={data} filters={filters} locale="en" />)

    await waitFor(() => {
      const tableContainer = document.querySelector('[data-slot="table-container"]')
      expect(tableContainer).toBeTruthy()
      expect(tableContainer?.className).toContain("overflow-x-auto")
    })
  })

  it("applies min-width to the ledger table", async () => {
    renderWithProviders(<EarningsView data={data} filters={filters} locale="en" />)

    await waitFor(() => {
      const table = document.querySelector("table")
      expect(table?.className).toContain("min-w-[42rem]")
    })
  })

  it("stacks filter grid cleanly on small screens", () => {
    const { container } = renderWithProviders(
      <EarningsView data={data} filters={filters} locale="en" />
    )

    const filterGrid = container.querySelector(".grid.gap-3.border-b")
    expect(filterGrid?.className).toContain("sm:grid-cols-2")
    expect(filterGrid?.className).toContain("xl:grid-cols-")
  })
})
