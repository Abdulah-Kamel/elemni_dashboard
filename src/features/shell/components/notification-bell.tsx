"use client";

import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const t = useTranslations("topbar");

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("notifications")}
      className="relative"
    >
      <Bell className="size-5" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute end-2 top-2 size-2 rounded-full border border-surface bg-error"
      />
    </Button>
  );
}
