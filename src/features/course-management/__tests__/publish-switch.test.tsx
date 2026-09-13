import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PublishSwitch } from "../components/publish-switch"

const messages = {
  courses: {
    published: "منشور",
    draft: "مسودة",
    published_status: "حالة النشر",
    error_upstream: "تعذر تنفيذ العملية.",
  },
}

function renderWithIntl(ui: React.ReactNode) {
  const queryClient = new QueryClient()
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>
  )
}

describe("PublishSwitch", () => {
  it("shows published badge and checked switch for published courses", () => {
    renderWithIntl(
      <PublishSwitch courseId={1} teacherProfileId={7} isPublished={true} />
    )
    expect(screen.getByText("منشور")).toBeTruthy()
    expect(
      screen.getByRole("switch", { name: "حالة النشر" }).getAttribute("aria-checked")
    ).toBe("true")
  })

  it("shows draft badge and unchecked switch for unpublished courses", () => {
    renderWithIntl(
      <PublishSwitch courseId={1} teacherProfileId={7} isPublished={false} />
    )
    expect(screen.getByText("مسودة")).toBeTruthy()
    expect(
      screen.getByRole("switch", { name: "حالة النشر" }).getAttribute("aria-checked")
    ).toBe("false")
  })
})
