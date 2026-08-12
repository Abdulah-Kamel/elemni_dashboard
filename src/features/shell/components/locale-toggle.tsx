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
      size="icon"
      onClick={handleToggle}
      aria-label={targetLabel}
      title={targetLabel}
      className="relative min-w-10 gap-1 px-2"
    >
      <Globe className="size-5" aria-hidden="true" />
      <span className="text-label-md text-label-md--line-height font-bold uppercase">
        {targetCode}
      </span>
    </Button>
  );
}
