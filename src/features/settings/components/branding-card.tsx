"use client";

import { useRef } from "react";
import { Palette, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandingCardProps {
  primaryColor: string;
  onColorChange: (color: string) => void;
}

export function BrandingCard({ primaryColor, onColorChange }: BrandingCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    fileRef.current?.click();
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <Palette className="size-5 text-primary" />
        <h2 className="text-title-lg font-semibold text-foreground">Branding</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="primary-color"
            className="mb-1.5 flex items-center gap-1.5 text-body-md font-medium text-foreground"
          >
            Player Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="size-9 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
            />
            <span className="text-body-md text-on-surface-muted">{primaryColor}</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-body-md font-medium text-foreground">
            Logo
          </label>
          <button
            type="button"
            onClick={handleLogoClick}
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center gap-1.5",
              "rounded-xl border-2 border-dashed border-border bg-surface-muted p-4",
              "transition-colors hover:border-primary hover:bg-surface-strong",
            )}
          >
            <Upload className="size-5 text-on-surface-muted" />
            <span className="text-label-sm text-on-surface-muted">Click to upload</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
