import { beforeEach, describe, it, expect, vi } from "vitest"
import { render as rtlRender, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import type { ComponentProps } from "react"
import { CourseWorkspace } from "../course-workspace"
import type { StudentCoursePreviewModel, StudentPreviewSection } from "../types"

const updateMutation = vi.hoisted(() => ({ mutateAsync: vi.fn() }))
const mockedUploadCourseCover = vi.hoisted(() => vi.fn())

vi.mock("@/features/course-management/hooks/use-course-management-queries", () => ({
  useCourseMutations: () => ({ update: updateMutation }),
}))

vi.mock("@/features/course-management/upload-course-cover", () => ({
  uploadCourseCover: mockedUploadCourseCover,
}))

function render(ui: React.ReactNode) {
  return rtlRender(
    <NextIntlClientProvider
      locale="ar"
      messages={{
        courses: {
          subject_label: "المادة",
          grade_label: "الصف",
          stream_label: "الشعبة",
          loading_curriculum: "جارٍ التحميل...",
          cover_label: "غلاف الكورس",
          cover_upload: "رفع الغلاف",
          cover_replace: "استبدال الغلاف",
          cover_hint: "JPG أو PNG",
          cover_invalid_type: "نوع غير صالح",
          cover_too_large: "الملف كبير جداً",
          cover_clear_selection: "إزالة الاختيار",
        },
      }}
    >
      <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>
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

const editableWorkspaceProps = {
  subjects: [
    { id: 1, name: "رياضيات", slug: "math", grades: [], streams: [] },
    { id: 2, name: "فيزياء", slug: "physics", grades: [], streams: [] },
  ],
  grades: [
    { id: 3, name: "الصف الأول", level: "secondary" },
    { id: 4, name: "الصف الثاني", level: "secondary" },
  ],
  streams: [
    { id: 1, name: "علمي", slug: "science" },
    { id: 2, name: "أدبي", slug: "literary" },
  ],
} satisfies Pick<
  ComponentProps<typeof CourseWorkspace>,
  "subjects" | "grades" | "streams"
>

describe("CourseWorkspace", () => {
  beforeEach(() => {
    updateMutation.mutateAsync.mockReset()
    updateMutation.mutateAsync.mockResolvedValue({ img: null })
  })

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

  it("renders editable curriculum selectors in the workspace editor", () => {
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="ar"
        teacherProfileId={7}
      />
    )

    expect(screen.getAllByRole("combobox")).toHaveLength(3)
    expect(screen.queryByDisplayValue("فيزياء")).toBeNull()
  })

  it("includes selected curriculum ids when saving workspace changes", async () => {
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={{
          ...mockModel,
          subjectId: 1,
          gradeId: 3,
          streamId: 1,
        }}
        locale="ar"
        teacherProfileId={7}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "حفظ التغييرات" }))

    await waitFor(() =>
      expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
        courseId: 42,
        data: expect.objectContaining({
          subject_id: 1,
          grade_id: 3,
          stream_id: 1,
        }),
      })
    )
  })

  it("does not render a refresh-preview button", () => {
    render(<CourseWorkspace model={mockModel} locale="ar" viewer="guest" />)
    expect(
      screen.queryByRole("button", { name: "تحديث محتوى المعاينة" })
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Refresh preview content" })
    ).toBeNull()
    expect(
      screen.getByRole("button", { name: "حفظ التغييرات" })
    ).toBeDefined()
  })

  it("shows backend error message when save fails with a descriptive error", async () => {
    updateMutation.mutateAsync.mockRejectedValueOnce(
      new Error("Backend says title already exists")
    )
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined()
    })
    expect(screen.getByRole("alert").textContent).toBe(
      "Backend says title already exists"
    )
  })

  it("falls back to generic save error when save fails with no useful message", async () => {
    updateMutation.mutateAsync.mockRejectedValueOnce({})
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined()
    })
    expect(screen.getByRole("alert").textContent).toBe(
      "Could not save the changes. Try again."
    )
  })

  it("shows backend error message when cover upload fails", async () => {
    updateMutation.mutateAsync.mockResolvedValue({ img: null })
    mockedUploadCourseCover.mockRejectedValueOnce(
      new Error("Upload server rejected the file")
    )
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
      />
    )

    const coverInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    fireEvent.change(coverInput, {
      target: {
        files: [new File(["data"], "cover.jpg", { type: "image/jpeg" })],
      },
    })

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined()
    })
    expect(screen.getByRole("alert").textContent).toBe(
      "Upload server rejected the file"
    )
  })
})
