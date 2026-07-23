"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SecurityCard } from "@/features/settings/components/security-card";
import { BrandingCard } from "@/features/settings/components/branding-card";
import { PlayerPreview } from "@/features/settings/components/player-preview";

export function SettingsDashboard() {
  const t = useTranslations("settings");
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [allowPdfDownload, setAllowPdfDownload] = useState(false);
  const [whitelistedDomains, setWhitelistedDomains] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#00236f");

  const handleChange = (key: string, value: boolean | string) => {
    switch (key) {
      case "watermarkEnabled":
        setWatermarkEnabled(value as boolean);
        break;
      case "allowPdfDownload":
        setAllowPdfDownload(value as boolean);
        break;
      case "whitelistedDomains":
        setWhitelistedDomains(value as string);
        break;
    }
  };

  const handleSave = () => {
    toast.success(t("saved"));
  };

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="size-6 text-primary" />
          <h1 className="text-headline-md font-semibold text-foreground">{t("title")}</h1>
        </div>
        <Button onClick={handleSave} variant="default">
          {t("save")}
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-12">
        <div className="flex flex-col gap-lg lg:col-span-7">
          <SecurityCard
            watermarkEnabled={watermarkEnabled}
            allowPdfDownload={allowPdfDownload}
            whitelistedDomains={whitelistedDomains}
            onChange={handleChange}
          />
          <BrandingCard
            primaryColor={primaryColor}
            onColorChange={setPrimaryColor}
          />
        </div>
        <div className="lg:col-span-5">
          <div className="sticky top-0">
            <PlayerPreview
              watermarkEnabled={watermarkEnabled}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
