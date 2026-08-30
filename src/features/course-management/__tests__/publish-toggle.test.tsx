import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PublishToggle } from "../components/publish-toggle"
import { DropdownMenu } from "@/components/ui/dropdown-menu"

const messages = {
  courses: {
    publish: "نشر",
    unpublish: "إلغاء النشر",
  },
}

function renderWithIntl(ui: React.ReactNode) {
  const queryClient = new QueryClient()
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <DropdownMenu open>{ui}</DropdownMenu>
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}

describe("PublishToggle", () => {
  it("renders publish option for draft courses", () => {
    renderWithIntl(
      <PublishToggle courseId={1} teacherProfileId={7} isPublished={false} />
    )
    expect(screen.getByText("نشر")).toBeTruthy()
  })

  it("renders unpublish option for published courses", () => {
    renderWithIntl(
      <PublishToggle courseId={1} teacherProfileId={7} isPublished={true} />
    )
    expect(screen.getByText("إلغاء النشر")).toBeTruthy()
  })

  it("is enabled by default (no local pre-gate)", () => {
    renderWithIntl(
      <PublishToggle courseId={1} teacherProfileId={7} isPublished={false} />
    )
    const item = screen.getByText("نشر")
    expect(item).toBeTruthy()
    // The item should not be disabled
    expect(item.closest("[data-disabled]")).toBeNull()
  })
})
