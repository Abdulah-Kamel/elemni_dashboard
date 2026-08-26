"use client";

import { useState } from "react";
import type { PreviewLayoutMode, PreviewDeviceWidth } from "./types";

const DEVICE_WIDTHS: Record<PreviewDeviceWidth, string> = {
  full: "100%",
  tablet: "52rem",
  mobile: "23rem",
};

const LABELS: Record<string, { edit: string; preview: string }> = {
  ar: { edit: "تعديل", preview: "معاينة" },
  en: { edit: "Edit", preview: "Preview" },
};

interface PreviewWorkspaceProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  locale: string;
  layoutMode?: PreviewLayoutMode;
  deviceWidth?: PreviewDeviceWidth;
  onLayoutModeChange?: (mode: PreviewLayoutMode) => void;
  onDeviceWidthChange?: (width: PreviewDeviceWidth) => void;
  onFullPreview?: () => void;
}

export function PreviewWorkspace({
  editor,
  preview,
  locale,
  layoutMode = "split",
  deviceWidth = "full",
  onLayoutModeChange,
  onDeviceWidthChange,
  onFullPreview,
}: PreviewWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const labels = LABELS[locale] ?? LABELS.en;

  return (
    <div
      className="student-preview-workspace"
      data-layout={layoutMode}
      data-device-width={deviceWidth}
    >
      {/* Mobile tabs */}
      <div className="flex gap-2 border-b border-[#E2E0EF] lg:hidden" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "edit"}
          onClick={() => setActiveTab("edit")}
          className={`shrink-0 border-b-2 px-4 py-3 text-sm font-black ${
            activeTab === "edit"
              ? "border-[#0284C7] text-[#0369A1]"
              : "border-transparent text-[#A6A3B5]"
          }`}
        >
          {labels.edit}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "preview"}
          onClick={() => setActiveTab("preview")}
          className={`shrink-0 border-b-2 px-4 py-3 text-sm font-black ${
            activeTab === "preview"
              ? "border-[#0284C7] text-[#0369A1]"
              : "border-transparent text-[#A6A3B5]"
          }`}
        >
          {labels.preview}
        </button>
      </div>

      {/* Desktop split */}
      <div
        className={`hidden lg:grid ${
          layoutMode === "split"
            ? "lg:grid-cols-[3fr_2fr]"
            : layoutMode === "editor-focus"
              ? "lg:grid-cols-[2fr_3fr]"
              : "lg:grid-cols-[3fr_2fr]"
        }`}
      >
        <div className="overflow-y-auto" data-testid="editor-pane">
          {editor}
        </div>
        <div
          className="overflow-y-auto border-r border-[#E2E0EF]"
          style={{ maxWidth: DEVICE_WIDTHS[deviceWidth] }}
          data-testid="preview-pane"
        >
          {preview}
        </div>
      </div>

      {/* Mobile content */}
      <div className="lg:hidden">
        {activeTab === "edit" ? (
          <div data-testid="editor-pane">{editor}</div>
        ) : (
          <div data-testid="preview-pane">{preview}</div>
        )}
      </div>
    </div>
  );
}
