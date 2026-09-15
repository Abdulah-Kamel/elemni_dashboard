import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SubscriptionsList } from "@/features/admin/components/subscriptions-list"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values?.count != null ? `${key}:${values.count}` : key,
  useLocale: () => "en",
}))

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-query")>()
  return {
    ...actual,
    useQuery: () => ({
      data: {
        total: 1,
        skip: 0,
        limit: 10,
        items: [
          {
            enrollment_id: 11,
            purchased_at: "2026-09-01T10:00:00+00:00",
            expires_at: "2026-10-01T10:00:00+00:00",
            payment_status: "duplicate_paid",
            total_paid: "250.00",
            currency: "EGP",
            student_id: 1,
            student_name: "Student One",
            student_email: "student@example.com",
            course: { id: 12, title: "Calculus" },
          },
        ],
      },
      isLoading: false,
    }),
  }
})

vi.mock("@/features/admin/actions", () => ({
  listSubscriptionsAction: vi.fn(),
}))

describe("SubscriptionsList payment statuses", () => {
  it("uses the shared backend payment status badge for duplicate payments", () => {
    render(<SubscriptionsList />)

    expect(screen.getByTestId("payment-status-duplicate_paid")).toBeTruthy()
  })
})
