import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PreviewWorkspace } from "../preview-workspace";
import type { PreviewLayoutMode, PreviewDeviceWidth } from "../types";

describe("PreviewWorkspace types", () => {
  it("PreviewLayoutMode accepts valid values", () => {
    const modes: PreviewLayoutMode[] = ["split", "editor-focus", "preview-focus"];
    expect(modes).toHaveLength(3);
  });

  it("PreviewDeviceWidth accepts valid values", () => {
    const widths: PreviewDeviceWidth[] = ["full", "tablet", "mobile"];
    expect(widths).toHaveLength(3);
  });
});

function EditorSlot() {
  return <div data-testid="editor">Editor Content</div>;
}

function PreviewSlot() {
  return <div data-testid="preview">Preview Content</div>;
}

describe("PreviewWorkspace", () => {
  it("renders both editor and preview slots", () => {
    render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    expect(screen.getAllByTestId("editor").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("preview").length).toBeGreaterThan(0);
  });

  it("renders with .student-preview-workspace class", () => {
    const { container } = render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    expect(container.querySelector(".student-preview-workspace")).not.toBeNull();
  });

  it("defaults to split layout mode", () => {
    const { container } = render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    const workspace = container.querySelector(".student-preview-workspace");
    expect(workspace?.getAttribute("data-layout")).toBe("split");
  });

  it("renders Edit and Preview tabs on mobile", () => {
    render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    expect(screen.getByRole("tab", { name: /تعديل|Edit/ })).toBeDefined();
    expect(screen.getByRole("tab", { name: /معاينة|Preview/ })).toBeDefined();
  });

  it("shows editor by default on mobile", () => {
    render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    expect(screen.getAllByTestId("editor").length).toBeGreaterThan(0);
  });

  it("switches to preview tab", () => {
    render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    const previewTab = screen.getByRole("tab", { name: /معاينة|Preview/ });
    fireEvent.click(previewTab);
    expect(screen.getAllByTestId("preview").length).toBeGreaterThan(0);
  });

  it("accepts locale prop for Arabic/English labels", () => {
    const { rerender } = render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    expect(screen.getByRole("tab", { name: /تعديل/ })).toBeDefined();
    rerender(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="en" />
    );
    expect(screen.getByRole("tab", { name: /Edit/ })).toBeDefined();
  });

  it("renders device width controls", () => {
    render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    expect(screen.getByRole("radio", { name: /كامل|Full/ })).toBeDefined();
    expect(screen.getByRole("radio", { name: /لوحي|Tablet/ })).toBeDefined();
    expect(screen.getByRole("radio", { name: /جوال|Mobile/ })).toBeDefined();
  });

  it("defaults to full device width", () => {
    const { container } = render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    const fullRadio = screen.getByRole("radio", { name: /كامل|Full/ });
    expect(fullRadio.getAttribute("aria-checked")).toBe("true");
  });

  it("changes device width on radio click", () => {
    const onDeviceWidthChange = vi.fn();
    render(
      <PreviewWorkspace
        editor={<EditorSlot />}
        preview={<PreviewSlot />}
        locale="ar"
        onDeviceWidthChange={onDeviceWidthChange}
      />
    );
    const tabletRadio = screen.getByRole("radio", { name: /لوحي|Tablet/ });
    fireEvent.click(tabletRadio);
    expect(onDeviceWidthChange).toHaveBeenCalledWith("tablet");
  });

  it("renders full-preview button", () => {
    render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    expect(screen.getByRole("button", { name: /معاينة كاملة|Full Preview/ })).toBeDefined();
  });

  it("full-preview button calls onFullPreview", () => {
    const onFullPreview = vi.fn();
    render(
      <PreviewWorkspace
        editor={<EditorSlot />}
        preview={<PreviewSlot />}
        locale="ar"
        onFullPreview={onFullPreview}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /معاينة كاملة|Full Preview/ }));
    expect(onFullPreview).toHaveBeenCalled();
  });
});
