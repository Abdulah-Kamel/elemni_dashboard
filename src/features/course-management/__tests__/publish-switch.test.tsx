import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
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

vi.mock("@/features/course-management/hooks/use-course-management-queries", () => ({
  useCourseMutations: () => ({
    publish: { mutateAsync: vi.fn(), isPending: false },
    unpublish: { mutateAsync: vi.fn(), isPending: false },
  }),
}))

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

  it("disables the switch when disabled prop is true", () => {
    renderWithIntl(
      <PublishSwitch courseId={1} teacherProfileId={7} isPublished={false} disabled />
    )
    const publishSwitch = screen.getByRole("switch", { name: "حالة النشر" })
    expect(publishSwitch.getAttribute("disabled")).not.toBeNull()
    expect(publishSwitch.className).toContain("cursor-not-allowed")
    expect(publishSwitch.className).not.toContain("cursor-wait")
  })

  it("calls onPublishedChange after a successful publish mutation", async () => {
    const onPublishedChange = vi.fn()
    const mockPublish = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@/features/course-management/hooks/use-course-management-queries", () => ({
      useCourseMutations: () => ({
        publish: { mutateAsync: mockPublish, isPending: false },
        unpublish: { mutateAsync: vi.fn(), isPending: false },
      }),
    }))

    const { PublishSwitch: FreshPublishSwitch } = await import("../components/publish-switch")
    renderWithIntl(
      <FreshPublishSwitch
        courseId={1}
        teacherProfileId={7}
        isPublished={false}
        onPublishedChange={onPublishedChange}
      />
    )
    fireEvent.click(screen.getByRole("switch", { name: "حالة النشر" }))
    await vi.waitFor(() =>
      expect(onPublishedChange).toHaveBeenCalledWith(true)
    )
  })

  it("syncs display when isPublished prop changes without remount", () => {
    const queryClient = new QueryClient()
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <NextIntlClientProvider locale="ar" messages={messages}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </NextIntlClientProvider>
    )

    const { rerender } = render(
      <Wrapper>
        <PublishSwitch courseId={1} teacherProfileId={7} isPublished={false} />
      </Wrapper>
    )
    expect(screen.getByText("مسودة")).toBeTruthy()
    expect(screen.getByRole("switch", { name: "حالة النشر" }).getAttribute("aria-checked")).toBe("false")

    rerender(
      <Wrapper>
        <PublishSwitch courseId={1} teacherProfileId={7} isPublished={true} />
      </Wrapper>
    )
    expect(screen.getByText("منشور")).toBeTruthy()
    expect(screen.getByRole("switch", { name: "حالة النشر" }).getAttribute("aria-checked")).toBe("true")
  })
})
