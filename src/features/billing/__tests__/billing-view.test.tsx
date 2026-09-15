import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { BillingView } from "@/features/billing/components/billing-view"
import type { PaginatedTeacherPayments } from "@/features/billing/schema"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === "ledger.entries") return `${values?.count ?? 0} entries`
    if (key === "ledger.showing")
      return `Showing ${values?.from}-${values?.to} of ${values?.total}`
    return key
  },
  useLocale: () => "en",
}))

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-query")>()
  return {
    ...actual,
    useQuery: () => ({ data: undefined, isPending: false, isFetching: false }),
  }
})

vi.mock("@/features/billing/actions", () => ({
  getTeacherPaymentsAction: vi.fn(),
}))

const data: PaginatedTeacherPayments = {
  total: 1,
  skip: 0,
  limit: 20,
  total_paid_sum: 150,
  pending_dues: 42.5,
  total_paid: 300,
  items: [
    {
      id: 7,
      teacher_profile_id: 3,
      admin_user_id: 1,
      admin_name: "Site Admin",
      amount: 150,
      note: "Cash received",
      created_at: "2026-09-01T10:00:00+00:00",
      pending_dues: 42.5,
      total_paid: 300,
    },
  ],
}

describe("BillingView", () => {
  it("renders balances, filtered sum, and payment log rows", () => {
    render(<BillingView data={data} filters={{}} locale="en" />)

    expect(screen.getByTestId("billing-pending-dues")).toBeTruthy()
    expect(screen.getByTestId("billing-total-paid")).toBeTruthy()
    expect(screen.getByTestId("billing-filtered-sum")).toBeTruthy()
    expect(screen.getByText("Site Admin")).toBeTruthy()
    expect(screen.getByText("Cash received")).toBeTruthy()
  })
})
