import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/en.json"
import { ChapterList } from "../components/chapter-list"
import { LessonList } from "../components/lesson-list"
import type { ChapterOut } from "../chapters-schema"
import type { LessonOut } from "../lessons-schema"

vi.mock("@formkit/auto-animate/react", () => ({ useAutoAnimate: () => [null] }))
vi.mock("../hooks/use-course-management-queries", () => ({
  useChaptersQuery: (_id: number, data: ChapterOut[]) => ({ data }),
  useLessonsQuery: (_id: number, _chapterId: number, data: LessonOut[]) => ({ data }),
  useChapterMutations: () => ({ create: {}, reorder: {}, update: {}, remove: {} }),
  useLessonMutations: () => ({ create: {}, reorder: {}, update: {}, remove: {} }),
  itemsQueryOptions: (_courseId: number, lessonId: number) => ({
    queryKey: ["items", lessonId], queryFn: async () => [],
  }),
}))

function renderList(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>
  )
}

describe("curriculum numbering", () => {
  it.each([{ orders: [1] }, { orders: [1, 2] }, { orders: [1, 1.5, 3] }])("numbers chapters by list position for orders $orders", ({ orders }) => {
    const chapters = orders.map((order, index) => ({ id: index + 1, course_id: 42, title: `Unit ${index + 1}`, order }))
    renderList(<ChapterList initialChapters={chapters} courseId={42} error={null} />)
    expect(screen.getByText("Chapter 1")).toBeDefined()
    if (orders.length > 1) expect(screen.getByText("Chapter 2")).toBeDefined()
    if (orders.length > 2) expect(screen.getByText("Chapter 3")).toBeDefined()
  })

  it.each([{ orders: [1, 2] }, { orders: [1, 1.5, 3] }])("numbers lessons by list position for orders $orders", ({ orders }) => {
    const lessons = orders.map((order, index) => ({ id: index + 1, course_id: 42, chapter_id: null, title: `Lesson ${index + 1}`, description: null, order }))
    renderList(<LessonList initialLessons={lessons} courseId={42} error={null} />)
    expect(screen.getByText("1. Lesson 1")).toBeDefined()
    expect(screen.getByText("2. Lesson 2")).toBeDefined()
    if (orders.length > 2) expect(screen.getByText("3. Lesson 3")).toBeDefined()
  })
})
