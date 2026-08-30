import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/en.json"
import { CourseBuilderBridgeProvider, useCourseBuilderBridge } from "../course-builder-bridge"
import { ChapterCard } from "../components/chapter-card"
import type { ChapterOut } from "../chapters-schema"
import type { LessonOut } from "../lessons-schema"

vi.mock("@/features/course-management/chapters-actions", () => ({
  updateChapter: vi.fn(),
  deleteChapter: vi.fn(),
}))

vi.mock("@/features/course-management/lessons-actions", () => ({
  updateLesson: vi.fn(),
  deleteLesson: vi.fn(),
}))

vi.mock("@/features/course-management/items-actions", () => ({
  listItems: vi.fn(async () => ({
    success: true,
    data: [
      {
        id: 20,
        lesson_id: 10,
        title: "Item 1",
        bunny_stream_id: null,
        bunny_stream_status: null,
        document_path: null,
        exam_id: null,
        order: 1,
      },
    ],
  })),
  createItem: vi.fn(),
  reorderItems: vi.fn(),
  updateItem: vi.fn(),
  confirmUpload: vi.fn(),
  confirmVideoUpload: vi.fn(),
  requestUploadUrl: vi.fn(),
  requestVideoUpload: vi.fn(),
}))

const chapter: ChapterOut = {
  id: 1,
  course_id: 42,
  title: "Chapter 1",
  order: 1,
}

const lesson: LessonOut = {
  id: 10,
  course_id: 42,
  chapter_id: 1,
  title: "Lesson 1",
  description: null,
  order: 1,
}

function SelectPreviewItem() {
  const { selectNode } = useCourseBuilderBridge()
  return (
    <button
      type="button"
      onClick={() => selectNode({ type: "item", id: 20, chapterId: 1, lessonId: 10 })}
    >
      Select preview item
    </button>
  )
}

describe("course builder selection", () => {
  it("opens collapsed chapter and lesson before focusing the selected item", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QueryClientProvider client={queryClient}>
          <CourseBuilderBridgeProvider>
            <SelectPreviewItem />
            <ChapterCard
              chapter={chapter}
              courseId={42}
              initialLessons={[lesson]}
              lessonsError={null}
              defaultExpanded={false}
            />
          </CourseBuilderBridgeProvider>
          </QueryClientProvider>
      </NextIntlClientProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Select preview item" }))

    await waitFor(() => {
      const selectedItem = document.querySelector(
        '[data-builder-node-type="item"][data-builder-node-state="selected"]'
      )
      expect(selectedItem).not.toBeNull()
      expect(selectedItem?.textContent).toContain("Item 1")
      expect(document.activeElement).toBe(selectedItem)
    })
  })
})
