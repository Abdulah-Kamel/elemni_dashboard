import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TeachersList } from "@/features/admin/components/teachers-list"

const url = vi.hoisted(() => ({ search: "" }))
const dialog = vi.hoisted(() => ({ props: null as null | { open: boolean; onOpenChange: (open: boolean) => void } }))

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(url.search),
}))
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}))
vi.mock("@/features/admin/components/teacher-create-dialog", () => ({
  TeacherCreateDialog: (props: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    dialog.props = props
    return props.open ? <div role="dialog">create-teacher</div> : null
  },
}))
vi.mock("@/features/admin/components/teacher-sheet", () => ({
  TeacherSheet: ({ teacherId }: { teacherId: number | null }) => (teacherId ? <div data-testid="sheet">{teacherId}</div> : null),
}))

const teacher = (id: number, name: string, has_library: boolean) => ({
  id,
  email: `t${id}@example.com`,
  name,
  slug: `t${id}`,
  phone_number: null,
  teacher_profile_id: id,
  bandwidth_cost_per_gb: "1.00",
  storage_cost_per_gb_monthly: "1.00",
  is_active: true,
  created_at: `2026-08-0${id}T10:00:00+00:00`,
  subjects: [],
  grades: [],
  has_library,
})

vi.mock("@/features/admin/hooks/use-teachers-queries", () => ({
  useTeachersQuery: () => ({
    data: { total: 3, skip: 0, limit: 100, items: [teacher(1, "Zed", true), teacher(2, "Amy", false), teacher(3, "Bob", false)] },
    isLoading: false,
    isError: false,
    isFetching: false,
    isPlaceholderData: false,
  }),
  useTeacherMutations: () => ({ update: { mutateAsync: vi.fn(), isPending: false } }),
}))

function names() {
  return within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((tr) => within(tr).getAllByRole("button")[0].textContent)
}

describe("TeachersList URL state", () => {
  beforeEach(() => {
    url.search = ""
    window.history.replaceState(null, "", "/en/admin/teachers")
  })

  it("filters by library status and sorts by name from the URL", () => {
    url.search = "library=missing&sort=name"
    render(<TeachersList />)
    expect(names()).toEqual(["Amy", "Bob"])
    expect(screen.getByRole("columnheader", { name: /table_name/ }).getAttribute("aria-sort")).toBe("ascending")
  })

  it("opens the side panel for the teacher named in ?view", () => {
    url.search = "view=2"
    render(<TeachersList />)
    expect(screen.getByTestId("sheet").textContent).toBe("2")
  })

  it("writes the view param when a row name is activated", () => {
    render(<TeachersList />)
    fireEvent.click(screen.getByRole("button", { name: "Amy" }))
    expect(window.location.search).toBe("?view=2")
  })

  it("opens the create dialog for ?create=1 and drops the param on close", () => {
    url.search = "create=1&status=active"
    window.history.replaceState(null, "", "/en/admin/teachers?create=1&status=active")
    render(<TeachersList />)
    expect(screen.getByRole("dialog").textContent).toBe("create-teacher")
    dialog.props?.onOpenChange(false)
    expect(window.location.search).toBe("?status=active")
  })
})
