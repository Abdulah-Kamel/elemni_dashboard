import { describe, it, expect, vi } from "vitest"
import { render as rtlRender, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CourseWorkspace } from "../course-workspace"
import type { StudentCoursePreviewModel, StudentPreviewSection } from "../types"

vi.mock("../server-actions", () => ({
  loadCoursePreviewCurriculum: vi.fn(),
}))

import { loadCoursePreviewCurriculum } from "../server-actions"

function render(ui: React.ReactNode) {
  return rtlRender(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
  )
}

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

const mockSections: StudentPreviewSection[] = [
  {
    id: 1,
    title: "الوحدة الأولى",
    lessons: [
      {
        id: 2,
        title: "الدرس الأول",
        description: "شرح الدرس",
        durationMinutes: 30,
        items: [
          {
            id: 3,
            title: "فيديو الدرس",
            hasVideo: true,
            hasDocument: false,
            hasExam: false,
          },
        ],
      },
    ],
  },
]

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

  it("highlights the matching title control from the preview", () => {
    render(<CourseWorkspace model={mockModel} locale="en" viewer="guest" />)

    const titleInput = screen.getByLabelText("Title")
    const previewTitle = document.querySelector(
      '[data-course-preview-field="title"]'
    )
    expect(previewTitle).not.toBeNull()

    fireEvent.mouseEnter(previewTitle!)
    expect(titleInput.className).toContain("ring-primary/30")
    expect(previewTitle!.getAttribute("data-course-preview-state")).toBe(
      "hovered"
    )

    fireEvent.mouseLeave(previewTitle!)
    expect(titleInput.className).not.toContain("ring-primary/30")
  })

  it("focuses the matching editor field when a preview title is clicked", () => {
    render(<CourseWorkspace model={mockModel} locale="en" viewer="guest" />)

    fireEvent.click(screen.getByRole("button", { name: "Edit course title" }))
    expect(document.activeElement).toBe(screen.getByLabelText("Title"))
  })

  it("focuses a curriculum editor node when its preview lesson is clicked", () => {
    render(
      <CourseWorkspace
        model={{ ...mockModel, sections: mockSections }}
        initialSections={mockSections}
        locale="en"
        viewer="guest"
        curriculum={
          <div
            data-builder-node-type="lesson"
            data-builder-node-id="2"
            tabIndex={-1}
          >
            Lesson editor
          </div>
        }
      />
    )

    fireEvent.click(screen.getByText("الدرس الأول").closest("button")!)
    expect(document.activeElement).toBe(
      document.querySelector('[data-builder-node-type="lesson"]')
    )
  })

  it("does not render a guest/subscriber viewer switcher", () => {
    render(<CourseWorkspace model={mockModel} locale="ar" viewer="guest" />)
    expect(screen.queryByRole("radiogroup", { name: /viewer|مشاهد/i })).toBeNull()
    expect(screen.queryByText(/guest|subscriber|زائر|مشترك/i)).toBeNull()
  })

  it("associates editor labels with their controls", () => {
    render(<CourseWorkspace model={mockModel} locale="en" viewer="guest" />)
    expect(screen.getByLabelText("Title")).toBeDefined()
    expect(screen.getByLabelText("Description")).toBeDefined()
    expect(screen.getByLabelText("Price").getAttribute("type")).toBe("number")
    expect(screen.queryByRole("radiogroup", { name: "Viewer" })).toBeNull()
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
