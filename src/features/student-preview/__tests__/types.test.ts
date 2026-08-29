import type {
  StudentTeacherPreviewModel,
  StudentCoursePreviewModel,
  PreviewInteractionMode,
} from "../types"
import { describe, it, expect } from "vitest"

describe("student-preview types", () => {
  it("StudentTeacherPreviewModel has required fields", () => {
    const model: StudentTeacherPreviewModel = {
      id: 1,
      name: "Ahmed",
      title: "Math Teacher",
      subject: "Math",
      subjects: ["Math"],
      grades: ["Grade 10"],
      avatarUrl: null,
      experienceYears: 5,
      bio: "Bio text",
      location: null,
      courses: [],
    }
    expect(model.id).toBeDefined()
  })

  it("StudentCoursePreviewModel has required fields", () => {
    const model: StudentCoursePreviewModel = {
      id: 1,
      title: "Course",
      description: "Desc",
      coverUrl: null,
      price: "100",
      subject: null,
      grade: null,
      stream: null,
      teacher: null,
      sections: [],
    }
    expect(model.id).toBeDefined()
  })

  it("PreviewInteractionMode is local-only", () => {
    const mode: PreviewInteractionMode = "local-only"
    expect(mode).toBe("local-only")
  })
})
