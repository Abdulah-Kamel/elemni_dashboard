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

const DEVICE_LABELS: Record<string, { full: string; tablet: string; mobile: string }> = {
  ar: { full: "كامل", tablet: "لوحي", mobile: "جوال" },
  en: { full: "Full", tablet: "Tablet", mobile: "Mobile" },
};

const FULL_PREVIEW_LABELS: Record<string, string> = {
  ar: "معاينة كاملة",
  en: "Full Preview",
};

const LAYOUT_LABELS: Record<string, { split: string; "editor-focus": string; "preview-focus": string }> = {
  ar: { split: "مقسم", "editor-focus": "المحرر", "preview-focus": "المعاينة" },
  en: { split: "Split", "editor-focus": "Editor", "preview-focus": "Preview" },
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
  const deviceLabels = DEVICE_LABELS[locale] ?? DEVICE_LABELS.en;
  const fullPreviewLabel = FULL_PREVIEW_LABELS[locale] ?? FULL_PREVIEW_LABELS.en;
  const layoutLabels = LAYOUT_LABELS[locale] ?? LAYOUT_LABELS.en;

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

      {/* Layout mode toggle (desktop only) */}
      <div className="hidden items-center gap-1 lg:flex" role="radiogroup">
        {(Object.keys(LAYOUT_LABELS[locale] ?? LAYOUT_LABELS.en) as PreviewLayoutMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={layoutMode === mode}
            onClick={() => onLayoutModeChange?.(mode)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              layoutMode === mode
                ? "bg-[#0284C7]/10 text-[#0369A1]"
                : "text-[#777587] hover:bg-[#F0F9FF]"
            }`}
          >
            {layoutLabels[mode]}
          </button>
        ))}
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
          <div className="flex items-center gap-1 border-b border-[#E2E0EF] px-4 py-2" role="radiogroup">
            {(Object.keys(DEVICE_WIDTHS) as PreviewDeviceWidth[]).map((width) => (
              <button
                key={width}
                type="button"
                role="radio"
                aria-checked={deviceWidth === width}
                onClick={() => onDeviceWidthChange?.(width)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  deviceWidth === width
                    ? "bg-[#0284C7]/10 text-[#0369A1]"
                    : "text-[#777587] hover:bg-[#F0F9FF]"
                }`}
              >
                {deviceLabels[width]}
              </button>
            ))}
            <button
              type="button"
              onClick={onFullPreview}
              className="ms-auto rounded-lg bg-[#0284C7] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0369A1]"
            >
              {fullPreviewLabel}
            </button>
          </div>
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
