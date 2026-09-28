import { render, screen, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it, vi } from "vitest"
import type { TopEarningCourse } from "@/features/analytics/schema"
import { messagesFor } from "@/i18n/messages/load"
import { TopCourses } from "./top-courses"

vi.mock("@formkit/auto-animate/react", () => ({ useAutoAnimate: () => [null] }))
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, scroll, ...props }: { href: string; children: React.ReactNode; scroll?: boolean }) => (
    <a href={href} data-scroll={String(scroll ?? true)} {...props}>
      {children}
    </a>
  ),
}))

function course(id: number, title: string, earnings: number, subs: number): TopEarningCourse {
  return {
    id,
    title,
    name: title,
    price: 100,
    earning_amount: earnings,
    total_earnings: earnings,
    student_subscription_count: subs,
    subscribed_students_count: subs,
  }
}

function renderList(courses: TopEarningCourse[], isFiltered = false) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesFor("en")}>
      <TopCourses courses={courses} currency="EGP" isFiltered={isFiltered} />
    </NextIntlClientProvider>
  )
}

describe("TopCourses", () => {
  it("ranks courses in API order with API earnings and quick links", () => {
    renderList([course(8, "Physics", 450, 4), course(9, "Chemistry", 225.5, 1)])

    const rows = screen.getAllByRole("listitem")
    expect(rows).toHaveLength(2)
    const first = within(rows[0])
    expect(first.getByText("1")).toBeTruthy()
    expect(first.getByText("EGP 450.00")).toBeTruthy()
    expect(first.getByText("4 subscriptions")).toBeTruthy()
    expect(first.getByRole("link", { name: "Edit Physics" }).getAttribute("href")).toBe("/courses/8")
    expect(first.getByRole("link", { name: "Students of Physics" }).getAttribute("href")).toBe(
      "/students?course=8"
    )
    expect(within(rows[1]).getByText("EGP 225.50")).toBeTruthy()
    expect(within(rows[1]).getByText("1 subscription")).toBeTruthy()
  })

  it("offers all-time when a filtered range has no earnings", () => {
    renderList([], true)
    expect(screen.getByText("No course earnings in this period.")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Show all time" }).getAttribute("href")).toBe("/dashboard")
  })
})
