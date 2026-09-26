import { render, screen, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it, vi } from "vitest"
import { messagesFor } from "@/i18n/messages/load"
import { CommandPaletteProvider } from "@/features/command-palette/command-palette"
import { Topbar } from "./topbar"

const pathname = vi.hoisted(() => ({ current: "/dashboard" }))

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => pathname.current,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

function renderTopbar(role: "teacher" | "admin", path: string) {
  pathname.current = path
  return render(
    <NextIntlClientProvider locale="en" messages={messagesFor("en")}>
      <CommandPaletteProvider role={role}>
        <Topbar userName="Abdullah Kamel" roleLabel="Teacher" role={role} />
      </CommandPaletteProvider>
    </NextIntlClientProvider>
  )
}

describe("Topbar", () => {
  it("names the current section from the nav config", () => {
    renderTopbar("teacher", "/students")
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(within(crumbs).getByText("Students & Subscriptions").getAttribute("aria-current")).toBe("page")
  })

  it("shows a breadcrumb on deeper routes with links back up", () => {
    renderTopbar("teacher", "/courses/12/chapters/4")
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(within(crumbs).getByRole("link", { name: "My Courses" }).getAttribute("href")).toBe("/courses")
    expect(within(crumbs).getByRole("link", { name: "Course" }).getAttribute("href")).toBe("/courses/12")
    expect(within(crumbs).getByText("Chapter").getAttribute("aria-current")).toBe("page")
  })

  it("uses admin sections for admins", () => {
    renderTopbar("admin", "/admin/teachers/7")
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(within(crumbs).getByRole("link", { name: "Teachers" })).toBeTruthy()
    expect(within(crumbs).getByText("Teacher")).toBeTruthy()
  })

  it("groups search, notifications, theme, locale and the account menu", () => {
    renderTopbar("teacher", "/dashboard")
    expect(screen.getAllByRole("button", { name: "Search pages and actions" }).length).toBeGreaterThan(0)
    const controls = screen.getByRole("group", { name: "Quick controls" })
    expect(within(controls).getByRole("button", { name: "Notifications" })).toBeTruthy()
    expect(within(controls).getByRole("button", { name: /Switch to (dark|light) theme/ })).toBeTruthy()
    expect(within(controls).getByRole("button", { name: "العربية" })).toBeTruthy()
    expect(within(controls).getByRole("button", { name: "My Account: Abdullah Kamel" })).toBeTruthy()
  })

  it("stays a 64px sticky bar", () => {
    const { container } = renderTopbar("teacher", "/dashboard")
    const header = container.querySelector("header")!
    expect(header.className).toContain("h-16")
    expect(header.className).toContain("sticky")
  })
})
