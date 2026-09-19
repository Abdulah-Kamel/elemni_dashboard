import { beforeEach, describe, it, expect, vi } from "vitest"
import { render as rtlRender, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import type { ComponentProps } from "react"
import { CourseWorkspace } from "../course-workspace"
import type { StudentCoursePreviewModel, StudentPreviewSection } from "../types"

const updateMutation = vi.hoisted(() => ({ mutateAsync: vi.fn() }))
const publishMutation = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }))
const unpublishMutation = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }))
const mockedUploadCourseCover = vi.hoisted(() => vi.fn())
const mockedLoadCoursePreviewCurriculum = vi.hoisted(() => vi.fn())

vi.mock("@/features/course-management/hooks/use-course-management-queries", () => ({
  useCourseMutations: () => ({
    update: updateMutation,
    publish: publishMutation,
    unpublish: unpublishMutation,
  }),
}))

vi.mock("@/features/course-management/upload-course-cover", () => ({
  uploadCourseCover: mockedUploadCourseCover,
}))

vi.mock("../server-actions", () => ({
  loadCoursePreviewCurriculum: mockedLoadCoursePreviewCurriculum,
}))

function render(ui: React.ReactNode, locale: string = "ar") {
  return rtlRender(
    <NextIntlClientProvider
      locale={locale}
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
          structure_label: "Course structure",
          structure_change_title: "Change course structure?",
          structure_to_chapters_warning: "Existing flat lessons will move into a default chapter.",
          structure_to_flat_warning: "Chapter groupings will be removed and lessons will be kept in their current order.",
          confirm_structure_change: "Change structure",
          chapters_organized: "Organized into chapters",
          flat_lessons: "Flat list of lessons",
          cancel: "Cancel",
          archived: "Archived",
          archive_course: "Archive course",
          unarchive_course: "Unarchive course",
          archive_title: "Archive this course?",
          archive_warning: "The course will be unpublished and hidden from students.",
          confirm_archive: "Confirm archive",
          archived_publish_hint: "Unarchive this course before publishing it.",
          published_status: "Publishing status",
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
    mockedLoadCoursePreviewCurriculum.mockReset()
    mockedLoadCoursePreviewCurriculum.mockResolvedValue({ success: true, data: [] })
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

  it("saves unchanged chapter mode without confirmation", async () => {
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        useChapters={false}
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    await waitFor(() =>
      expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
        courseId: 42,
        data: expect.not.objectContaining({ use_chapters: expect.anything() }),
      })
    )
  })

  it("requires confirmation before changing chapter mode", async () => {
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        useChapters={false}
      />,
      "en"
    )
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "Organized into chapters" }))
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    expect(updateMutation.mutateAsync).not.toHaveBeenCalled()
    expect(screen.getByRole("dialog", { name: "Change course structure?" })).toBeDefined()
  })

  it("cancels structure change without mutating", async () => {
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        useChapters={false}
      />,
      "en"
    )
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "Organized into chapters" }))
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    expect(screen.getByRole("dialog", { name: "Change course structure?" })).toBeDefined()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(updateMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("confirms structure change and reloads curriculum", async () => {
    mockedLoadCoursePreviewCurriculum.mockResolvedValue({ success: true, data: mockSections })
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        useChapters={false}
      />,
      "en"
    )
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "Organized into chapters" }))
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Change structure" }))
    })
    await waitFor(() =>
      expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
        courseId: 42,
        data: expect.objectContaining({ use_chapters: true }),
      })
    )
    await waitFor(() =>
      expect(mockedLoadCoursePreviewCurriculum).toHaveBeenCalledWith(42)
    )
  })

  it("warns about removing chapter groupings when switching to flat", async () => {
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        useChapters={true}
      />,
      "en"
    )
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "Flat list of lessons" }))
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    expect(screen.getByRole("dialog", { name: "Change course structure?" })).toBeDefined()
    expect(screen.getByText("Chapter groupings will be removed and lessons will be kept in their current order.")).toBeDefined()
  })

  it("archives and unpublishes in one update", async () => {
    updateMutation.mutateAsync.mockResolvedValue({ is_archived: true, is_published: false, img: null })
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished
        isArchived={false}
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Archive course" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }))
    await waitFor(() =>
      expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
        courseId: 42,
        data: { is_archived: true, is_published: false },
      })
    )
  })

  it("unarchives without republishing", async () => {
    updateMutation.mutateAsync.mockResolvedValue({ is_archived: false, is_published: false, img: null })
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished={false}
        isArchived
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Unarchive course" }))
    await waitFor(() =>
      expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
        courseId: 42,
        data: { is_archived: false },
      })
    )
  })

  it("sends no request when archive is cancelled", async () => {
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished
        isArchived={false}
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Archive course" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(updateMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("leaves archive control unchanged on mutation failure", async () => {
    updateMutation.mutateAsync.mockRejectedValueOnce(new Error("Server error"))
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished
        isArchived={false}
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Archive course" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }))
    await waitFor(() => expect(updateMutation.mutateAsync).toHaveBeenCalled())
    expect(screen.getByRole("button", { name: "Archive course" })).toBeDefined()
    expect(screen.queryByRole("button", { name: "Unarchive course" })).toBeNull()
  })

  it("shows inline error when archive mutation fails", async () => {
    updateMutation.mutateAsync.mockRejectedValueOnce(new Error("Server error"))
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished
        isArchived={false}
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Archive course" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }))
    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined())
    expect(screen.getByRole("alert").textContent).toBe("Server error")
  })

  it("shows inline error when unarchive mutation fails", async () => {
    updateMutation.mutateAsync.mockRejectedValueOnce(new Error("Unarchive failed"))
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished={false}
        isArchived
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Unarchive course" }))
    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined())
    expect(screen.getByRole("alert").textContent).toBe("Unarchive failed")
  })

  it("falls back to generic error when archive fails with no message", async () => {
    updateMutation.mutateAsync.mockRejectedValueOnce({})
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished
        isArchived={false}
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Archive course" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }))
    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined())
    expect(screen.getByRole("alert").textContent).toBe(
      "Service temporarily unavailable"
    )
  })

  it("clears archive error before a new archive request", async () => {
    updateMutation.mutateAsync
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValue({ is_archived: true, is_published: false, img: null })
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished
        isArchived={false}
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Archive course" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }))
    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined())
    expect(screen.getByRole("alert").textContent).toBe("First error")
    fireEvent.click(screen.getByRole("button", { name: "Archive course" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }))
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull())
  })

  it("disables archive button while archive request is pending", async () => {
    let resolvePromise: (value: unknown) => void
    updateMutation.mutateAsync.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve })
    )
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished
        isArchived={false}
      />,
      "en"
    )
    fireEvent.click(screen.getByRole("button", { name: "Archive course" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }))
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Archive course" }).getAttribute("disabled")).not.toBeNull()
    )
    resolvePromise!({ is_archived: true, is_published: false, img: null })
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Unarchive course" })).toBeDefined()
    )
  })

  it("disables publish switch while archived", () => {
    render(
      <CourseWorkspace
        {...editableWorkspaceProps}
        model={mockModel}
        locale="en"
        teacherProfileId={7}
        isPublished={false}
        isArchived
      />,
      "en"
    )
    expect(screen.getByRole("switch", { name: "Publishing status" }).getAttribute("disabled")).not.toBeNull()
  })
})
