import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CourseCard } from "../components/course-card"
import type { CourseOut } from "@/features/shell/schema"
import messages from "@/i18n/messages/ar.json"

function renderWithIntl(ui: React.ReactNode) {
  const queryClient = new QueryClient()
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>
  )
}

const mockCourse: CourseOut = {
  id: 1,
  title: "الجبر - الصف الأول الثانوي",
  description: "مقدمة في الجبر",
  price: "150.00",
  is_published: true,
  use_chapters: true,
  subject_id: 1,
  subject_name: "الرياضيات",
  teacher_profile_id: 7,
  grade_id: 3,
  stream_id: 1,
  created_by_id: 7,
  created_at: "2026-06-15T08:00:00Z",
}

describe("CourseCard", () => {
  it("renders course title", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    )
    expect(screen.getByText("الجبر - الصف الأول الثانوي")).toBeTruthy()
  })

  it("renders price in EGP format", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    )
    // Price should be formatted with EGP currency
    expect(screen.getByText(/ج\.م/)).toBeTruthy()
  })

  it("shows published badge for published courses", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    )
    expect(screen.getByText("منشور")).toBeTruthy()
  })

  it("shows draft badge for unpublished courses", () => {
    const draftCourse = { ...mockCourse, is_published: false }
    renderWithIntl(
      <CourseCard course={draftCourse} teacherProfileId={7} locale="ar" />
    )
    expect(screen.getByText("مسودة")).toBeTruthy()
  })

  it("renders subject name badge", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    )
    expect(screen.getByText("الرياضيات")).toBeTruthy()
  })

  it("renders the course organization mode", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    )
    expect(screen.getByText("دورة بالفصول")).toBeTruthy()
  })

  it("shows 'Free' for zero price", () => {
    const freeCourse = { ...mockCourse, price: "0.00" }
    renderWithIntl(
      <CourseCard course={freeCourse} teacherProfileId={7} locale="ar" />
    )
    expect(screen.getByText("مجانية")).toBeTruthy()
  })

  it("keeps draft course content fully legible", () => {
    const draftCourse = { ...mockCourse, is_published: false }
    const { container } = renderWithIntl(
      <CourseCard course={draftCourse} teacherProfileId={7} locale="ar" />
    )
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).not.toContain("opacity-75")
  })

  it("renders a real course cover when img is present", () => {
    renderWithIntl(
      <CourseCard
        course={{ ...mockCourse, img: "https://cdn.example.com/courses/1" }}
        teacherProfileId={7}
        locale="ar"
      />
    )
    expect(
      screen.getByRole("img", { name: mockCourse.title }).getAttribute("src")
    ).toBe("https://cdn.example.com/courses/1")
  })

  it("renders curriculum names and a manage link", () => {
    renderWithIntl(
      <CourseCard
        course={mockCourse}
        teacherProfileId={7}
        locale="ar"
        gradeName="الصف الأول الثانوي"
        streamName="علمي"
      />
    )
    expect(screen.getByText("الصف الأول الثانوي")).toBeTruthy()
    expect(screen.getByText("علمي")).toBeTruthy()
    expect(
      screen.getByRole("link", { name: "إدارة الدورة" }).getAttribute("href")
    ).toBe("/ar/courses/1")
  })
})
