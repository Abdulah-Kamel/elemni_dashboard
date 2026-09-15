import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TeacherPaymentsPanel } from "@/features/admin/components/teacher-payments-panel"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  }
})

vi.mock("@/features/billing/actions", () => ({
  listAdminTeacherPaymentsAction: vi.fn(),
  recordTeacherPaymentAction: vi.fn(),
}))

describe("TeacherPaymentsPanel", () => {
  it("shows payment history and a record-payment form for the profile", () => {
    render(<TeacherPaymentsPanel teacherProfileId={3} />)

    expect(screen.getByTestId("teacher-payments-panel")).toBeTruthy()
    expect(screen.getByText("Site Admin")).toBeTruthy()
    expect(screen.getByLabelText("payment_amount")).toBeTruthy()
    expect(screen.getByLabelText("payment_note")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: /record|save|submit/i })
    ).toBeTruthy()
  })
})
