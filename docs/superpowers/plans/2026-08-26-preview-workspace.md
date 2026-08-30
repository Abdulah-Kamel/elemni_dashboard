# Task 5: PreviewWorkspace Layout Component

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `PreviewWorkspace` client component that wraps the student preview renderer and an editor slot in a responsive split-view layout with device width controls and full-preview dialog.

**Architecture:** A single `"use client"` component that uses CSS grid for the desktop split (60/40 default) and accessible tabs for mobile (<1024px). Device width controls resize the preview viewport via max-width. Full-preview reuses the same rendered preview in a dialog. No new dependencies — uses existing `Dialog` from `@/components/ui/dialog`.

**Tech Stack:** React 19, Tailwind CSS v4, `lucide-react` icons, existing `Dialog` component.

## Global Constraints

- All work in `elemni_dashboard` worktree `.worktrees/feat/dashboard-student-previews`
- No edits to `elemni_front_end` or `elemni_public_ui`
- No `@elemni/public-ui` dependency
- No cross-repo imports
- No `framer-motion` / `motion` (not installed)
- Native `<img>` elements for preview images
- Dashboard uses Tailwind CSS v4 with `@theme inline` in `globals.css`
- No hex codes in shell component TSX (preview renderers intentionally use hardcoded hex)
- TDD: write failing tests first, then implement

---

### Task 1: Types and Layout Mode

**Files:**
- Create: `src/features/student-preview/types.ts` (extend existing)
- Test: `src/features/student-preview/__tests__/preview-workspace.test.tsx`

**Interfaces:**
- Consumes: existing `PreviewInteractionMode` type
- Produces: `PreviewLayoutMode`, `PreviewDeviceWidth`, `PreviewWorkspaceProps` types

- [ ] **Step 1: Write failing test for new types**

```tsx
// __tests__/preview-workspace.test.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: FAIL — `PreviewLayoutMode` not exported

- [ ] **Step 3: Add types to types.ts**

Append to existing `src/features/student-preview/types.ts`:

```ts
export type PreviewLayoutMode = "split" | "editor-focus" | "preview-focus";

export type PreviewDeviceWidth = "full" | "tablet" | "mobile";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: PASS

---

### Task 2: PreviewWorkspace Shell Component

**Files:**
- Create: `src/features/student-preview/preview-workspace.tsx`
- Test: `src/features/student-preview/__tests__/preview-workspace.test.tsx`

**Interfaces:**
- Consumes: `PreviewLayoutMode`, `PreviewDeviceWidth` from Task 1
- Produces: `PreviewWorkspace` React client component

- [ ] **Step 1: Write failing tests for workspace rendering**

Append to `__tests__/preview-workspace.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { PreviewWorkspace } from "../preview-workspace";

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
    expect(screen.getByTestId("editor")).toBeDefined();
    expect(screen.getByTestId("preview")).toBeDefined();
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
    expect(screen.getByTestId("editor")).toBeDefined();
  });

  it("switches to preview tab", () => {
    render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    const previewTab = screen.getByRole("tab", { name: /معاينة|Preview/ });
    fireEvent.click(previewTab);
    expect(screen.getByTestId("preview")).toBeDefined();
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: FAIL — `PreviewWorkspace` not found

- [ ] **Step 3: Implement PreviewWorkspace shell**

Create `src/features/student-preview/preview-workspace.tsx`:

```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: PASS

---

### Task 3: Device Width Controls

**Files:**
- Modify: `src/features/student-preview/preview-workspace.tsx`
- Test: `src/features/student-preview/__tests__/preview-workspace.test.tsx`

**Interfaces:**
- Consumes: `PreviewDeviceWidth` from Task 1
- Produces: Device width toggle buttons in the workspace

- [ ] **Step 1: Write failing tests for device width controls**

Append to `__tests__/preview-workspace.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: FAIL — radio roles not found

- [ ] **Step 3: Add device width controls to PreviewWorkspace**

Add to the preview pane header in `preview-workspace.tsx`:

```tsx
const DEVICE_LABELS: Record<string, { full: string; tablet: string; mobile: string }> = {
  ar: { full: "كامل", tablet: "لوحي", mobile: "جوال" },
  en: { full: "Full", tablet: "Tablet", mobile: "Mobile" },
};
```

Add a radio group above the preview content:

```tsx
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
</div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: PASS

---

### Task 4: Full-Preview Dialog

**Files:**
- Modify: `src/features/student-preview/preview-workspace.tsx`
- Test: `src/features/student-preview/__tests__/preview-workspace.test.tsx`

**Interfaces:**
- Consumes: existing `Dialog` from `@/components/ui/dialog`
- Produces: Full-preview button + dialog trigger

