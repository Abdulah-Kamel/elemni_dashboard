import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ProfileWorkspace } from "../profile-workspace"
import type { TeacherProfile } from "@/features/profile/schema"
import type { CourseOut } from "@/features/shell/schema"

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("@/features/profile/actions", () => ({
  requestProfileImageUpload: vi.fn(),
  updateTeacherProfile: vi.fn(),
}))

vi.mock("@/lib/upload", () => ({
  uploadToPresignedUrl: vi.fn(),
}))

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
        files: [
          new File(["data"], "new.png", { type: "image/png" }),
        ],
      },
    })

    // Clear the new file
    const clearBtn = screen.getByRole("button", { name: /remove file/i })
    fireEvent.click(clearBtn)

    // Should restore the persisted avatar
    const images = screen.getAllByRole("img", { name: "أحمد علي" })
    expect(
      images.some(
        (img) => img.getAttribute("src") === "https://cdn.example.com/avatar.webp"
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
    // Only the Browse button should exist, not a "Remove" button
    const buttons = screen.getAllByRole("button")
    const removeButtons = buttons.filter(
      (btn) => btn.textContent?.toLowerCase().includes("remove") && !btn.textContent?.toLowerCase().includes("remove file")
    )
    expect(removeButtons).toHaveLength(0)
  })
})
