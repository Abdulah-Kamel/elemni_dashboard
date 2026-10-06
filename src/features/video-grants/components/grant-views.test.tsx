import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/en.json"
import { toStudentRow } from "@/features/students/roster-model"
import type { Grant } from "../schema"
import { GrantViewsSection } from "./grant-views-section"

const a = vi.hoisted(() => ({
  listStudentGrants: vi.fn(),
  listCourseVideos: vi.fn(),
  createGrant: vi.fn(),
  revokeGrant: vi.fn(),
}))
vi.mock("@/features/video-grants/actions", () => a)
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const now = Date.parse("2026-10-06T12:00:00Z")
const subscription = toStudentRow({
  enrollment_id: 1,
  student_id: 5,
  student_name: "Maya",
  student_email: "maya@example.com",
  student_phone: null,
  purchased_at: "2026-09-01T00:00:00Z",
  expires_at: "2027-01-01T00:00:00Z",
  payment_status: "completed",
  total_paid: 100,
  currency: "EGP",
  course: { id: 57, title: "Physics", price: 100 },
})
const videos = [
  { item_id: 319, title: "Lecture 1", lesson_title: "L", max_watch_count: 1 },
]
function grant(overrides: Partial<Grant> = {}): Grant {
  return {
    id: 9,
    user_id: 5,
    item_id: 319,
    granted_by_id: 1,
    idempotency_key: "key",
    granted_views: 3,
    consumed_views: 1,
    remaining_views: 2,
    reason: "Revision",
    created_at: "2026-10-01T00:00:00Z",
    expires_at: null,
    revoked_at: null,
    ...overrides,
  }
}
function renderSection(subscriptions = [subscription], grants: Grant[] = []) {
  a.listStudentGrants.mockResolvedValue({ success: true, data: grants })
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GrantViewsSection
        studentId={5}
        subscriptions={subscriptions}
        now={now}
      />
    </NextIntlClientProvider>
  )
}
async function openForm() {
  const button = await screen.findByRole("button", {
    name: "Grant extra views",
  })
  await waitFor(() =>
    expect((button as HTMLButtonElement).disabled).toBe(false)
  )
  fireEvent.click(button)
  const dialog = await screen.findByRole("dialog")
  fireEvent.click(within(dialog).getByRole("combobox", { name: "Course" }))
  fireEvent.click(await screen.findByRole("option", { name: "Physics" }))
  fireEvent.click(within(dialog).getByRole("combobox", { name: "Video" }))
  fireEvent.click(await screen.findByRole("option", { name: /Lecture 1/ }))
  return dialog
}
function submit(dialog: HTMLElement) {
  fireEvent.click(within(dialog).getByRole("button", { name: "Grant" }))
}

beforeEach(() => {
  vi.resetAllMocks()
  a.listCourseVideos.mockResolvedValue({ success: true, data: videos })
  a.createGrant.mockResolvedValue({ success: true, data: grant() })
  a.revokeGrant.mockResolvedValue({ success: true, data: null })
})

