import { beforeEach, describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import { CreateCourseWorkspace } from "../components/create-course-workspace"

const createMutation = vi.hoisted(() => ({ mutateAsync: vi.fn() }))
const updateMutation = vi.hoisted(() => ({ mutateAsync: vi.fn() }))
const mockedUploadCourseCover = vi.hoisted(() => vi.fn())
const mockedPush = vi.hoisted(() => vi.fn())

vi.mock("@/features/course-management/hooks/use-course-management-queries", () => ({
  useCourseMutations: () => ({ create: createMutation, update: updateMutation }),
}))

vi.mock("@/features/course-management/upload-course-cover", () => ({
  uploadCourseCover: mockedUploadCourseCover,
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockedPush }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

vi.mock("../components/curriculum-picker", () => ({
  CurriculumPicker({
    onSubjectChange,
    onGradeChange,
    onStreamChange,
    errors,
  }: {
    onSubjectChange: (id: number | null) => void
    onGradeChange: (id: number | null) => void
    onStreamChange: (id: number | null) => void
    errors?: { subjectId?: string; gradeId?: string; streamId?: string }
  }) {
    return (
      <div>
        <button onClick={() => onSubjectChange(1)}>Select Subject</button>
        <button onClick={() => onGradeChange(3)}>Select Grade</button>
        <button onClick={() => onStreamChange(5)}>Select Stream</button>
        {errors?.subjectId && <p>{errors.subjectId}</p>}
        {errors?.gradeId && <p>{errors.gradeId}</p>}
        {errors?.streamId && <p>{errors.streamId}</p>}
      </div>
    )
  },
}))

const messages = {
  courses: {
    create_title: "Create a new course",
    create_subtitle: "Fill in the details.",
    save_and_continue: "Save and continue",
    title_required: "Course title is required",
    title_label: "Course Title",
    description_label: "Description",
    subject_label: "Subject",
    grade_label: "Grade",
    stream_label: "Stream",
    chapters_organized: "Organized into chapters",
    flat_lessons: "Flat list of lessons",
    loading_curriculum: "Loading...",
    cover_label: "Course cover",
    cover_upload: "Upload cover",
    cover_replace: "Replace cover",
    cover_hint: "JPG, PNG, or WebP up to 5 MB",
    cover_invalid_type: "Choose a JPG, PNG, or WebP image",
    cover_too_large: "The cover must be 5 MB or smaller",
    cover_clear_selection: "Clear selection",
    course_created: "Course created successfully",
    course_created_cover_failed: "Cover failed",
    error_upstream: "Service temporarily unavailable",
    price_label: "Price (EGP)",
    price_hint: "Enter a price",
    egp: "EGP",
    free: "Free",
    saving: "Saving...",
    cancel: "Cancel",
  },
}

const curriculum = {
  subjects: [{ id: 1, name: "Physics", slug: "physics", grades: [], streams: [] }],
  grades: [{ id: 3, name: "Grade 1", level: "secondary" }],
  streams: [{ id: 5, name: "Science", slug: "science" }],
}

function renderWorkspace() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <QueryClientProvider client={new QueryClient()}>
        <CreateCourseWorkspace
          locale="en"
          teacherProfileId={7}
          teacherName="Mona"
          subjects={curriculum.subjects}
          grades={curriculum.grades}
          streams={curriculum.streams}
        />
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}

function selectCurriculum() {
  fireEvent.click(screen.getByText("Select Subject"))
  fireEvent.click(screen.getByText("Select Grade"))
  fireEvent.click(screen.getByText("Select Stream"))
}

describe("CreateCourseWorkspace", () => {
  beforeEach(() => {
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:cover"),
      revokeObjectURL: vi.fn(),
    })
    createMutation.mutateAsync.mockReset()
    updateMutation.mutateAsync.mockReset()
    mockedUploadCourseCover.mockReset()
    mockedPush.mockReset()
    createMutation.mutateAsync.mockResolvedValue({ id: 9 })
    updateMutation.mutateAsync.mockResolvedValue({ id: 9 })
    mockedUploadCourseCover.mockResolvedValue("covers/9.png")
  })

  it("renders the editor and the simplified live preview", () => {
    renderWorkspace()
    expect(screen.getByText("Create a new course")).toBeDefined()
    expect(screen.queryByText("Course plan")).toBeNull()
  })

  it("blocks save without a title and sends no request", async () => {
    renderWorkspace()
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }))
    await waitFor(() =>
      expect(screen.getByText("Course title is required")).toBeDefined()
    )
    expect(createMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("blocks save when curriculum selection is missing", async () => {
    renderWorkspace()
    fireEvent.change(screen.getByLabelText("Course Title"), {
      target: { value: "Physics" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }))
    await waitFor(() => {
      expect(screen.getByText("المادة مطلوبة")).toBeDefined()
      expect(screen.getByText("الصف مطلوب")).toBeDefined()
      expect(screen.getByText("الشعبة مطلوبة")).toBeDefined()
    })
    expect(createMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("creates the draft and navigates to the edit workspace", async () => {
    renderWorkspace()
    fireEvent.change(screen.getByLabelText("Course Title"), {
      target: { value: "Physics" },
    })
    selectCurriculum()
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }))
    await waitFor(() =>
      expect(createMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Physics", is_published: false })
      )
    )
    await waitFor(() =>
      expect(mockedPush).toHaveBeenCalledWith("/en/courses/9")
    )
  })

  it("still navigates when the cover upload fails", async () => {
    mockedUploadCourseCover.mockRejectedValueOnce(new Error("boom"))
    renderWorkspace()
    fireEvent.change(screen.getByLabelText("Course Title"), {
      target: { value: "Physics" },
    })
    selectCurriculum()
    const file = new File(["cover"], "cover.png", { type: "image/png" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }))
    await waitFor(() =>
      expect(mockedPush).toHaveBeenCalledWith("/en/courses/9")
    )
  })
})
