"use client"

import { useCallback, useId, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { PreviewDeviceWidth } from "./types"

/**
 * Preview viewport widths. `full` lets the preview fill whatever the pane
 * gives it; the other two emulate a tablet and a phone.
 */
const DEVICE_WIDTHS: Record<PreviewDeviceWidth, string> = {
  full: "100%",
  tablet: "52rem",
  mobile: "23rem",
}

const DEVICE_ORDER: readonly PreviewDeviceWidth[] = ["full", "tablet", "mobile"]

const TAB_ORDER = ["edit", "preview"] as const

type PreviewTab = (typeof TAB_ORDER)[number]

type WorkspaceCopy = {
  tabsLabel: string
  tabs: Record<PreviewTab, string>
  deviceGroupLabel: string
  devices: Record<PreviewDeviceWidth, string>
  fullPreview: string
}

const COPY: Record<"ar" | "en", WorkspaceCopy> = {
  ar: {
    tabsLabel: "طريقة العرض",
    tabs: { edit: "تعديل", preview: "معاينة" },
    deviceGroupLabel: "عرض الجهاز",
    devices: { full: "كامل", tablet: "تابلت", mobile: "موبايل" },
    fullPreview: "معاينة",
  },
  en: {
    tabsLabel: "View mode",
    tabs: { edit: "Edit", preview: "Preview" },
    deviceGroupLabel: "Device width",
    devices: { full: "Full", tablet: "Tablet", mobile: "Mobile" },
    fullPreview: "Preview",
  },
}

function resolveLocale(locale: string): "ar" | "en" {
  return locale.toLowerCase().startsWith("ar") ? "ar" : "en"
}

/** Local copy function — the workspace chrome is not part of the preview. */
function workspaceCopy(locale: string): WorkspaceCopy {
  return COPY[resolveLocale(locale)]
}

const segmentClass = (active: boolean) =>
  cn(
    "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
    active
      ? "bg-primary/10 text-primary-deep"
      : "text-muted-foreground hover:bg-muted"
  )

interface PreviewWorkspaceProps {
  editor: React.ReactNode
  preview: React.ReactNode
  locale: string
  deviceWidth?: PreviewDeviceWidth
  onDeviceWidthChange?: (width: PreviewDeviceWidth) => void
  /** Fired when the full-preview dialog is opened. The dialog itself is owned here. */
  onFullPreview?: () => void
}

export function PreviewWorkspace({
  editor,
  preview,
  locale,
  deviceWidth = "full",
  onDeviceWidthChange,
  onFullPreview,
}: PreviewWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("edit")
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false)
  const tabRefs = useRef<Partial<Record<PreviewTab, HTMLButtonElement | null>>>(
    {}
  )

  const copy = workspaceCopy(locale)
  const dir = resolveLocale(locale) === "ar" ? "rtl" : "ltr"
  const baseId = useId()
  const tabId = (tab: PreviewTab) => `${baseId}-tab-${tab}`
  const panelId = (tab: PreviewTab) => `${baseId}-panel-${tab}`

  const selectTab = useCallback((tab: PreviewTab) => {
    setActiveTab(tab)
    tabRefs.current[tab]?.focus()
  }, [])

  const onTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      // Arrow keys follow the reading direction, so they mirror under RTL.
      const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight"
      const backward = dir === "rtl" ? "ArrowRight" : "ArrowLeft"

      let next: number | null = null
      if (event.key === forward) next = (index + 1) % TAB_ORDER.length
      else if (event.key === backward)
        next = (index - 1 + TAB_ORDER.length) % TAB_ORDER.length
      else if (event.key === "Home") next = 0
      else if (event.key === "End") next = TAB_ORDER.length - 1

      if (next === null) return
      event.preventDefault()
      selectTab(TAB_ORDER[next])
    },
    [dir, selectTab]
  )

  const openFullPreview = () => {
    setFullPreviewOpen(true)
    onFullPreview?.()
  }

  const onDeviceKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let next: number | null = null
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (index + 1) % DEVICE_ORDER.length
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (index - 1 + DEVICE_ORDER.length) % DEVICE_ORDER.length
    } else if (event.key === "Home") {
      next = 0
    } else if (event.key === "End") {
      next = DEVICE_ORDER.length - 1
    }

    if (next === null) return
    event.preventDefault()
    onDeviceWidthChange?.(DEVICE_ORDER[next])
  }

  /**
   * The rendered preview and its emulated viewport. Rendered in exactly one
   * place at a time so the preview subtree is never mounted twice: inside the
   * pane normally, inside the dialog while full preview is open.
   */
  const previewFrame = (
    <div
      data-testid="preview-frame"
      className="@container/preview mx-auto w-full"
      style={{ maxWidth: DEVICE_WIDTHS[deviceWidth] }}
    >
      {preview}
    </div>
  )

  return (
    <div className="student-preview-workspace" data-device-width={deviceWidth}>
      {/* Compact (<lg) tabs */}
      <div
        className="flex gap-2 border-b border-border lg:hidden"
        role="tablist"
        aria-label={copy.tabsLabel}
      >
        {TAB_ORDER.map((tab, index) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={tabId(tab)}
            ref={(node) => {
              tabRefs.current[tab] = node
            }}
            aria-selected={activeTab === tab}
            aria-controls={panelId(tab)}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm font-black transition-colors",
              activeTab === tab
                ? "border-primary text-primary-deep"
                : "border-transparent text-on-surface-subtle"
            )}
          >
            {copy.tabs[tab]}
          </button>
        ))}
      </div>

      {/*
       * Forced LTR so grid column 1 is physically left in both directions.
       * Each pane restores the document direction for its own content, and
       * both panes declare an explicit column — never RTL auto-placement.
       */}
      <div
        data-testid="workspace-grid"
        dir="ltr"
        className={cn(
          "grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
        )}
      >
        <section
          data-testid="preview-pane"
          role="tabpanel"
          id={panelId("preview")}
          aria-labelledby={tabId("preview")}
          dir={dir}
          className={cn(
            "min-w-0 lg:col-start-1 lg:row-start-1 lg:block",
            activeTab === "preview" ? "block" : "hidden"
          )}
        >
          {/* Panes stay in the grid's LTR frame so logical borders land on the
              intended physical edge; direction is restored for their content. */}
          <div data-testid="preview-content">
            <div
              className="flex items-center gap-1 border-b border-border px-4 py-2"
              role="radiogroup"
              aria-label={copy.deviceGroupLabel}
            >
              {DEVICE_ORDER.map((width, index) => (
                <button
                  key={width}
                  type="button"
                  role="radio"
                  aria-checked={deviceWidth === width}
                  tabIndex={deviceWidth === width ? 0 : -1}
                  onClick={() => onDeviceWidthChange?.(width)}
                  onKeyDown={(event) => onDeviceKeyDown(event, index)}
                  className={segmentClass(deviceWidth === width)}
                >
                  {copy.devices[width]}
                </button>
              ))}
              <button
                type="button"
                onClick={openFullPreview}
                className="ms-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-deep"
              >
                {copy.fullPreview}
              </button>
            </div>
            {/* The preview page grows with its content; the document scrolls. */}
            {fullPreviewOpen ? null : previewFrame}
          </div>
        </section>

        <section
          data-testid="editor-pane"
          role="tabpanel"
          id={panelId("edit")}
          aria-labelledby={tabId("edit")}
          dir={dir}
          className={cn(
            "min-w-0 border-border lg:col-start-2 lg:row-start-1 lg:block lg:border-s",
            "lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto",
            activeTab === "edit" ? "block" : "hidden"
          )}
        >
          <div data-testid="editor-content">{editor}</div>
        </section>
      </div>

      <Dialog open={fullPreviewOpen} onOpenChange={setFullPreviewOpen}>
        <DialogContent
          dir={dir}
          className="flex h-[90dvh] max-h-[90dvh] w-[95vw] max-w-[95vw] flex-col overflow-hidden sm:max-w-[95vw]"
        >
          <DialogTitle className="shrink-0">{copy.fullPreview}</DialogTitle>
          <div
            data-testid="full-preview-scroll"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {fullPreviewOpen ? previewFrame : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
