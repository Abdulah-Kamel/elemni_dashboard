import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Topbar } from "./topbar"

vi.mock("next-intl", () => ({
  useTranslations: vi.fn().mockReturnValue((key: string) => {
    const messages: Record<string, string> = {
      controls: "Topbar controls",
    }

    return messages[key] ?? key
  }),
}))

vi.mock("@/features/shell/components/locale-toggle", () => ({
  LocaleToggle: () => <button type="button">Locale</button>,
}))

vi.mock("@/features/shell/components/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}))

vi.mock("@/features/shell/components/account-menu", () => ({
  AccountMenu: ({ teacherName }: { teacherName: string }) => (
    <button type="button">Account {teacherName}</button>
  ),
}))

describe("Topbar", () => {
  it("keeps removed utilities out and groups the remaining controls in polished chrome", () => {
    render(<Topbar teacherName="Abdullah" />)

    expect(screen.queryByRole("searchbox")).toBeNull()
    expect(screen.queryByLabelText("help")).toBeNull()
    expect(screen.queryByLabelText("notifications")).toBeNull()

    const controls = screen.getByRole("group", { name: "Topbar controls" })
    expect(controls.className).toContain("rounded-2xl")
    expect(controls.className).toContain("border")
    expect(controls.className).toContain("bg-surface-raised")
  })
})
