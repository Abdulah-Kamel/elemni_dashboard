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

describe("RTL directional icons", () => {
  it("uses a direction-neutral overflow icon", () => {
    const { container } = renderWithIntl(
      <CourseCardActions
        courseId={1}
        isPublished={false}
        teacherProfileId={7}
      />
    )
    const trigger = container.querySelector(
      '[data-slot="dropdown-menu-trigger"]'
    )
    expect(trigger).toBeTruthy()
    expect(trigger?.querySelector("svg")?.className.baseVal).not.toContain(
      "rtl:rotate-180"
    )
  })
})
