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

export type MonthlyEarning = {
  label: string;
  value: number;
};

export type MonthlyEarningsChartProps = {
  months: MonthlyEarning[];
  /** CSS variable name for the highlighted bar. */
  colorVar?: string;
  /** CSS variable name for the muted bars. */
  mutedColorVar?: string;
  className?: string;
  ariaLabel?: string;
};

const CHART_FONT =
  '12px "Readex Pro", system-ui, -apple-system, "Segoe UI", sans-serif';

export function MonthlyEarningsChart({
  months,
  colorVar = "--color-brand-indigo",
  mutedColorVar = "--color-brand-indigo-tint",
  className,
  ariaLabel,
}: MonthlyEarningsChartProps) {
  ensureChartJsRegistered();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS | null>(null);

  const labels = useMemo(() => months.map((m) => m.label), [months]);
  const values = useMemo(() => months.map((m) => m.value), [months]);
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
    const color = computed.getPropertyValue(colorVar).trim() || "#0284C7";
    const muted = computed.getPropertyValue(mutedColorVar).trim() || "#E0F2FE";
    const gridColor =
      computed.getPropertyValue("--color-chart-grid").trim() || "#E2E0EF";
    const axisColor =
      computed.getPropertyValue("--color-chart-axis").trim() || "#A6A3B5";

    const data: ChartData<"bar"> = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: (ctx2) => {
            const { dataIndex } = ctx2;
            return dataIndex === peakIndex ? color : muted;
          },
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 56,
          categoryPercentage: 0.55,
          barPercentage: 0.9,
        },
      ],
    };

    const options: ChartOptions<"bar"> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: axisColor,
            font: { family: CHART_FONT, size: 12 },
          },
        },
        y: {
          beginAtZero: true,
          max: Math.ceil(max * 1.15),
          grid: { color: gridColor, drawTicks: false },
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
