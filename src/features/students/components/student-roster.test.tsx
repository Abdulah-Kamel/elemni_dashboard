import { fireEvent, render, screen, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { messagesFor } from "@/i18n/messages/load"
import { parseStudentQuery } from "@/features/students/roster-model"
import type { TeacherSubscription } from "@/features/students/schema"
import { StudentRoster } from "./student-roster"

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("@formkit/auto-animate/react", () => ({
  useAutoAnimate: () => [null],
}))

const NOW = Date.parse("2026-09-26T12:00:00Z")
const DAY = 24 * 60 * 60 * 1000

function sub(overrides: Partial<TeacherSubscription>): TeacherSubscription {
  return {
    enrollment_id: 1,
    purchased_at: "2026-09-01T10:00:00Z",
    expires_at: new Date(NOW + 60 * DAY).toISOString(),
    payment_status: "completed",
    total_paid: 250,
    currency: "EGP",
    student_id: 1,
    student_name: "Mona Ali",
    student_email: "mona@example.com",
    student_phone: "01000000000",
    course: { id: 8, title: "Physics", price: 250 },
    ...overrides,
  }
}

const subscriptions = [
  sub({}),
  sub({
    enrollment_id: 2,
    course: { id: 9, title: "Chemistry", price: 100 },
    payment_status: "pending",
    purchased_at: "2026-09-10T10:00:00Z",
  }),
  sub({
    enrollment_id: 3,
    student_id: 2,
    student_name: "Omar Said",
    student_email: "omar@example.com",
    purchased_at: "2026-08-01T10:00:00Z",
  }),
]

function renderRoster(search = "") {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesFor("en")}>
      <StudentRoster
        subscriptions={subscriptions}
        courses={[]}
        initialQuery={parseStudentQuery(new URLSearchParams(search))}
        now={NOW}
      />
    </NextIntlClientProvider>
  )
}

function bodyRows() {
  const [, body] = screen.getAllByRole("rowgroup")
  return within(body).getAllByRole("row")
}

describe("StudentRoster", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/en/students")
  })

  it("applies status=pending from the pending tile and writes it to the URL", () => {
    renderRoster()
    expect(bodyRows()).toHaveLength(3)

    const pendingTile = screen.getByRole("button", { name: /Pending subscriptions/i })
    fireEvent.click(pendingTile)

    expect(pendingTile.getAttribute("aria-pressed")).toBe("true")
    expect(bodyRows()).toHaveLength(1)
    expect(window.location.search).toBe("?status=pending")

    // Pressing the applied tile clears it again.
    fireEvent.click(pendingTile)
    expect(bodyRows()).toHaveLength(3)
    expect(window.location.search).toBe("")
  })

  it("honours filters that arrive in the URL", () => {
    renderRoster("course=9")
    expect(bodyRows()).toHaveLength(1)
    expect(within(bodyRows()[0]).getByText("Chemistry")).toBeTruthy()
  })

  it("sorts by a column and exposes aria-sort", () => {
    renderRoster()
    fireEvent.click(screen.getByRole("button", { name: "Student Name" }))
    const header = screen.getByRole("columnheader", { name: "Student Name" })
    expect(header.getAttribute("aria-sort")).toBe("ascending")
    expect(within(bodyRows()[0]).getByText("Mona Ali")).toBeTruthy()
    expect(within(bodyRows()[2]).getByText("Omar Said")).toBeTruthy()
    expect(window.location.search).toBe("?sort=name&dir=asc")
  })

  it("opens the student panel with every subscription for that student", () => {
    renderRoster()
    fireEvent.click(screen.getAllByRole("button", { name: "View details for Mona Ali" })[0])

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Mona Ali")).toBeTruthy()
    expect(within(dialog).getByText("Physics")).toBeTruthy()
    expect(within(dialog).getByText("Chemistry")).toBeTruthy()
    expect(within(dialog).getByText("mona@example.com")).toBeTruthy()
    expect(window.location.search).toBe("?student=1")
  })
})
