import { describe, it, expect, vi, beforeEach } from "vitest"
import { render as rtlRender, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ProfileWorkspace } from "../profile-workspace"
import type { TeacherProfile } from "@/features/profile/schema"
import type { CourseOut } from "@/features/shell/schema"
import { toast } from "sonner"

const profileUpdateMutation = vi.hoisted(() => ({ mutateAsync: vi.fn() }))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("@/features/profile/actions", () => ({
  requestProfileImageUpload: vi.fn(),
  updateTeacherProfile: vi.fn(),
  getTeacherProfileAction: vi.fn(),
}))

vi.mock("@/lib/upload", () => ({
  uploadToPresignedUrl: vi.fn(),
}))

vi.mock("@/features/profile/hooks/use-profile-queries", () => ({
  useProfileMutations: () => ({ update: profileUpdateMutation }),
  useTeacherProfileQuery: () => ({ data: undefined }),
}))

function render(ui: React.ReactNode) {
  const queryClient = new QueryClient()
  return rtlRender(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

const mockProfile: TeacherProfile = {
  id: 1,
  name: "أحمد علي",
  email: "ahmed@example.com",
  slug: "ahmed-ali",
  phone_number: null,
  description: "مدرس فيزياء",
  location: "القاهرة",
  experience: 5,
  img: null,
  subjects: [
    { id: 1, name: "فيزياء", slug: "physics", grades: [], streams: [] },
  ],
  grades: [{ id: 1, name: "الصف الثالث", level: "secondary" }],
  streams: [],
}

const mockCourses: CourseOut[] = []

describe("ProfileWorkspace", () => {
  beforeEach(() => {
    profileUpdateMutation.mutateAsync.mockReset()
    profileUpdateMutation.mutateAsync.mockResolvedValue({})
  })

  it("renders editor and preview", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="ar"
        publicImageUrl={null}
      />
    )
    expect(screen.getByText("أحمد علي")).toBeDefined()
  })

  it("updates preview when name changes", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="ar"
        publicImageUrl={null}
      />
    )
    const nameInput = screen.getByDisplayValue("أحمد علي")
    fireEvent.change(nameInput, { target: { value: "محمد علي" } })
    expect(screen.getByText("محمد علي")).toBeDefined()
  })

  it("updates the preview experience stat from the editor", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl={null}
      />
    )

    const experienceInput = screen.getByLabelText("Years of experience")
    expect((experienceInput as HTMLInputElement).value).toBe("5")

    fireEvent.change(experienceInput, { target: { value: "8" } })
    expect(
      document.querySelector('[data-profile-preview-field="experience"]')
        ?.textContent
    ).toContain("8 years of experience")
  })

  it("highlights the matching editor field while hovering its preview", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="ar"
        publicImageUrl={null}
      />
    )

    const previewName = document.querySelector(
      '[data-profile-preview-field="name"]'
    )
    const editorName = document.querySelector(
      '[data-profile-editor-field="name"]'
    )
    const nameInput = document.querySelector(
      '[data-profile-editor-input="name"]'
    )
    expect(previewName).not.toBeNull()
    expect(editorName).not.toBeNull()
    expect(nameInput).not.toBeNull()

    fireEvent.mouseEnter(previewName!)
    expect(editorName!.getAttribute("data-profile-editor-state")).toBe(
      "hovered"
    )
    expect(editorName!.className).not.toContain("ring-primary/30")
    expect(nameInput!.className).toContain("ring-primary/30")

    fireEvent.mouseLeave(previewName!)
    expect(editorName!.getAttribute("data-profile-editor-state")).toBe("idle")
    expect(nameInput!.className).not.toContain("ring-primary/30")
  })

  it("focuses the matching editor control when a preview field is clicked", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="ar"
        publicImageUrl={null}
      />
    )

    const bioInput = document.getElementById("profile-bio")
    expect(bioInput).not.toBeNull()

    // Exercise the compact layout path: the preview tab is visible while the
    // editor tab is hidden, so activation must reveal the editor first.
    fireEvent.click(screen.getByRole("tab", { name: "معاينة" }))
    fireEvent.click(screen.getByRole("button", { name: "تعديل النبذة" }))
    expect(
      screen.getByRole("tab", { name: "تعديل" }).getAttribute("aria-selected")
    ).toBe("true")
    expect(document.activeElement).toBe(bioInput)
  })

  it("focuses the avatar drop region from the preview avatar", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="ar"
        publicImageUrl={null}
      />
    )

    const dropRegion = document.querySelector(
      '[data-profile-editor-field="avatar"] [data-testid="drop-region"]'
    )
    expect(dropRegion).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "تعديل الصورة" }))
    expect(document.activeElement).toBe(dropRegion)
  })

  it("focuses the location input from its preview stat", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="ar"
        publicImageUrl={null}
      />
    )

    const locationInput = document.getElementById("profile-location")
    expect(locationInput).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "تعديل الموقع" }))
    expect(document.activeElement).toBe(locationInput)
  })

  it("lets keyboard focus move through avatar actions without snapping back", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl={null}
      />
    )

    const input = document.getElementById("profile-avatar") as HTMLInputElement
    fireEvent.change(input, {
      target: {
        files: [new File(["data"], "avatar.png", { type: "image/png" })],
      },
    })

    const dropRegion = screen.getByTestId("drop-region")
    const clearButton = screen.getByRole("button", { name: /remove file/i })
    dropRegion.focus()
    clearButton.focus()

    expect(document.activeElement).toBe(clearButton)
  })

  it("removes preview edit affordances while the full-preview dialog is open", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="ar"
        publicImageUrl={null}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "معاينة" }))
    expect(screen.getByRole("dialog")).toBeDefined()
    expect(screen.queryByRole("button", { name: "تعديل الاسم" })).toBeNull()
  })

  it("shows save button", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="ar"
        publicImageUrl={null}
      />
    )
    expect(screen.getByRole("button", { name: /حفظ|Save/ })).toBeDefined()
  })

  it("associates the avatar label with the hidden file input via htmlFor", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl={null}
      />
    )
    const label = screen.getByText("Profile Image")
    expect(label.getAttribute("for")).toBe("profile-avatar")
    const input = document.getElementById("profile-avatar") as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.type).toBe("file")
  })

  it("keeps the current avatar when a replacement file is invalid", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl="https://cdn.example.com/avatar.webp"
      />
    )
    const input = document.getElementById("profile-avatar") as HTMLInputElement
    fireEvent.change(input, {
      target: {
        files: [
          new File(["not-an-image"], "notes.txt", { type: "text/plain" }),
        ],
      },
    })

    const matchingImages = screen.getAllByRole("img", { name: "أحمد علي" })
    expect(matchingImages.length).toBeGreaterThan(0)
    expect(
      matchingImages.every(
        (image) =>
          image.getAttribute("src") === "https://cdn.example.com/avatar.webp"
      )
    ).toBe(true)
  })

  it("accepts avatar files up to 10 MB", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl={null}
      />
    )
    const input = document.getElementById("profile-avatar") as HTMLInputElement
    const file = new File([new ArrayBuffer(10 * 1024 * 1024)], "avatar.png", {
      type: "image/png",
    })

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText("avatar.png")).toBeDefined()
  })

  it("rejects avatar files larger than 10 MB", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl={null}
      />
    )
    const input = document.getElementById("profile-avatar") as HTMLInputElement
    const file = new File(
      [new ArrayBuffer(10 * 1024 * 1024 + 1)],
      "too-large.png",
      { type: "image/png" }
    )

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.queryByText("too-large.png")).toBeNull()
  })

  it("shows a remove button for a persisted avatar when no new file is selected", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl="https://cdn.example.com/avatar.webp"
      />
    )
    expect(screen.getByRole("button", { name: /remove/i })).toBeDefined()
  })

  it("removes the persisted avatar when the remove button is clicked", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl="https://cdn.example.com/avatar.webp"
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /remove/i }))
    // After removal, avatar image should be gone (both editor and preview fallbacks show "أ")
    expect(screen.queryByRole("img", { name: "أحمد علي" })).toBeNull()
    const fallbacks = screen.getAllByText("أ")
    expect(fallbacks.length).toBeGreaterThanOrEqual(1)
  })

  it("restores the persisted avatar when a replacement is cleared", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl="https://cdn.example.com/avatar.webp"
      />
    )
    // Select a new file
    const input = document.getElementById("profile-avatar") as HTMLInputElement
    fireEvent.change(input, {
      target: {
        files: [new File(["data"], "new.png", { type: "image/png" })],
      },
    })

    // Clear the new file
    const clearBtn = screen.getByRole("button", { name: /remove file/i })
    fireEvent.click(clearBtn)

    // Should restore the persisted avatar
    const images = screen.getAllByRole("img", { name: "أحمد علي" })
    expect(
      images.some(
        (img) =>
          img.getAttribute("src") === "https://cdn.example.com/avatar.webp"
      )
    ).toBe(true)
  })

  it("does not show a remove button when there is no persisted avatar", () => {
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl={null}
      />
    )
    // No persisted-avatar remove action should exist without an image.
    const buttons = screen.getAllByRole("button")
    const removeButtons = buttons.filter(
      (btn) =>
        btn.textContent?.toLowerCase().includes("remove") &&
        !btn.textContent?.toLowerCase().includes("remove file")
    )
    expect(removeButtons).toHaveLength(0)
  })

  it("shows backend error message when save fails with a descriptive error", async () => {
    profileUpdateMutation.mutateAsync.mockRejectedValueOnce(
      new Error("Backend says profile invalid")
    )
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl={null}
      />
    )

    fireEvent.change(screen.getByDisplayValue("أحمد علي"), {
      target: { value: "أحمد عليModified" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Backend says profile invalid")
    })
  })

  it("falls back to generic error toast when save fails with no useful message", async () => {
    profileUpdateMutation.mutateAsync.mockRejectedValueOnce({})
    render(
      <ProfileWorkspace
        profile={mockProfile}
        courses={mockCourses}
        locale="en"
        publicImageUrl={null}
      />
    )

    fireEvent.change(screen.getByDisplayValue("أحمد علي"), {
      target: { value: "أحمد عليModified" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong")
    })
  })
})
