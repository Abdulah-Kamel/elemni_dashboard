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
