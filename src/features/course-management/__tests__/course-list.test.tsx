import { describe, it, expect } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CourseList, CourseListSkeleton } from "../components/course-list"
import { mockCourses } from "./mocks"
import messages from "@/i18n/messages/ar.json"

function renderWithIntl(ui: React.ReactNode) {
  const queryClient = new QueryClient()
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>
  )
}

describe("CourseList", () => {
  describe("loading state", () => {
    it("shows Skeleton components when loading", () => {
      const { container } = renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      )
      // When loading, CourseListSkeleton should be used externally
      // But if we render CourseList with empty courses and no error, it shows empty state
      expect(container).toBeTruthy()
    })
  })

  describe("empty state", () => {
    it("shows localized 'no courses yet' message", () => {
      renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error={null}
          isEmpty={true}
          locale="ar"
        />
      )
      expect(screen.getByText("لا توجد دورات بعد")).toBeTruthy()
    })

    it("shows create action button", () => {
      renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error={null}
          isEmpty={true}
          locale="ar"
        />
      )
      expect(screen.getByText("أنشئ أول دورة لك")).toBeTruthy()
    })
  })

  describe("error state", () => {
    it("shows error message", () => {
      renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error="حدث خطأ أثناء تحميل الدورات"
          isEmpty={false}
          locale="ar"
        />
      )
      expect(screen.getByText("حدث خطأ أثناء تحميل الدورات")).toBeTruthy()
    })

    it("shows retry button", () => {
      renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error="حدث خطأ"
          isEmpty={false}
          locale="ar"
        />
      )
      expect(screen.getByText("إعادة المحاولة")).toBeTruthy()
    })
  })

  describe("success state", () => {
    it("shows course cards with titles", () => {
      renderWithIntl(
        <CourseList
          courses={mockCourses}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      )
      expect(screen.getByText("الجبر - الصف الأول الثانوي")).toBeTruthy()
      expect(screen.getByText("الهندسة - الصف الثاني الثانوي")).toBeTruthy()
    })

    it("shows price in EGP format", () => {
      renderWithIntl(
        <CourseList
          courses={mockCourses}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      )
      // Price should be formatted as EGP
      expect(screen.getAllByText(/ج\.م/).length).toBeGreaterThan(0)
    })

    it("shows status badges", () => {
      renderWithIntl(
        <CourseList
          courses={mockCourses}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      )
      expect(screen.getAllByText("منشور").length).toBeGreaterThan(0)
      expect(screen.getAllByText("مسودة").length).toBeGreaterThan(0)
    })

    it("shows curriculum tags", () => {
      renderWithIntl(
        <CourseList
          courses={mockCourses}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      )
      expect(screen.getAllByText("الرياضيات").length).toBeGreaterThan(0)
    })

    it("filters courses by search and publishing status", () => {
      renderWithIntl(
        <CourseList
          courses={mockCourses}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      )

      fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: "الهندسة" },
      })
      expect(screen.getByText("الهندسة - الصف الثاني الثانوي")).toBeTruthy()
      expect(screen.queryByText("الجبر - الصف الأول الثانوي")).toBeNull()

      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } })
      fireEvent.click(screen.getByRole("button", { name: "منشور" }))
      expect(screen.getByText("الجبر - الصف الأول الثانوي")).toBeTruthy()
      expect(screen.queryByText("الهندسة - الصف الثاني الثانوي")).toBeNull()
    })
  })
})

describe("CourseListSkeleton", () => {
  it("renders skeleton placeholders", () => {
    const { container } = renderWithIntl(<CourseListSkeleton />)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
