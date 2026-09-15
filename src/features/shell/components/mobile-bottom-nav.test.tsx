import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MobileBottomNav } from "./mobile-bottom-nav"

vi.mock("next-intl", () => ({
  useTranslations: vi.fn().mockReturnValue((key: string) => {
    const messages: Record<string, string> = {
      overview: "Overview",
      my_courses: "My Courses",
      students: "Students",
      earnings: "Earnings",
      profile: "Profile",
      storage: "Storage",
      settings: "Settings",
      more: "More",
      catalog: "Catalog",
      teachers: "Teachers",
      subscriptions: "Subscriptions",
      coupons: "Coupons",
      grades: "Grades",
      streams: "Streams",
      subjects: "Subjects",
    }
    return messages[key] ?? key
  }),
}))

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, className, children, ...props }: { href: string; className?: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
  usePathname: vi.fn().mockReturnValue("/dashboard"),
}))

describe("MobileBottomNav", () => {
  it("renders all teacher nav items", () => {
    render(<MobileBottomNav />)

    expect(screen.queryByText("Overview")).not.toBeNull()
    expect(screen.queryByText("My Courses")).not.toBeNull()
    expect(screen.queryByText("Students")).not.toBeNull()
    expect(screen.queryByText("Earnings")).not.toBeNull()
    expect(screen.queryByText("Profile")).not.toBeNull()
    expect(screen.queryByText("Storage")).not.toBeNull()
    expect(screen.queryByText("Settings")).not.toBeNull()
  })

  it("has minimum touch target size of 44px", () => {
    render(<MobileBottomNav />)

    const links = screen.getAllByRole("link")
    links.forEach((link) => {
      expect(link.className).toContain("min-h-11")
      expect(link.className).toContain("min-w-11")
    })
  })

  it("truncates long labels", () => {
    render(<MobileBottomNav />)

    const labels = screen.getAllByText(/(Overview|My Courses|Students|Earnings|Profile|Storage|Settings)/)
    labels.forEach((label) => {
      expect(label.className).toContain("truncate")
      expect(label.className).toContain("max-w-[60px]")
    })
  })

  it("renders admin nav items when userRole is ADMIN", () => {
    render(<MobileBottomNav userRole="ADMIN" />)

    expect(screen.queryByText("Overview")).not.toBeNull()
    expect(screen.queryByText("Teachers")).not.toBeNull()
    expect(screen.queryByText("Students")).not.toBeNull()
    expect(screen.queryByText("Subscriptions")).not.toBeNull()
    expect(screen.queryByText("Coupons")).not.toBeNull()
    expect(screen.queryByText("More")).not.toBeNull()
  })

  it("hides on md+ screens", () => {
    render(<MobileBottomNav />)

    const nav = screen.getByRole("navigation")
    expect(nav.className).toContain("md:hidden")
  })

  it("applies safe-area-bottom for iOS inset support", () => {
    render(<MobileBottomNav />)

    const nav = screen.getByRole("navigation")
    expect(nav.className).toContain("safe-area-bottom")
  })
})
