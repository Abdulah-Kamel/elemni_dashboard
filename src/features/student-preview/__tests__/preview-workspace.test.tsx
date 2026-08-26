import { describe, it, expect } from "vitest";
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
