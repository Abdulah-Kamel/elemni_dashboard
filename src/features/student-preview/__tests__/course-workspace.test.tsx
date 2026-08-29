import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CourseWorkspace } from "../course-workspace"
import type { StudentCoursePreviewModel, StudentPreviewSection } from "../types"

vi.mock("../server-actions", () => ({
  loadCoursePreviewCurriculum: vi.fn(),
}))

import { loadCoursePreviewCurriculum } from "../server-actions"

const mockModel: StudentCoursePreviewModel = {
  id: 42,
  title: "كورس الفيزياء",
  description: "شرح شامل",
  coverUrl: null,
  price: "200",
  subject: "فيزياء",
  grade: null,
  stream: null,
  teacher: { name: "محمد علي", avatarUrl: null },
  sections: [],
}

describe("CourseWorkspace", () => {
  it("renders editor and preview", () => {
    render(<CourseWorkspace model={mockModel} locale="ar" viewer="guest" />)
    expect(screen.getByText("كورس الفيزياء")).toBeDefined()
  })

  it("renders the existing curriculum editor inside the workspace", () => {
    render(
      <CourseWorkspace
        model={mockModel}
        locale="ar"
        viewer="guest"
        curriculum={<div>Curriculum tree</div>}
        curriculumTitle="المنهج"
        curriculumHint="إدارة الدروس"
      />
    )

    const curriculum = screen.getByTestId("course-curriculum")
    const editorPane = screen.getByTestId("editor-pane")
    expect(editorPane.contains(curriculum)).toBe(true)
    expect(screen.getByText("Curriculum tree")).toBeDefined()
    expect(screen.getByText("المنهج")).toBeDefined()
  })

  it("updates preview when title changes", () => {
    render(<CourseWorkspace model={mockModel} locale="ar" viewer="guest" />)
    const titleInput = screen.getByDisplayValue("كورس الفيزياء")
    fireEvent.change(titleInput, { target: { value: "كورس رياضيات" } })
    expect(screen.getByText("كورس رياضيات")).toBeDefined()
  })

  it("toggles viewer mode", () => {
    render(<CourseWorkspace model={mockModel} locale="ar" viewer="guest" />)
    const viewerToggle = screen.getByRole("radio", { name: /مشترك|Subscribed/ })
    fireEvent.click(viewerToggle)
    expect(viewerToggle.getAttribute("aria-checked")).toBe("true")
  })

  it("associates editor labels with their controls", () => {
    render(<CourseWorkspace model={mockModel} locale="en" viewer="guest" />)
    expect(screen.getByLabelText("Title")).toBeDefined()
    expect(screen.getByLabelText("Description")).toBeDefined()
    expect(screen.getByLabelText("Price").getAttribute("type")).toBe("number")
    expect(screen.getByRole("radiogroup", { name: "Viewer" })).toBeDefined()
  })

  it("refreshes the curriculum preview on demand", async () => {
    const refreshedSections: StudentPreviewSection[] = [
      {
        id: 1,
        title: "الوحدة الأولى",
        lessons: [
          {
            id: 2,
            title: "درس محدث",
            description: null,
            durationMinutes: null,
            items: [],
          },
        ],
      },
    ]
    vi.mocked(loadCoursePreviewCurriculum).mockResolvedValue({
      success: true,
      data: refreshedSections,
    })

    render(<CourseWorkspace model={mockModel} locale="ar" viewer="guest" />)
    fireEvent.click(
      screen.getByRole("button", { name: "تحديث محتوى المعاينة" })
    )

    await waitFor(() => expect(screen.getByText("درس محدث")).toBeDefined())
    expect(loadCoursePreviewCurriculum).toHaveBeenCalledWith(42)
  })

  it("offers a recoverable error when curriculum refresh fails", async () => {
    vi.mocked(loadCoursePreviewCurriculum).mockResolvedValue({
      success: false,
      error: { type: "Server", message: "failed" },
    })

    render(<CourseWorkspace model={mockModel} locale="en" viewer="guest" />)
    fireEvent.click(
      screen.getByRole("button", { name: "Refresh preview content" })
    )

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Could not refresh"
    )
  })
})
