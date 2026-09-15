import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PaymentStatusBadge } from "@/features/billing/components/payment-status-badge"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

describe("PaymentStatusBadge", () => {
  it.each([
    "completed",
    "pending",
    "failed",
    "cancelled",
    "refunded",
    "duplicate_paid",
  ])("renders a label for status %s", (status) => {
    render(<PaymentStatusBadge status={status} />)
    expect(screen.getByTestId(`payment-status-${status}`)).toBeTruthy()
  })
})
