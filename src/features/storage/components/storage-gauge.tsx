"use client";

import { useEffect, useState } from "react";

const SIZE = 160;
const STROKE_WIDTH = 12;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PERCENTAGE = 74;

export function StorageGauge() {
  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setOffset(CIRCUMFERENCE * (1 - PERCENTAGE / 100));
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-xs">
      <div className="relative flex items-center justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-surface-muted"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{PERCENTAGE}%</span>
          <span className="text-xs text-on-surface-muted">Used</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-primary" />
          <span className="text-xs text-on-surface-muted">Video</span>
          <span className="text-xs font-semibold text-foreground">612 GB</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-chart-2" />
          <span className="text-xs text-on-surface-muted">Docs</span>
          <span className="text-xs font-semibold text-foreground">130.8 GB</span>
        </div>
      </div>
    </div>
  );
}
