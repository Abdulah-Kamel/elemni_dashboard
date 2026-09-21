import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { CourseBuilderBridgeProvider } from "@/features/course-management/course-builder-bridge"
import { StudentCourseDetailPreview } from "../student-course-detail-preview"
import type { StudentCoursePreviewModel } from "../types"

const model: StudentCoursePreviewModel = {
  id: "preview",
  title: "Physics",
  description: "Full syllabus",
  coverUrl: null,
  price: "100",
  subject: "Physics",
  grade: null,
  stream: null,
  teacher: { name: "Mona", avatarUrl: null },
  sections: [
    {
      id: 1,
      title: "Unit 1",
      lessons: [
        {
          id: 2,
          title: "Lesson 1",
          description: null,
          durationMinutes: 30,
          items: [],
        },
      ],
    },
  ],
}

function renderPreview(hideCurriculum?: boolean) {
  return render(
    <CourseBuilderBridgeProvider enabled={false}>
      <StudentCourseDetailPreview
        model={model}
        locale="en"
        interactionMode="local-only"
        hideCurriculum={hideCurriculum}
      />
    </CourseBuilderBridgeProvider>
  )
}

describe("StudentCourseDetailPreview hideCurriculum", () => {
  it("renders the content section by default", () => {
    renderPreview()
    expect(screen.getByText("Course plan")).toBeDefined()
  })

  it("hides the content section when hideCurriculum is true", () => {
    renderPreview(true)
    expect(screen.queryByText("Course plan")).toBeNull()
    expect(screen.getByRole("heading", { name: "Physics" })).toBeDefined()
  })
})