describe("GrantViewsSection", () => {
  it("disables granting without an active subscription", async () => {
    renderSection([{ ...subscription, expiresAt: "2026-01-01T00:00:00Z" }])
    expect(
      (
        screen.getByRole("button", {
          name: "Grant extra views",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(
      screen.getByText("This student has no active subscription with you.")
    ).toBeDefined()
    await screen.findByText("No extra views granted yet.")
    expect(a.listCourseVideos).not.toHaveBeenCalled()
  })
  it.each([
    ["Revoked", { revoked_at: "2026-10-01T00:00:00Z" }],
    ["Expired", { expires_at: "2026-01-01T00:00:00Z" }],
  ] as const)(
    "shows used views instead of remaining views for %s grants",
    async (status, dates) => {
      renderSection(
        [subscription],
        [
          grant({
            granted_views: 2,
            consumed_views: 0,
            remaining_views: 2,
            ...dates,
          }),
        ]
      )
      const chip = await screen.findByText(status)
      const row = within(chip.closest("li")!)
      expect(row.getByText("0 of 2 used")).toBeDefined()
      expect(row.queryByText("2 of 2 left")).toBeNull()
      expect(row.queryByRole("button", { name: "Revoke" })).toBeNull()
    }
  )
  it("pre-selects the only eligible course and immediately makes its videos available", async () => {
    renderSection([
      subscription,
      {
        ...subscription,
        enrollmentId: 2,
        courseId: 58,
        course: "Expired course",
        expiresAt: "2026-01-01T00:00:00Z",
      },
      {
        ...subscription,
        enrollmentId: 3,
        courseId: 59,
        course: "Pending course",
        status: "pending",
      },
    ])
    const button = screen.getByRole("button", { name: "Grant extra views" })
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false)
    )
    fireEvent.click(button)
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByRole("combobox", { name: "Course" }).textContent
    ).toContain("Physics")
    expect(a.listCourseVideos).toHaveBeenCalledExactlyOnceWith(57)
    const videoSelect = within(dialog).getByRole("combobox", { name: "Video" })
    expect((videoSelect as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(videoSelect)
    fireEvent.click(await screen.findByRole("option", { name: /Lecture 1/ }))
    submit(dialog)
    await waitFor(() =>
      expect(a.createGrant).toHaveBeenCalledWith(
        { user_id: 5, item_id: 319, granted_views: 1 },
        expect.any(String)
      )
    )
  })
  it("grants views and refreshes the list", async () => {
    renderSection()
    const dialog = await openForm()
    fireEvent.change(
      within(dialog).getByRole("spinbutton", { name: "Extra views" }),
      { target: { value: "2" } }
    )
    submit(dialog)
    await waitFor(() =>
      expect(a.createGrant).toHaveBeenCalledWith(
        { user_id: 5, item_id: 319, granted_views: 2 },
        expect.any(String)
      )
    )
    await waitFor(() => expect(a.listStudentGrants).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })
  it("reuses the idempotency key on retry", async () => {
    a.createGrant
      .mockResolvedValueOnce({ success: false, code: "unknown" })
      .mockResolvedValue({ success: true, data: grant() })
    renderSection()
    const dialog = await openForm()
    submit(dialog)
    await screen.findByText(
      "Something went wrong on our side. Try again in a moment."
    )
    submit(dialog)
    await waitFor(() => expect(a.createGrant).toHaveBeenCalledTimes(2))
    expect(a.createGrant.mock.calls[0][1]).toBe(a.createGrant.mock.calls[1][1])
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    submit(await openForm())
    await waitFor(() => expect(a.createGrant).toHaveBeenCalledTimes(3))
    expect(a.createGrant.mock.calls[2][1]).not.toBe(
      a.createGrant.mock.calls[0][1]
    )
  })
  it("reuses the pending key after a lost response, cancel and reopen with the same payload", async () => {
    a.createGrant.mockResolvedValueOnce({ success: false, code: "unknown" })
    renderSection()
    function fillDetails(dialog: HTMLElement) {
      fireEvent.change(within(dialog).getByRole("spinbutton"), {
        target: { value: "2" },
      })
      fireEvent.change(
        within(dialog).getByRole("textbox", { name: "Reason (optional)" }),
        { target: { value: "Revision" } }
      )
      fireEvent.change(within(dialog).getByLabelText("Expires on (optional)"), {
        target: { value: "2027-01-01" },
      })
    }
    let dialog = await openForm()
    fillDetails(dialog)
    submit(dialog)
    await screen.findByText(
      "Something went wrong on our side. Try again in a moment."
    )
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    dialog = await openForm()
    fillDetails(dialog)
    submit(dialog)
    await waitFor(() => expect(a.createGrant).toHaveBeenCalledTimes(2))
    expect(a.createGrant.mock.calls[1][0]).toEqual(
      a.createGrant.mock.calls[0][0]
    )
    expect(a.createGrant.mock.calls[1][1]).toBe(a.createGrant.mock.calls[0][1])
  })
  it.each(["views", "reason", "expiry", "video"])(
    "uses a new key when the pending payload changes: %s",
    async (field) => {
      a.createGrant.mockResolvedValue({ success: false, code: "unknown" })
      a.listCourseVideos.mockResolvedValue({
        success: true,
        data: [...videos, { ...videos[0], item_id: 320, title: "Lecture 2" }],
      })
      renderSection()
      const dialog = await openForm()
      submit(dialog)
      await screen.findByText(
        "Something went wrong on our side. Try again in a moment."
      )
      if (field === "views")
        fireEvent.change(within(dialog).getByRole("spinbutton"), {
          target: { value: "2" },
        })
      if (field === "reason")
        fireEvent.change(
          within(dialog).getByRole("textbox", { name: "Reason (optional)" }),
          { target: { value: "Revision" } }
        )
      if (field === "expiry")
        fireEvent.change(
          within(dialog).getByLabelText("Expires on (optional)"),
          { target: { value: "2027-01-01" } }
        )
      if (field === "video") {
        fireEvent.click(within(dialog).getByRole("combobox", { name: "Video" }))
        const option = await screen.findByRole("option", { name: /Lecture 2/ })
        fireEvent.pointerDown(option, { pointerType: "mouse" })
        fireEvent.click(option)
        expect(
          within(dialog).getByRole("combobox", { name: "Video" }).textContent
        ).toContain("Lecture 2")
      }
      submit(dialog)
      await waitFor(() => expect(a.createGrant).toHaveBeenCalledTimes(2))
      expect(a.createGrant.mock.calls[1][0]).not.toEqual(
        a.createGrant.mock.calls[0][0]
      )
      expect(a.createGrant.mock.calls[1][1]).not.toBe(
        a.createGrant.mock.calls[0][1]
      )
      await waitFor(() =>
        expect(
          (
            within(dialog).getByRole("button", {
              name: "Grant",
            }) as HTMLButtonElement
          ).disabled
        ).toBe(false)
      )
      submit(dialog)
      await waitFor(() => expect(a.createGrant).toHaveBeenCalledTimes(3))
      expect(a.createGrant.mock.calls[2][1]).toBe(
        a.createGrant.mock.calls[1][1]
      )
    }
  )
  it("refetches grants after an unknown create failure without resetting the form", async () => {
    a.createGrant.mockResolvedValue({ success: false, code: "unknown" })
    renderSection()
    const dialog = await openForm()
    a.listStudentGrants.mockResolvedValue({
      success: true,
      data: [grant({ reason: "Committed despite the lost response" })],
    })
    fireEvent.change(within(dialog).getByRole("spinbutton"), {
      target: { value: "2" },
    })
    submit(dialog)
    await screen.findByText(
      "Something went wrong on our side. Try again in a moment."
    )
    await waitFor(() => expect(a.listStudentGrants).toHaveBeenCalledTimes(2))
    expect(
      await screen.findByText("Committed despite the lost response")
    ).toBeDefined()
    expect(screen.getByRole("dialog")).toBe(dialog)
    expect(
      (within(dialog).getByRole("spinbutton") as HTMLInputElement).value
    ).toBe("2")
  })
  it("shows the enrolment error inline and keeps the form", async () => {
    a.createGrant.mockResolvedValue({ success: false, code: "not_enrolled" })
    renderSection()
    const dialog = await openForm()
    submit(dialog)
    expect(
      await screen.findByText(
        "This student has no active subscription to this course."
      )
    ).toBeDefined()
    expect(screen.getByRole("dialog")).toBe(dialog)
    expect(
      (within(dialog).getByRole("spinbutton") as HTMLInputElement).value
    ).toBe("1")
  })
  it("falls back to the item id when a title is unknown", async () => {
    renderSection([subscription], [grant({ item_id: 999 })])
    expect(await screen.findByText("Video #999")).toBeDefined()
  })
  it("shows status chips and revokes an active grant after confirmation", async () => {
    renderSection(
      [subscription],
      [
        grant(),
        grant({ id: 10, expires_at: "2026-01-01T00:00:00Z" }),
        grant({
          id: 11,
          revoked_at: "2026-10-01T00:00:00Z",
          remaining_views: 0,
        }),
        grant({ id: 12, remaining_views: 0 }),
      ]
    )
    for (const status of ["Active", "Expired", "Revoked", "Used up"])
      expect(await screen.findByText(status)).toBeDefined()
    expect(
      within(screen.getByText("Active").closest("li")!).getByText("2 of 3 left")
    ).toBeDefined()
    expect(
      within(screen.getByText("Used up").closest("li")!).getByText(
        "0 of 3 left"
      )
    ).toBeDefined()
    const buttons = screen.getAllByRole("button", {
      name: "Revoke",
    })
    expect(buttons).toHaveLength(1)
    fireEvent.click(buttons[0])
    expect(a.revokeGrant).not.toHaveBeenCalled()
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByText(
        "Revoke this grant? Unused views will be removed."
      )
    ).toBeDefined()
    fireEvent.click(within(dialog).getByRole("button", { name: "Revoke" }))
    await waitFor(() => expect(a.revokeGrant).toHaveBeenCalledWith(9, 5))
    await waitFor(() => expect(a.listStudentGrants).toHaveBeenCalledTimes(2))
  })
  it.each(["0", "1001", "2.5", ""])(
    "rejects views outside 1–1000 without calling the API: %s",
    async (value) => {
      renderSection()
      const dialog = await openForm()
      fireEvent.change(within(dialog).getByRole("spinbutton"), {
        target: { value },
      })
      submit(dialog)
      expect(
        await screen.findByText("Enter a whole number from 1 to 1000.")
      ).toBeDefined()
      expect(a.createGrant).not.toHaveBeenCalled()
    }
  )
  it("shows loading, then a load error and retries", async () => {
    a.listStudentGrants.mockResolvedValueOnce({
      success: false,
      code: "unknown",
    })
    renderSection()
    expect(
      screen
        .getByRole("region", { name: "Extra video views" })
        .getAttribute("aria-busy")
    ).toBe("true")
    await screen.findByText("Could not load grants.")
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(await screen.findByText("No extra views granted yet.")).toBeDefined()
  })
  it("disables submission while pending", async () => {
    a.createGrant.mockReturnValue(new Promise(() => {}))
    renderSection()
    const dialog = await openForm()
    submit(dialog)
    expect(
      (
        within(dialog).getByRole("button", {
          name: "Grant",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    submit(dialog)
    expect(a.createGrant).toHaveBeenCalledOnce()
  })
  it("sends reason and expiry at the end of the local day and explains unlimited videos", async () => {
    a.listCourseVideos.mockResolvedValue({
      success: true,
      data: [{ ...videos[0], max_watch_count: null }],
    })
    renderSection()
    const dialog = await openForm()
    expect(
      within(dialog).getByText(
        "This video has no watch limit, so extra views are not needed yet."
      )
    ).toBeDefined()
    const reason = within(dialog).getByRole("textbox", {
      name: "Reason (optional)",
    })
    expect(reason.getAttribute("maxlength")).toBe("500")
    fireEvent.change(reason, { target: { value: "Revision" } })
    expect(within(dialog).getByText("8 / 500")).toBeDefined()
    fireEvent.change(within(dialog).getByLabelText("Expires on (optional)"), {
      target: { value: "2027-01-01" },
    })
    submit(dialog)
    await waitFor(() =>
      expect(a.createGrant).toHaveBeenCalledWith(
        {
          user_id: 5,
          item_id: 319,
          granted_views: 1,
          reason: "Revision",
          expires_at: new Date(2027, 0, 1, 23, 59, 59, 999).toISOString(),
        },
        expect.any(String)
      )
    )
  })
})
