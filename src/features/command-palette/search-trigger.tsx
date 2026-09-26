"use client"

import { useSyncExternalStore } from "react"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCommandPalette } from "./command-palette"

const noopSubscribe = () => () => {}

function isApplePlatform(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const platform = nav.userAgentData?.platform ?? nav.platform ?? ""
  return /mac|iphone|ipad|ipod/i.test(platform)
}

/** Top-bar button that opens the command palette; shows the keyboard shortcut. */
export function SearchTrigger({ variant }: { variant: "bar" | "icon" }) {
  const t = useTranslations("dashboardShell")
  const { openPalette } = useCommandPalette()
  const apple = useSyncExternalStore(noopSubscribe, isApplePlatform, () => false)

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={openPalette}
        aria-label={t("search_trigger")}
        aria-haspopup="dialog"
        className="flex size-9 items-center justify-center rounded-lg text-on-surface-muted transition-colors hover:bg-surface-muted hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Search className="size-5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-haspopup="dialog"
      aria-keyshortcuts="Control+K Meta+K"
      className={cn(
        "group flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface-muted/50 px-3 text-start text-body-md text-on-surface-muted transition-colors",
        "hover:border-border-strong hover:bg-surface hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{t("search_trigger")}</span>
      <kbd
        aria-hidden="true"
        dir="ltr"
        className="shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-sans text-label-sm text-on-surface-muted"
      >
        {apple ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  )
}
