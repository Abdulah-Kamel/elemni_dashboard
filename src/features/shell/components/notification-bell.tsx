"use client"

import { useTranslations } from "next-intl"
import { Bell } from "lucide-react"
import { Popover } from "@base-ui/react/popover"

/**
 * Notifications entry point. There is no notifications API yet, so the bell
 * never shows an unread dot and the panel only states that nothing is new.
 */
export function NotificationBell() {
  const t = useTranslations("topbar")
  const tShell = useTranslations("dashboardShell")

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={t("notifications")}
        className="flex size-9 items-center justify-center rounded-lg text-on-surface-muted transition-colors hover:bg-surface-muted hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none data-popup-open:bg-surface-muted data-popup-open:text-on-surface"
      >
        <Bell className="size-5" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup className="w-[20rem] origin-(--transform-origin) rounded-xl border border-border bg-surface text-on-surface shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none">
            <Popover.Title className="border-b border-border px-4 py-3 text-body-lg font-semibold">
              {t("notifications")}
            </Popover.Title>
            <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
              <Bell className="mb-1 size-5 text-on-surface-subtle" aria-hidden="true" />
              <p className="text-body-md font-medium text-on-surface">{t("no_new_notifications")}</p>
              <Popover.Description className="text-label-md text-on-surface-muted">
                {tShell("notifications_empty_hint")}
              </Popover.Description>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
