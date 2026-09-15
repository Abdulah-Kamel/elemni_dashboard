import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { StudentActivityCard } from "../student-activity-card"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

const activity = [
  {
    id: "1",
    studentName: "Ahmed Ali",
    studentInitials: "AA",
    studentTint: "violet" as const,
    action: { kind: "completed_lesson" as const, n: 1 },
    course: "Math 101",
    status: "success" as const,
    time: { unit: "hours" as const, n: 2 },
    actionLabel: "Completed lesson",
    timeLabel: "2h ago",
  },
]

const headers = {
  student: "Student",
  action: "Action",
  course: "Course",
  status: "Status",
  date: "Date",
}

const statuses = { success: "Success", pending: "Pending" }

const filters = {
  searchPlaceholder: "Search...",
  noResults: "No results",
  allActions: "All actions",
  allCourses: "All courses",
  allStatuses: "All statuses",
  completedLesson: "Completed lesson",
  submittedAssignment: "Submitted assignment",
  enrolled: "Enrolled",
}

describe("StudentActivityCard responsive", () => {
  it("renders table rows inside a scrollable container", () => {
    render(
      <StudentActivityCard
        activity={activity}
        title="Activity"
        headers={headers}
        statuses={statuses}
        filters={filters}
      />
    )

    const tableContainer = document.querySelector('[data-slot="table-container"]')
    expect(tableContainer).toBeTruthy()
    expect(tableContainer?.className).toContain("overflow-x-auto")
  })

  it("applies min-width to grid rows to prevent column squishing", () => {
    render(
      <StudentActivityCard
        activity={activity}
        title="Activity"
        headers={headers}
        statuses={statuses}
        filters={filters}
      />
    )

    const headerRow = document.querySelector("thead tr")
    expect(headerRow?.className).toContain("min-w-[640px]")

    const bodyRow = document.querySelector("tbody tr")
    expect(bodyRow?.className).toContain("min-w-[640px]")
  })

  it("stacks filter controls vertically on small screens", () => {
    const { container } = render(
      <StudentActivityCard
        activity={activity}
        title="Activity"
        headers={headers}
        statuses={statuses}
        filters={filters}
      />
    )

    const filterBar = container.querySelector(".flex.flex-col.gap-3")
    expect(filterBar).toBeTruthy()
    expect(filterBar?.className).toContain("lg:flex-row")
  })
})
