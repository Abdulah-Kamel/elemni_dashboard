"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Tooltip,
  type ChartOptions,
  type ChartData,
} from "chart.js";

let chartJsRegistered = false;

function ensureChartJsRegistered() {
  if (chartJsRegistered) return;
  ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip);
  chartJsRegistered = true;
}

export type MiniBarSeries = number[];

export type MiniBarChartProps = {
  labels: string[];
  values: MiniBarSeries;
  /** CSS variable name from the design tokens, e.g. "--color-brand-indigo". */
  colorVar?: string;
  /** CSS variable name for the muted bars. */
  mutedColorVar?: string;
  className?: string;
  ariaLabel?: string;
};

export function MiniBarChart({
  labels,
  values,
  colorVar = "--color-brand-indigo",
  mutedColorVar = "--color-brand-indigo-tint",
  className,
  ariaLabel,
}: MiniBarChartProps) {
  ensureChartJsRegistered();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS | null>(null);

  const max = useMemo(() => Math.max(...values, 1), [values]);
  const peakIndex = useMemo(
    () => values.reduce((best, v, i) => (v > values[best] ? i : best), 0),
    [values],
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const computed = getComputedStyle(document.documentElement);
    const color = computed.getPropertyValue(colorVar).trim() || "#4F46E5";
    const muted = computed.getPropertyValue(mutedColorVar).trim() || "#EEF2FF";

    const data: ChartData<"bar"> = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: (ctx2) => {
            const { dataIndex } = ctx2;
            return dataIndex === peakIndex ? color : muted;
          },
          borderRadius: 4,
          borderSkipped: false,
          barThickness: "flex" as never,
          maxBarThickness: 14,
          categoryPercentage: 0.7,
          barPercentage: 0.9,
        },
      ],
    };

    const options: ChartOptions<"bar"> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: {
          grid: { display: false, drawTicks: false },
          border: { display: false },
          ticks: { display: false },
        },
        y: {
          beginAtZero: true,
          max: Math.ceil(max * 1.15),
          grid: { display: false, drawTicks: false },
          border: { display: false },
          ticks: { display: false },
        },
      },
    };

    chartRef.current = new ChartJS(ctx, { type: "bar", data, options });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, values, colorVar, mutedColorVar, max, peakIndex]);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
