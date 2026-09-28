import { fireEvent, render, screen, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { messagesFor } from "@/i18n/messages/load"
import type { Coupon, CouponErrorCode, CouponListQuery } from "../schema"
import { CouponsPage } from "../components/coupons-page"
import { coupon } from "./fixtures"

const url = vi.hoisted(() => ({ search: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(url.search) }))
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))
vi.mock("@/features/admin/hooks/use-teachers-queries", () => ({
  useTeachersQuery: () => ({ data: { items: [], total: 0 }, isLoading: false, isError: false }),
}))

type ListState = { items: Coupon[]; total?: number } | { error: CouponErrorCode } | "loading"
const state = vi.hoisted(() => ({
  list: "loading" as unknown,
  stats: null as unknown,
  refetch: vi.fn(),
  queries: [] as unknown[],
}))

function queryResult(value: unknown) {
  if (value === "loading") return { data: undefined, isLoading: true, isError: false, isFetching: true, isPlaceholderData: false, refetch: state.refetch }
  const listValue = value as { items?: Coupon[]; total?: number; error?: CouponErrorCode }
  const data = listValue.error
    ? { ok: false, error: listValue.error }
    : { ok: true, data: { items: listValue.items ?? [], total: listValue.total ?? listValue.items?.length ?? 0 } }
  return { data, isLoading: false, isError: false, isFetching: false, isPlaceholderData: false, refetch: state.refetch }
}

vi.mock("../hooks/use-coupons", () => ({
  REDEMPTIONS_PAGE_SIZE: 8,
  useCouponList: (query: CouponListQuery) => {
    state.queries.push(query)
    return queryResult(state.list)
  },
  useCouponStats: () =>
    state.stats === null
      ? { data: undefined, isLoading: true, isError: false }
      : { data: state.stats, isLoading: false, isError: false },
  useRedemptions: () => ({ data: { ok: true, data: { items: [], total: 0 } }, isLoading: false, isError: false, isPlaceholderData: false }),
  useCouponMutations: () => {
    const mutation = { mutateAsync: vi.fn(), isPending: false }
    return { create: mutation, update: mutation, toggle: mutation, remove: mutation }
  },
}))

const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
const rows: Coupon[] = [
  coupon(),
  coupon({ code: "LASTSEATS", used_count: 95, max_uses: 100, applies_to: "courses", course_ids: [1, 2] }),
  coupon({ code: "WELCOME50", type: "fixed", value: "50.00", used_count: 0, max_uses: null, expires_at: soon }),
]

function setList(value: ListState) {
  state.list = value
}

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesFor("en")}>
      <CouponsPage />
    </NextIntlClientProvider>,
  )
}

beforeEach(() => {
  url.search = ""
  state.queries = []
  state.refetch.mockReset()
  state.stats = { ok: true, data: { active: 3, expiring_soon: 1, exhausted: 0, total_redemptions: 132, total_discount_given: "1250.50" } }
  window.history.replaceState(null, "", "/en/admin/coupons")
})

describe("CouponsPage", () => {
  it("renders the table with usage, discount, scope and server status", () => {
    setList({ items: rows })
    renderPage()
    const table = screen.getByRole("table")
    const first = within(table).getAllByRole("row")[1]
    expect(within(first).getByText("SAVE20")).toBeTruthy()
    expect(within(first).getByText("37 / 500")).toBeTruthy()
    expect(within(first).getByText("20%")).toBeTruthy()
    expect(within(first).getByText("All courses")).toBeTruthy()
    expect(within(first).getByText("Active")).toBeTruthy()
    expect(within(first).getByRole("button", { name: "Copy code SAVE20" })).toBeTruthy()
    expect(within(table).getByText("2 courses")).toBeTruthy()
    expect(within(table).getByText("EGP 50.00")).toBeTruthy()
    expect(within(table).getAllByRole("meter")).toHaveLength(2)
  })

  it("shows stat tiles that link to filtered views and the attention list", () => {
    setList({ items: rows })
    renderPage()
    expect(screen.getByRole("link", { name: /Active coupons/ }).getAttribute("href")).toBe("/admin/coupons?status=active")
    expect(screen.getByRole("link", { name: /Expiring soon/ }).getAttribute("href")).toBe("/admin/coupons?flag=expiring")
    expect(screen.getByText("EGP 1,250.50")).toBeTruthy()
    const attention = screen.getByRole("region", { name: "Needs attention" })
    expect(within(attention).getByText("Coupon expiring within 7 days").closest("a")?.getAttribute("href")).toBe("/admin/coupons?flag=expiring")
    expect(within(attention).getByText("Coupon near the usage limit (90%+)")).toBeTruthy()
  })

  it("sends table sorting to the API through the URL", () => {
    url.search = "sort=usage&dir=desc&page=2"
    setList({ items: rows, total: 30 })
    renderPage()
    expect(state.queries).toContainEqual({ sort_by: "used_count", sort_order: "desc", skip: 10, limit: 10 })
    expect(screen.getByRole("columnheader", { name: /Usage/ }).getAttribute("aria-sort")).toBe("descending")
    fireEvent.click(screen.getByRole("button", { name: /^Code/ }))
    expect(window.location.search).toBe("?sort=code")
  })

  it("narrows a flag view to the matching coupons", () => {
    url.search = "flag=near_cap"
    setList({ items: rows })
    renderPage()
    const codes = within(screen.getByRole("table")).getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("button")[0].textContent)
    expect(codes).toEqual(["LASTSEATS"])
    expect(screen.getByText("Active, 90%+ of the limit used")).toBeTruthy()
  })

  it("shows a loading skeleton", () => {
    setList("loading")
    const { container } = renderPage()
    expect(container.querySelector("[aria-busy=true]")).toBeTruthy()
  })

  it("invites the admin to create the first coupon when there are none", () => {
    setList({ items: [] })
    state.stats = { ok: true, data: { active: 0, expiring_soon: 0, exhausted: 0, total_redemptions: 0, total_discount_given: "0.00" } }
    renderPage()
    expect(screen.getByRole("heading", { name: "No coupons yet" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Create the first coupon" })).toBeTruthy()
  })

  it("separates a filtered-empty result from having no coupons", () => {
    url.search = "q=zzz"
    setList({ items: [] })
    renderPage()
    expect(screen.queryByText("No coupons yet")).toBeNull()
    expect(screen.getAllByRole("button", { name: /clear/i }).length).toBeGreaterThan(0)
  })

  it("offers a retry when the list fails", () => {
    setList({ error: "upstream" })
    renderPage()
    expect(screen.getByRole("alert").textContent).toContain("Couldn't reach the server")
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(state.refetch).toHaveBeenCalled()
  })

  it("explains that the backend is missing instead of crashing", () => {
    setList({ error: "not_available" })
    state.stats = { ok: false, error: "not_available" }
    renderPage()
    expect(screen.getByRole("status").textContent).toContain("Coupons need the backend")
    expect(screen.getByText("NEXT_PUBLIC_COUPONS_DEMO=1")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "New coupon" })).toBeNull()
    expect(screen.queryByRole("table")).toBeNull()
  })

  it("opens the side panel from ?view and blocks deleting a redeemed coupon", async () => {
    url.search = "view=SAVE20"
    setList({ items: rows })
    renderPage()
    const panel = await screen.findByRole("dialog")
    const remove = within(panel).getByRole("button", { name: "Delete" })
    expect(remove.hasAttribute("disabled")).toBe(true)
    expect(within(panel).getByText(/Used 37 times, so it can't be deleted/)).toBeTruthy()
    expect(within(panel).getByText("No student has used this coupon yet.")).toBeTruthy()
  })
})