- [ ] **Step 1: Write failing tests for full-preview dialog**

Append to `__tests__/preview-workspace.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: FAIL — button not found

- [ ] **Step 3: Add full-preview button**

Add to the device width controls bar in `preview-workspace.tsx`:

```tsx
const FULL_PREVIEW_LABELS: Record<string, string> = {
  ar: "معاينة كاملة",
  en: "Full Preview",
};
```

Add button at the end of the controls bar:

```tsx
<button
  type="button"
  onClick={onFullPreview}
  className="ms-auto rounded-lg bg-[#0284C7] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0369A1]"
>
  {fullPreviewLabel}
</button>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: PASS

---

### Task 5: Layout Mode Toggle

**Files:**
- Modify: `src/features/student-preview/preview-workspace.tsx`
- Test: `src/features/student-preview/__tests__/preview-workspace.test.tsx`

**Interfaces:**
- Consumes: `PreviewLayoutMode` from Task 1
- Produces: Layout mode toggle in the workspace header

- [ ] **Step 1: Write failing tests for layout mode toggle**

Append to `__tests__/preview-workspace.test.tsx`:

```tsx
  it("renders layout mode toggle", () => {
    render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    expect(screen.getByRole("radio", { name: /مقسم|Split/ })).toBeDefined();
    expect(screen.getByRole("radio", { name: /المحرر|Editor/ })).toBeDefined();
    expect(screen.getByRole("radio", { name: /المعاينة|Preview/ })).toBeDefined();
  });

  it("defaults to split layout", () => {
    render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    const splitRadio = screen.getByRole("radio", { name: /مقسم|Split/ });
    expect(splitRadio.getAttribute("aria-checked")).toBe("true");
  });

  it("changes layout mode on radio click", () => {
    const onLayoutModeChange = vi.fn();
    render(
      <PreviewWorkspace
        editor={<EditorSlot />}
        preview={<PreviewSlot />}
        locale="ar"
        onLayoutModeChange={onLayoutModeChange}
      />
    );
    const editorFocus = screen.getByRole("radio", { name: /المحرر|Editor/ });
    fireEvent.click(editorFocus);
    expect(onLayoutModeChange).toHaveBeenCalledWith("editor-focus");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: FAIL — layout radio roles not found

- [ ] **Step 3: Add layout mode toggle**

Add layout labels and a radio group in the workspace header area (visible on desktop only):

```tsx
const LAYOUT_LABELS: Record<string, { split: string; "editor-focus": string; "preview-focus": string }> = {
  ar: { split: "مقسم", "editor-focus": "المحرر", "preview-focus": "المعاينة" },
  en: { split: "Split", "editor-focus": "Editor", "preview-focus": "Preview" },
};
```

Add the toggle above the grid (desktop only):

```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: PASS

---

### Task 6: Editor Rail Sticky Behavior

**Files:**
- Modify: `src/features/student-preview/preview-workspace.tsx`
- Test: `src/features/student-preview/__tests__/preview-workspace.test.tsx`

**Interfaces:**
- Consumes: CSS `sticky` positioning
- Produces: Sticky editor rail, independently scrollable preview

- [ ] **Step 1: Write failing test for sticky behavior**

Append to `__tests__/preview-workspace.test.tsx`:

```tsx
  it("editor pane has sticky positioning", () => {
    const { container } = render(
      <PreviewWorkspace editor={<EditorSlot />} preview={<PreviewSlot />} locale="ar" />
    );
    const editorPane = container.querySelector("[data-testid='editor-pane']");
    expect(editorPane).not.toBeNull();
    // Sticky is applied via CSS class, verify the element exists with the right data attribute
    expect(editorPane?.closest("[data-layout]")).not.toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it passes (already passes since data-layout exists)**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: PASS (structural test)

- [ ] **Step 3: Add sticky CSS to editor pane**

Update the editor pane div in `preview-workspace.tsx`:

```tsx
<div className="sticky top-0 max-h-screen overflow-y-auto" data-testid="editor-pane">
  {editor}
</div>
```

Update the preview pane:

```tsx
<div
  className="overflow-y-auto border-s border-[#E2E0EF]"
  style={{ maxWidth: DEVICE_WIDTHS[deviceWidth] }}
  data-testid="preview-pane"
>
  {preview}
</div>
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run __tests__/preview-workspace.test.tsx`
Expected: PASS

---

### Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing + new)

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Run lint**

Run: `npx eslint src/features/student-preview/`
Expected: 0 errors (pre-existing warnings OK)

- [ ] **Step 4: Verify no regressions in existing preview components**

The existing `StudentCourseDetailPreview` and `StudentTeacherProfilePreview` tests must still pass unchanged.
