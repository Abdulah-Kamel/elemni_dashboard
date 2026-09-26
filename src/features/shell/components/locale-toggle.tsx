"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("topbar");

  const targetLocale = locale === "ar" ? "en" : "ar";
  const targetLabel = t("toggle_locale");
  const targetCode = targetLocale.toUpperCase();

  const handleToggle = () => {
    router.replace(pathname, { locale: targetLocale });
  };

  return (
    <Button
      variant="ghost"
      size="default"
      onClick={handleToggle}
      aria-label={targetLabel}
      title={targetLabel}
      className="h-9 gap-1 px-2 text-on-surface-muted hover:bg-surface-muted hover:text-on-surface"
    >
      <Globe className="size-4" aria-hidden="true" />
      <span className="text-label-md font-semibold uppercase">
        {targetCode}
      </span>
    </Button>
  );
}
