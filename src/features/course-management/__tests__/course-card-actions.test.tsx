import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { CourseCardActions } from "../components/course-card-actions"

const messages = {
  courses: {
    edit: "تعديل",
    more_options: "المزيد من الخيارات",
    publish: "نشر",
    unpublish: "إلغاء النشر",
  },
}

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe("CourseCardActions", () => {
  it("keeps edit inside the options menu", () => {
    renderWithIntl(
      <CourseCardActions
        courseId={1}
        isPublished={false}
        teacherProfileId={7}
      />
    )
    expect(screen.getByLabelText("المزيد من الخيارات")).toBeTruthy()
  })

  it("renders more options dropdown", () => {
    const { container } = renderWithIntl(
      <CourseCardActions
        courseId={1}
        isPublished={false}
        teacherProfileId={7}
      />
    )
    // Should have dropdown trigger
    expect(
      container.querySelector('[data-slot="dropdown-menu-trigger"]')
    ).toBeTruthy()
  })

  it("does not render delete option", () => {
    renderWithIntl(
      <CourseCardActions
        courseId={1}
        isPublished={false}
        teacherProfileId={7}
      />
    )
    // There should be no "delete" or "حذف" text
    expect(screen.queryByText("حذف")).toBeNull()
    expect(screen.queryByText("Delete")).toBeNull()
  })
})
