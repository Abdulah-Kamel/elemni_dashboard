import { render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SubscriptionsList } from "@/features/admin/components/subscriptions-list"

const url = vi.hoisted(() => ({ search: "" }))

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(url.search),
}))

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values?.count != null ? `${key}:${values.count}` : key,
  useLocale: () => "en",
}))

function row(id: number, name: string, amount: string, status = "completed") {
  return {
    enrollment_id: id,
    purchased_at: `2026-09-0${id}T10:00:00+00:00`,
    expires_at: "2026-10-01T10:00:00+00:00",
    payment_status: status,
    total_paid: amount,
    currency: "EGP",
    student_id: id,
    student_name: name,
    student_email: `s${id}@example.com`,
    course: { id: 12, title: "Calculus" },
  }
}

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-query")>()
  return {
    ...actual,
    useQuery: () => ({
      data: {
        total: 3,
        skip: 0,
        limit: 10,
        items: [
          row(1, "Student One", "250.00", "duplicate_paid"),
          row(2, "Student Two", "1200.00"),
          row(3, "Student Three", "90.50"),
        ],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      isPlaceholderData: false,
    }),
  }
})

vi.mock("@/features/admin/actions", () => ({
  listSubscriptionsAction: vi.fn(),
}))

function studentOrder() {
  const table = screen.getByRole("table")
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((tr) => within(tr).getAllByRole("button")[0].textContent)
}

describe("SubscriptionsList", () => {
  beforeEach(() => {
    url.search = ""
  })

  it("uses the shared backend payment status badge for duplicate payments", () => {
    render(<SubscriptionsList />)

    expect(screen.getAllByTestId("payment-status-duplicate_paid").length).toBeGreaterThan(0)
  })

  it("sorts by amount from the URL and exposes aria-sort on the header", () => {
    url.search = "sort=amount&dir=desc"
    render(<SubscriptionsList />)

    expect(studentOrder()).toEqual(["Student Two", "Student One", "Student Three"])
    const amountHeader = screen.getByRole("columnheader", { name: /table_amount/ })
    expect(amountHeader.getAttribute("aria-sort")).toBe("descending")
    expect(screen.getByRole("columnheader", { name: /table_student/ }).getAttribute("aria-sort")).toBe("none")
  })

  it("marks the status filter from the URL as pressed", () => {
    url.search = "status=failed"
    render(<SubscriptionsList />)

    expect(screen.getByRole("button", { name: "payment_failed" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("button", { name: "payment_completed" }).getAttribute("aria-pressed")).toBe("false")
  })
})
