import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TeacherDetail } from "../components/teacher-detail"
import { createTeacherLibrary } from "../actions"
import { toast } from "sonner"

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("../actions", () => ({
  createTeacherLibrary: vi.fn(), sendSetPasswordEmail: vi.fn(), updateTeacherLibrarySettings: vi.fn(),
}))
const updateTeacher = vi.hoisted(() => vi.fn())
vi.mock("../hooks/use-teachers-queries", () => ({
  useTeacherMutations: () => ({ update: { isPending: false, mutateAsync: updateTeacher } }),
}))
vi.mock("../components/subscriptions-list", () => ({ SubscriptionsList: () => null }))
vi.mock("../components/teacher-payments-panel", () => ({ TeacherPaymentsPanel: () => null }))

describe("TeacherDetail library confirmation", () => {
  it("closes after failure, shows the API message, and allows another attempt", async () => {
    let finish!: (value: Awaited<ReturnType<typeof createTeacherLibrary>>) => void
    vi.mocked(createTeacherLibrary).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    render(<TeacherDetail teacher={{
      id: 1, teacher_profile_id: 2, name: "Teacher", email: "teacher@example.com", slug: "teacher",
      phone_number: null, bandwidth_cost_per_gb: "0", storage_cost_per_gb_monthly: "0",
      is_active: true, created_at: "2026-01-01T00:00:00Z", subjects: [], grades: [], has_library: false,
    }} subjects={[]} grades={[]} initialLibrarySettings={null} />)
    fireEvent.click(screen.getByRole("button", { name: "create_library" }))
    const dialog = screen.getByRole("dialog")
    const confirm = within(dialog).getByRole("button", { name: "create_library" }) as HTMLButtonElement
    fireEvent.click(confirm)
    expect(confirm.disabled).toBe(true)
    finish({ success: false, error: { type: "Upstream", message: "Failed to create video library" } })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(toast.error).toHaveBeenCalledWith("Failed to create video library")
    const retry = screen.getByRole("button", { name: "create_library" }) as HTMLButtonElement
    expect(retry.disabled).toBe(false)
    fireEvent.click(retry)
    expect(screen.getByRole("dialog")).toBeTruthy()
  })
})


it("updates the header from the saved teacher response", async () => {
  const teacher = {
    id: 1, teacher_profile_id: 2, name: "Teacher", email: "teacher@example.com", slug: "teacher",
    phone_number: null, bandwidth_cost_per_gb: "0", storage_cost_per_gb_monthly: "0",
    is_active: true, created_at: "2026-01-01T00:00:00Z", subjects: [], grades: [], has_library: false,
  }
  updateTeacher.mockResolvedValueOnce({ success: true, data: { ...teacher, name: "Saved name", email: "saved@example.com" } })
  render(<TeacherDetail teacher={teacher} subjects={[]} grades={[]} initialLibrarySettings={null} />)
  fireEvent.change(screen.getByLabelText("field_name"), { target: { value: "New name" } })
  fireEvent.change(screen.getByLabelText("field_email"), { target: { value: "new@example.com" } })
  fireEvent.click(screen.getByRole("button", { name: "btn_save" }))
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "btn_save" }))
  await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Saved name"))
  expect(document.querySelector("header")?.textContent).toContain("saved@example.com")
})
