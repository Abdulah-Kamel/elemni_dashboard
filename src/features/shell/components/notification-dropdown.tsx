"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationDropdown() {
  const tTop = useTranslations("topbar");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={tTop("notifications")}
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="size-5" aria-hidden="true" />
        <span
          aria-hidden="true"
          className="absolute end-2 top-2 size-2 rounded-full border border-surface bg-error"
        />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute start-0 mt-2 w-80 rounded-2xl border border-border bg-surface p-4 shadow-xl z-50">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">
                {tTop("notifications")}
              </span>
            </div>
            <p className="text-xs text-on-surface-muted text-center py-6">
              No new notifications
            </p>
          </div>
        </>
      )}
    </div>
  );
}
