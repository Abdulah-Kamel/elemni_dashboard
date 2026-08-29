import { describe, it, expect, vi } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { PreviewWorkspace } from "../preview-workspace"
import type { PreviewDeviceWidth } from "../types"

const componentSource = readFileSync(
  join(__dirname, "..", "preview-workspace.tsx"),
  "utf-8"
)

describe("PreviewWorkspace types", () => {
  it("PreviewDeviceWidth covers full, tablet and mobile", () => {
    const widths: PreviewDeviceWidth[] = ["full", "tablet", "mobile"]
    expect(new Set(widths).size).toBe(3)
  })
})

function EditorSlot() {
  return <div data-testid="editor">Editor Content</div>
}

function PreviewSlot() {
  return <div data-testid="preview">Preview Content</div>
}

function renderWorkspace(
  props: Partial<React.ComponentProps<typeof PreviewWorkspace>> = {}
) {
  return render(
    <PreviewWorkspace
      editor={<EditorSlot />}
      preview={<PreviewSlot />}
      locale="ar"
      {...props}
    />
  )
}

const editorPane = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-testid='editor-pane']")
const previewPane = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-testid='preview-pane']")
const previewFrame = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-testid='preview-frame']")
const grid = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-testid='workspace-grid']")

describe("PreviewWorkspace", () => {
  it("renders both editor and preview slots", () => {
    renderWorkspace()
    expect(screen.getAllByTestId("editor")).toHaveLength(1)
    expect(screen.getAllByTestId("preview")).toHaveLength(1)
  })

  it("mounts each slot exactly once — no duplicate desktop/mobile subtrees", () => {
    const { container } = renderWorkspace()
    expect(
      container.querySelectorAll("[data-testid='editor-pane']")
    ).toHaveLength(1)
    expect(
      container.querySelectorAll("[data-testid='preview-pane']")
    ).toHaveLength(1)
  })

  it("renders with .student-preview-workspace class", () => {
    const { container } = renderWorkspace()
    expect(container.querySelector(".student-preview-workspace")).not.toBeNull()
  })

  it("uses split layout (3fr/2fr) on desktop with minmax to prevent overflow", () => {
    const { container } = renderWorkspace()
    expect(grid(container)?.className).toContain("lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]")
  })

  describe("physical placement (direction independent)", () => {
    it("forces the desktop grid to LTR so column 1 is always physically left", () => {
      const { container } = renderWorkspace({ locale: "ar" })
      expect(grid(container)?.getAttribute("dir")).toBe("ltr")
    })

    it("places the preview in column 1 (physical left) and the editor in column 2", () => {
      const { container } = renderWorkspace()
      expect(previewPane(container)?.className).toContain("lg:col-start-1")
      expect(editorPane(container)?.className).toContain("lg:col-start-2")
    })

    it("does not rely on RTL auto-placement — both panes carry explicit col-start", () => {
      const { container } = renderWorkspace()
      for (const pane of [previewPane(container), editorPane(container)]) {
        expect(pane?.className).toMatch(/lg:col-start-[12]/)
      }
    })

    it("restores the document direction inside each pane for ar", () => {
      const { container } = renderWorkspace({ locale: "ar" })
      expect(previewPane(container)?.getAttribute("dir")).toBe("rtl")
      expect(editorPane(container)?.getAttribute("dir")).toBe("rtl")
    })

    it("restores the document direction inside each pane for en", () => {
      const { container } = renderWorkspace({ locale: "en" })
      expect(previewPane(container)?.getAttribute("dir")).toBe("ltr")
      expect(editorPane(container)?.getAttribute("dir")).toBe("ltr")
    })
  })

  describe("compact tabs", () => {
    it("renders Edit and Preview tabs", () => {
      renderWorkspace()
      expect(screen.getByRole("tab", { name: "تعديل" })).toBeDefined()
      expect(screen.getByRole("tab", { name: "معاينة" })).toBeDefined()
    })

    it("labels the tablist", () => {
      renderWorkspace()
      expect(
        screen.getByRole("tablist").getAttribute("aria-label")
      ).toBeTruthy()
    })

    it("marks the edit tab selected by default", () => {
      renderWorkspace()
      expect(
        screen.getByRole("tab", { name: "تعديل" }).getAttribute("aria-selected")
      ).toBe("true")
      expect(
        screen
          .getByRole("tab", { name: "معاينة" })
          .getAttribute("aria-selected")
      ).toBe("false")
    })

    it("wires aria-controls to a tabpanel that is labelled by its tab", () => {
      const { container } = renderWorkspace()
      const editTab = screen.getByRole("tab", { name: "تعديل" })
      const controls = editTab.getAttribute("aria-controls")
      expect(controls).toBeTruthy()
      const panel = document.getElementById(controls!)
      expect(panel).not.toBeNull()
      expect(container.contains(panel)).toBe(true)
      expect(panel?.getAttribute("role")).toBe("tabpanel")
      expect(panel?.getAttribute("aria-labelledby")).toBe(editTab.id)
      expect(panel).toBe(editorPane(container))
    })

    it("uses a roving tabindex", () => {
      renderWorkspace()
      expect(
        screen.getByRole("tab", { name: "تعديل" }).getAttribute("tabindex")
      ).toBe("0")
      expect(
        screen.getByRole("tab", { name: "معاينة" }).getAttribute("tabindex")
      ).toBe("-1")
    })

    it("hides the preview pane below lg while the edit tab is active", () => {
      const { container } = renderWorkspace()
      expect(previewPane(container)?.className).toContain("hidden")
      expect(editorPane(container)?.className).not.toContain("hidden")
    })

    it("hides the editor pane below lg after switching to the preview tab", () => {
      const { container } = renderWorkspace()
      fireEvent.click(screen.getByRole("tab", { name: "معاينة" }))
      expect(editorPane(container)?.className).toContain("hidden")
      expect(previewPane(container)?.className).not.toContain("hidden")
    })

    it("keeps both panes visible from lg up regardless of the active tab", () => {
      const { container } = renderWorkspace()
      expect(previewPane(container)?.className).toContain("lg:block")
      fireEvent.click(screen.getByRole("tab", { name: "معاينة" }))
      expect(editorPane(container)?.className).toContain("lg:block")
    })

    it("moves selection with the End key", () => {
      renderWorkspace()
      fireEvent.keyDown(screen.getByRole("tab", { name: "تعديل" }), {
        key: "End",
      })
      expect(
        screen
          .getByRole("tab", { name: "معاينة" })
          .getAttribute("aria-selected")
      ).toBe("true")
    })

    it("moves selection with arrow keys, mirrored for RTL", () => {
      renderWorkspace({ locale: "ar" })
      fireEvent.keyDown(screen.getByRole("tab", { name: "تعديل" }), {
        key: "ArrowLeft",
      })
      expect(
        screen
          .getByRole("tab", { name: "معاينة" })
          .getAttribute("aria-selected")
      ).toBe("true")
    })

    it("moves selection with arrow keys in LTR", () => {
      renderWorkspace({ locale: "en" })
      fireEvent.keyDown(screen.getByRole("tab", { name: "Edit" }), {
        key: "ArrowRight",
      })
      expect(
        screen
          .getByRole("tab", { name: "Preview" })
          .getAttribute("aria-selected")
      ).toBe("true")
    })
  })

  it("accepts locale prop for Arabic/English labels", () => {
    const { rerender } = renderWorkspace({ locale: "ar" })
    expect(screen.getByRole("tab", { name: "تعديل" })).toBeDefined()
    rerender(
      <PreviewWorkspace
        editor={<EditorSlot />}
        preview={<PreviewSlot />}
        locale="en"
      />
    )
    expect(screen.getByRole("tab", { name: "Edit" })).toBeDefined()
  })

  it("falls back to English for an unknown locale", () => {
    renderWorkspace({ locale: "fr" })
    expect(screen.getByRole("tab", { name: "Edit" })).toBeDefined()
  })

  describe("device width controls", () => {
    it("renders full, tablet and mobile radios", () => {
      renderWorkspace()
      expect(screen.getByRole("radio", { name: "كامل" })).toBeDefined()
      expect(screen.getByRole("radio", { name: "تابلت" })).toBeDefined()
      expect(screen.getByRole("radio", { name: "موبايل" })).toBeDefined()
    })

    it("labels the device radiogroup", () => {
      renderWorkspace()
      const groups = screen.getAllByRole("radiogroup")
      for (const group of groups) {
        expect(group.getAttribute("aria-label")).toBeTruthy()
      }
    })

    it("defaults to full device width", () => {
      renderWorkspace()
      expect(
        screen.getByRole("radio", { name: "كامل" }).getAttribute("aria-checked")
      ).toBe("true")
    })

    it("changes device width on radio click", () => {
      const onDeviceWidthChange = vi.fn()
      renderWorkspace({ onDeviceWidthChange })
      fireEvent.click(screen.getByRole("radio", { name: "تابلت" }))
      expect(onDeviceWidthChange).toHaveBeenCalledWith("tablet")
    })

    it("applies 100% for full", () => {
      const { container } = renderWorkspace({ deviceWidth: "full" })
      expect(previewFrame(container)?.style.maxWidth).toBe("100%")
    })

    it("applies 52rem for tablet", () => {
      const { container } = renderWorkspace({ deviceWidth: "tablet" })
      expect(previewFrame(container)?.style.maxWidth).toBe("52rem")
    })

    it("applies 23rem for mobile", () => {
      const { container } = renderWorkspace({ deviceWidth: "mobile" })
      expect(previewFrame(container)?.style.maxWidth).toBe("23rem")
    })

    it("constrains the rendered preview, not the toolbar", () => {
      const { container } = renderWorkspace({ deviceWidth: "mobile" })
      const frame = previewFrame(container)
      expect(frame).not.toBeNull()
      expect(within(frame!).getByTestId("preview")).toBeDefined()
      expect(previewPane(container)?.style.maxWidth).toBe("")
      const toolbar = screen
        .getByRole("radio", { name: "كامل" })
        .closest("[role='radiogroup']")
      expect(frame?.contains(toolbar)).toBe(false)
    })

    it("centres the frame so narrow viewports are not pinned to one edge", () => {
      const { container } = renderWorkspace({ deviceWidth: "mobile" })
      expect(previewFrame(container)?.className).toContain("mx-auto")
    })

    it("uses the emulated frame as a named container for responsive previews", () => {
      const { container } = renderWorkspace({ deviceWidth: "mobile" })
      expect(previewFrame(container)?.className).toContain(
        "@container/preview"
      )
    })
  })

  describe("full preview", () => {
    it("renders a full-preview button", () => {
      renderWorkspace()
      expect(screen.getByRole("button", { name: "معاينة" })).toBeDefined()
    })

    it("calls onFullPreview", () => {
      const onFullPreview = vi.fn()
      renderWorkspace({ onFullPreview })
      fireEvent.click(screen.getByRole("button", { name: "معاينة" }))
      expect(onFullPreview).toHaveBeenCalled()
    })

    it("opens a dialog containing the rendered preview", () => {
      renderWorkspace()
      expect(screen.queryByRole("dialog")).toBeNull()
      fireEvent.click(screen.getByRole("button", { name: "معاينة" }))
      const dialog = screen.getByRole("dialog")
      expect(within(dialog).getByTestId("preview")).toBeDefined()
    })

    it("still mounts the preview exactly once while the dialog is open", () => {
      renderWorkspace()
      fireEvent.click(screen.getByRole("button", { name: "معاينة" }))
      expect(screen.getAllByTestId("preview")).toHaveLength(1)
    })

    it("reuses the current device viewport inside the dialog", () => {
      renderWorkspace({ deviceWidth: "tablet" })
      fireEvent.click(screen.getByRole("button", { name: "معاينة" }))
      const dialog = screen.getByRole("dialog")
      const frame = within(dialog).getByTestId("preview-frame")
      expect(frame.style.maxWidth).toBe("52rem")
    })

    it("gives the dialog an accessible name", () => {
      renderWorkspace()
      fireEvent.click(screen.getByRole("button", { name: "معاينة" }))
      expect(screen.getByRole("dialog", { name: "معاينة" })).toBeDefined()
    })

    it("keeps long previews scrollable inside the viewport-bound dialog", () => {
      renderWorkspace()
      fireEvent.click(screen.getByRole("button", { name: "معاينة" }))
      const scrollRegion = screen.getByTestId("full-preview-scroll")
      expect(scrollRegion.className).toContain("overflow-y-auto")
      expect(scrollRegion.className).toContain("min-h-0")
    })
  })

  describe("scrolling", () => {
    it("keeps the editor rail sticky and independently scrollable from lg up", () => {
      const { container } = renderWorkspace()
      const className = editorPane(container)?.className ?? ""
      expect(className).toContain("lg:sticky")
      expect(className).toContain("lg:top-0")
      expect(className).toContain("lg:max-h-screen")
      expect(className).toContain("lg:overflow-y-auto")
    })

    it("lets the preview page extend vertically instead of scrolling in place", () => {
      const { container } = renderWorkspace()
      expect(previewPane(container)?.className).not.toContain("overflow-y-auto")
    })

    it("exposes an accessible desktop resize handle", () => {
      renderWorkspace()
      const handle = screen.getByTestId("workspace-resize-handle")

      expect(handle.getAttribute("role")).toBe("separator")
      expect(handle.getAttribute("aria-valuemin")).toBe("42")
      expect(handle.getAttribute("aria-valuemax")).toBe("72")
      expect(handle.getAttribute("aria-valuenow")).toBe("60")
    })

    it("supports keyboard resizing within sensible bounds", () => {
      renderWorkspace()
      const handle = screen.getByTestId("workspace-resize-handle")

      fireEvent.keyDown(handle, { key: "ArrowRight" })
      expect(handle.getAttribute("aria-valuenow")).toBe("65")

      fireEvent.keyDown(handle, { key: "Home" })
      expect(handle.getAttribute("aria-valuenow")).toBe("42")
    })
  })

  describe("theming", () => {
    it("uses dashboard theme tokens rather than hardcoded hex colours", () => {
      const hexes = componentSource.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []
      expect(hexes).toEqual([])
    })

    it("uses logical inline properties, never physical ml/mr/left/right", () => {
      expect(componentSource).not.toMatch(
        /\b(ml|mr|pl|pr|border-l|border-r|left|right)-/
      )
    })
  })

  describe("full-width scoping", () => {
    it("renders with .student-preview-workspace class for CSS :has() targeting", () => {
      const { container } = renderWorkspace()
      const workspace = container.querySelector(".student-preview-workspace")
      expect(workspace).not.toBeNull()
    })
  })
})
