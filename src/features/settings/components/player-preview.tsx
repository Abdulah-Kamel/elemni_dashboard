"use client";

import { Play, Volume2, Settings, Maximize2 } from "lucide-react";

interface PlayerPreviewProps {
  watermarkEnabled: boolean;
  primaryColor: string;
}

export function PlayerPreview({ watermarkEnabled, primaryColor }: PlayerPreviewProps) {
  return (
    <div className="card-hover overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <div className="p-4">
        <h3 className="text-title-md font-semibold text-foreground">Preview</h3>
      </div>

      <div className="relative mx-4 mb-2 overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
        {watermarkEnabled && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span
              className="select-none text-lg font-bold tracking-widest opacity-20"
              style={{
                color: primaryColor,
                transform: "rotate(-25deg)",
                animation: "watermark-float 4s ease-in-out infinite",
              }}
            >
              STUDENT NAME
            </span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            className="flex size-14 items-center justify-center rounded-full text-white opacity-90 transition-opacity hover:opacity-100"
            style={{ backgroundColor: primaryColor }}
            aria-label="Play"
          >
            <Play className="size-6" fill="white" />
          </button>
        </div>

        <div className="absolute bottom-0 start-0 end-0 p-2">
          <div
            className="h-1 w-2/3 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-4 pt-1">
        <div className="flex items-center gap-3">
          <button type="button" className="text-on-surface-muted hover:text-foreground" aria-label="Play">
            <Play className="size-4" />
          </button>
          <button type="button" className="text-on-surface-muted hover:text-foreground" aria-label="Volume">
            <Volume2 className="size-4" />
          </button>
          <span className="text-label-sm text-on-surface-subtle">1:23 / 4:56</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="text-on-surface-muted hover:text-foreground" aria-label="Settings">
            <Settings className="size-4" />
          </button>
          <button type="button" className="text-on-surface-muted hover:text-foreground" aria-label="Fullscreen">
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes watermark-float {
          0%, 100% { opacity: 0.2; transform: rotate(-25deg) translateY(0); }
          50% { opacity: 0.35; transform: rotate(-25deg) translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
