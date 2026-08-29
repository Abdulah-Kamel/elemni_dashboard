"use client";

import { Shield, Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface SecurityCardProps {
  watermarkEnabled: boolean;
  allowPdfDownload: boolean;
  whitelistedDomains: string;
  onChange: (key: string, value: boolean | string) => void;
}

function Toggle({
  checked,
  onChange,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-border",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function SecurityCard({
  watermarkEnabled,
  allowPdfDownload,
  whitelistedDomains,
  onChange,
}: SecurityCardProps) {
  const t = useTranslations("settings");
  return (
    <div className="card-hover rounded-2xl border border-border bg-surface p-6 shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="size-5 text-primary" />
        <h2 className="text-title-lg font-semibold text-foreground">Security</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3.5">
          <div>
            <p className="text-body-md font-medium text-foreground">Dynamic Watermark</p>
            <p className="text-label-sm text-on-surface-muted">Shows student info on video</p>
          </div>
           <Toggle
            checked={watermarkEnabled}
            onChange={(v) => onChange("watermarkEnabled", v)}
            aria-label={t("watermark")}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3.5">
          <div>
            <p className="text-body-md font-medium text-foreground">Allow PDF Downloads</p>
            <p className="text-label-sm text-on-surface-muted">Students can download PDF materials</p>
          </div>
           <Toggle
            checked={allowPdfDownload}
            onChange={(v) => onChange("allowPdfDownload", v)}
            aria-label={t("pdf_download")}
          />
        </div>

        <div className="pt-1">
          <label
            htmlFor="domain-whitelist"
            className="mb-1.5 flex items-center gap-1.5 text-body-md font-medium text-foreground"
          >
            <Languages className="size-4 text-on-surface-muted" />
            Domain Whitelist
          </label>
          <Input
            id="domain-whitelist"
            type="text"
            value={whitelistedDomains}
            onChange={(e) => onChange("whitelistedDomains", e.target.value)}
            placeholder="example.com, school.edu"
          />
          <p className="mt-1 text-label-sm text-on-surface-subtle">
            Comma-separated list of allowed domains
          </p>
        </div>
      </div>
    </div>
  );
}
