import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { messagesFor } from "@/i18n/messages/load"
import { CommandPaletteProvider, isPaletteShortcut } from "./command-palette"
import { SearchTrigger } from "./search-trigger"

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }))

vi.mock("@/i18n/routing", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => router,
}))

function renderPalette(role: "teacher" | "admin", locale: "en" | "ar" = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messagesFor(locale)}>
      <CommandPaletteProvider role={role}>
        <SearchTrigger variant="bar" />
      </CommandPaletteProvider>
    </NextIntlClientProvider>
  )
}

function pressShortcut() {
  act(() => {
    fireEvent.keyDown(window, { key: "k", code: "KeyK", ctrlKey: true })
  })
}

function optionLabels() {
  return within(screen.getByRole("listbox"))
    .queryAllByRole("option")
    .map((option) => option.textContent ?? "")
}

beforeEach(() => {
  router.push.mockReset()
  router.replace.mockReset()
})

describe("isPaletteShortcut", () => {
  it("accepts Ctrl/Cmd+K, including on non-Latin layouts", () => {
    const base = { altKey: false, shiftKey: false, metaKey: false, ctrlKey: false }
    expect(isPaletteShortcut({ ...base, key: "k", code: "KeyK", ctrlKey: true })).toBe(true)
    expect(isPaletteShortcut({ ...base, key: "K", code: "KeyK", metaKey: true })).toBe(true)
    expect(isPaletteShortcut({ ...base, key: "ن", code: "KeyK", ctrlKey: true })).toBe(true)
    expect(isPaletteShortcut({ ...base, key: "k", code: "KeyK" })).toBe(false)
    expect(isPaletteShortcut({ ...base, key: "k", code: "KeyK", ctrlKey: true, shiftKey: true })).toBe(false)
  })
})

describe("CommandPalette", () => {
  it("opens with Ctrl+K and lists the teacher's pages and actions", async () => {
    renderPalette("teacher")
    expect(screen.queryByRole("dialog")).toBeNull()
    pressShortcut()
    await screen.findByRole("dialog")
    const labels = optionLabels()
    expect(labels.some((l) => l.startsWith("My Courses"))).toBe(true)
    expect(labels.some((l) => l.startsWith("Create a course"))).toBe(true)
    expect(labels.some((l) => l.startsWith("Teachers"))).toBe(false)
  })

  it("opens from the search trigger and lists admin destinations", async () => {
    renderPalette("admin")
    fireEvent.click(screen.getByRole("button", { name: /Search pages and actions/ }))
    await screen.findByRole("dialog")
    const labels = optionLabels()
    expect(labels.some((l) => l.startsWith("Teachers"))).toBe(true)
    expect(labels.some((l) => l.startsWith("Subjects"))).toBe(true)
    expect(labels.some((l) => l.startsWith("Create a course"))).toBe(false)
  })

  it("filters as you type and shows an empty state", async () => {
    renderPalette("admin")
    pressShortcut()
    const input = await screen.findByRole("combobox")
    fireEvent.change(input, { target: { value: "coup" } })
    expect(optionLabels()[0]).toMatch(/^Coupons/)
    fireEvent.change(input, { target: { value: "qqqq" } })
    expect(optionLabels()).toEqual([])
    expect(screen.getByText("Nothing matches “qqqq”")).toBeTruthy()
  })

  it("normalizes Arabic spelling when filtering", async () => {
    renderPalette("teacher", "ar")
    pressShortcut()
    const input = await screen.findByRole("combobox")
    // "انشاء" without hamza still finds "إنشاء دورة".
    fireEvent.change(input, { target: { value: "انشاء" } })
    expect(optionLabels()[0]).toMatch(/^إنشاء دورة/)
    // Alef maqsura / yaa and taa marbuta / haa are interchangeable.
    fireEvent.change(input, { target: { value: "نظره عامه" } })
    expect(optionLabels()[0]).toMatch(/^نظرة عامة/)
  })

  it("moves with the arrow keys and opens the active item with Enter", async () => {
    renderPalette("teacher")
    pressShortcut()
    const input = await screen.findByRole("combobox")
    const first = screen.getAllByRole("option")[0]
    expect(input.getAttribute("aria-activedescendant")).toBe(first.id)

    fireEvent.keyDown(input, { key: "ArrowDown" })
    const second = screen.getAllByRole("option")[1]
    expect(second.getAttribute("aria-selected")).toBe("true")
    expect(input.getAttribute("aria-activedescendant")).toBe(second.id)

    fireEvent.keyDown(input, { key: "ArrowUp" })
    fireEvent.keyDown(input, { key: "ArrowUp" })
    const options = screen.getAllByRole("option")
    expect(options[options.length - 1].getAttribute("aria-selected")).toBe("true")

    fireEvent.change(input, { target: { value: "students" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(router.push).toHaveBeenCalledWith("/students")
  })

  it("runs the create-course quick action", async () => {
    renderPalette("teacher")
    pressShortcut()
    const input = await screen.findByRole("combobox")
    fireEvent.change(input, { target: { value: "create" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(router.push).toHaveBeenCalledWith("/courses/new")
  })
})
