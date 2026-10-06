import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

const grantActions = vi.hoisted(() => ({ listStudentGrants: vi.fn(), listCourseVideos: vi.fn(), createGrant: vi.fn(), revokeGrant: vi.fn() }))
vi.mock("@/features/video-grants/actions", () => grantActions)

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
    vi.clearAllMocks()
    grantActions.listStudentGrants.mockResolvedValue({ success: true, data: [] })
    grantActions.listCourseVideos.mockResolvedValue({ success: true, data: [] })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("advances time so grants and subscriptions expire, and clears its interval on unmount", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
    vi.setSystemTime(NOW)
    const expiresAt = new Date(NOW + 30_000).toISOString()
    grantActions.listStudentGrants.mockResolvedValue({ success: true, data: [{
      id: 9, user_id: 1, item_id: 319, granted_by_id: 2, idempotency_key: "key",
      granted_views: 2, consumed_views: 0, remaining_views: 2, reason: null,
      created_at: new Date(NOW).toISOString(), expires_at: expiresAt, revoked_at: null,
    }] })
    const intervalSpy = vi.spyOn(globalThis, "setInterval")
    const clearSpy = vi.spyOn(globalThis, "clearInterval")
    const { unmount } = render(
      <NextIntlClientProvider locale="en" messages={messagesFor("en")}>
        <StudentRoster subscriptions={[sub({ expires_at: expiresAt })]} courses={[]} initialQuery={parseStudentQuery(new URLSearchParams("student=1"))} now={NOW} />
      </NextIntlClientProvider>
    )
    expect(await screen.findByText("Active")).toBeDefined()
    await screen.findByRole("button", { name: "Grant extra views" })
    expect((screen.getByRole("button", { name: "Grant extra views" }) as HTMLButtonElement).disabled).toBe(false)
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(screen.queryByText("Active")).toBeNull()
    expect(screen.getByText("Expired")).toBeDefined()
    expect((screen.getByRole("button", { name: "Grant extra views" }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText("This student has no active subscription with you.")).toBeDefined()
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000)
    const timer = intervalSpy.mock.results.find((_, index) => intervalSpy.mock.calls[index][1] === 60_000)!.value
    unmount()
    expect(clearSpy).toHaveBeenCalledWith(timer)
    intervalSpy.mockRestore()
    clearSpy.mockRestore()
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
