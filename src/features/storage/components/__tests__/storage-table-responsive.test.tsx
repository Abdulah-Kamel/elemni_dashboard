import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { StorageTable } from "../storage-table"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}))

const row = {
  id: 1,
  title: "Advanced Math",
  subject: "Math",
  grade: "10",
  stream: "Science",
  lessonCount: 12,
  itemCount: 48,
  videoCount: 10,
  documentCount: 20,
  examCount: 18,
  otherCount: 0,
  subscriptionCount: 35,
  status: "published" as const,
}

describe("StorageTable responsive", () => {
  it("renders table inside a scrollable container", () => {
    render(<StorageTable rows={[row]} />)

    const tableContainer = document.querySelector('[data-slot="table-container"]')
    expect(tableContainer).toBeTruthy()
    expect(tableContainer?.className).toContain("overflow-x-auto")
  })

  it("applies min-width to the table for contained scrolling", () => {
    render(<StorageTable rows={[row]} />)

    const table = document.querySelector("table")
    expect(table?.className).toContain("min-w-[800px]")
  })

  it("hides non-essential columns on mobile via hidden md:table-cell", () => {
    render(<StorageTable rows={[row]} />)

    const allCells = document.querySelectorAll("tbody td")
    const hiddenCells = document.querySelectorAll("tbody td.hidden.md\\:table-cell")
    const visibleCells = document.querySelectorAll("tbody td:not(.hidden)")

    expect(allCells.length).toBe(9)
    expect(hiddenCells.length).toBe(4)
    expect(visibleCells.length).toBe(5)
  })

  it("hides non-essential header columns on mobile", () => {
    render(<StorageTable rows={[row]} />)

    const hiddenHeaders = document.querySelectorAll("thead th.hidden.md\\:table-cell")
    expect(hiddenHeaders.length).toBe(4)
  })

  it("stacks filters cleanly below xl breakpoint", () => {
    const { container } = render(<StorageTable rows={[row]} />)

    const filterGrid = container.querySelector(".grid.gap-3")
    expect(filterGrid?.className).toContain("xl:grid-cols-")
    expect(filterGrid?.className).toContain("sm:grid-cols-2")
  })
})
