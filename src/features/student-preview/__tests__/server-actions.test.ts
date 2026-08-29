import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({ headers: vi.fn() }))
vi.mock("@/lib/auth/dal", () => ({ verifySession: vi.fn() }))
vi.mock("@/features/course-management/queries", () => ({ getCourse: vi.fn() }))
vi.mock("@/features/course-management/chapters-queries", () => ({
  listChapters: vi.fn(),
}))
vi.mock("@/features/course-management/lessons-queries", () => ({
  listLessons: vi.fn(),
}))
vi.mock("@/features/course-management/items-queries", () => ({
  listItems: vi.fn(),
}))

import { loadCoursePreviewCurriculum } from "../server-actions"
import { verifySession } from "@/lib/auth/dal"
import { getCourse } from "@/features/course-management/queries"
import { listChapters } from "@/features/course-management/chapters-queries"
import { listLessons } from "@/features/course-management/lessons-queries"
import { listItems } from "@/features/course-management/items-queries"

describe("loadCoursePreviewCurriculum", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockUser = {
      id: 1,
      role: "TEACHER",
      email: "test@test.com",
      name: "Test",
      phone_number: null,
      is_active: true,
      created_at: "2024-01-01",
    }
    vi.mocked(verifySession).mockResolvedValue(mockUser as never)
    vi.mocked(getCourse).mockResolvedValue({ id: 42 } as never)
    vi.mocked(listChapters).mockResolvedValue([
      { id: 10, course_id: 42, title: "Chapter 1", order: 1 },
    ])
    vi.mocked(listLessons).mockResolvedValue([
      {
        id: 20,
        course_id: 42,
        chapter_id: 10,
        title: "Lesson 1",
        description: "Desc",
        order: 1,
      },
    ])
    vi.mocked(listItems).mockResolvedValue([
      {
        id: 30,
        lesson_id: 20,
        title: "Item 1",
        bunny_stream_id: "vid123",
        bunny_stream_status: null,
        document_path: null,
        exam_id: null,
        order: 1,
      },
    ])
  })

  it("returns sections on success", async () => {
    const result = await loadCoursePreviewCurriculum(42)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe("Chapter 1")
      expect(result.data[0].lessons[0].title).toBe("Lesson 1")
    }
    expect(listItems).toHaveBeenCalledWith(42, 20)
  })

  it("returns error when session is null", async () => {
    vi.mocked(verifySession).mockResolvedValue(null)
    const result = await loadCoursePreviewCurriculum(42)
    expect(result.success).toBe(false)
  })

  it("exposes content capabilities without exposing protected URLs", async () => {
    vi.mocked(listItems).mockResolvedValue([
      {
        id: 30,
        lesson_id: 20,
        title: "Item 1",
        bunny_stream_id: "vid123",
        bunny_stream_status: null,
        document_path: "/secret/doc.pdf",
        exam_id: null,
        order: 1,
      },
    ])
    const result = await loadCoursePreviewCurriculum(42)
    expect(result.success).toBe(true)
    if (result.success) {
      const item = result.data[0].lessons[0].items[0]
      expect(item.hasVideo).toBe(true)
      expect(item.hasDocument).toBe(true)
      expect(item).not.toHaveProperty("document_path")
    }
  })

  it("keeps lessons without chapters in a flat-course section", async () => {
    vi.mocked(listChapters).mockResolvedValue([])
    vi.mocked(listLessons).mockResolvedValue([
      {
        id: 20,
        course_id: 42,
        chapter_id: null,
        title: "Flat lesson",
        description: null,
        order: 1,
      },
    ])

    const result = await loadCoursePreviewCurriculum(42)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toMatchObject({ title: null })
      expect(result.data[0].lessons[0].title).toBe("Flat lesson")
    }
  })

  it("checks access to the course before returning curriculum", async () => {
    await loadCoursePreviewCurriculum(42)
    expect(getCourse).toHaveBeenCalledWith(42)
  })

  it("returns empty sections when no chapters", async () => {
    vi.mocked(listChapters).mockResolvedValue([])
    vi.mocked(listLessons).mockResolvedValue([])
    const result = await loadCoursePreviewCurriculum(42)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(0)
    }
  })

  it("returns error on exception", async () => {
    vi.mocked(listChapters).mockRejectedValue(new Error("Network error"))
    const result = await loadCoursePreviewCurriculum(42)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe("Server")
    }
  })
})
