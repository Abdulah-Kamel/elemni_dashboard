"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

function cssVar(name: string): string {
  if (typeof document === "undefined") return "#000000";
  const el = document.createElement("div");
  el.style.cssText = `${name}: var(${name}); position:absolute;pointer-events:none;opacity:0;`;
  document.body.appendChild(el);
  const val = getComputedStyle(el).getPropertyValue(name.slice(4, -1));
  document.body.removeChild(el);
  return val.trim() || "#000000";
}

const DAYS_7 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_30 = Array.from({ length: 30 }, (_, i) => `${i + 1}`);

const DATA_7 = [120, 190, 80, 170, 140, 210, 160];
const DATA_30 = Array.from({ length: 30 }, () => Math.floor(Math.random() * 150) + 50);

export function BandwidthChart() {
  const [range, setRange] = useState<"7d" | "30d">("7d");

  const labels = range === "7d" ? DAYS_7 : DAYS_30;
  const values = range === "7d" ? DATA_7 : DATA_30;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-title-lg text-title-lg--line-height font-semibold text-foreground">
          Bandwidth
        </h3>
        <div className="flex rounded-lg bg-surface-muted p-0.5">
          <button
            onClick={() => setRange("7d")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              range === "7d"
                ? "bg-surface text-foreground shadow-xs"
                : "text-on-surface-muted hover:text-foreground"
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setRange("30d")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              range === "30d"
                ? "bg-surface text-foreground shadow-xs"
                : "text-on-surface-muted hover:text-foreground"
            }`}
          >
            30 days
          </button>
        </div>
      </div>
      <div className="h-64">
        <Line
          data={{
            labels,
            datasets: [
              {
                data: values,
                borderColor: cssVar("--color-primary"),
                backgroundColor: (ctx) => {
                  if (!ctx.chart.chartArea) return "transparent";
                  const { ctx: canvasCtx, chartArea } = ctx.chart;
                  const gradient = canvasCtx.createLinearGradient(
                    0,
                    chartArea.top,
                    0,
                    chartArea.bottom,
                  );
                  gradient.addColorStop(0, cssVar("--color-primary"));
                  gradient.addColorStop(1, cssVar("--color-primary-tint"));
                  return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                backgroundColor: "var(--color-surface-raised)",
                titleColor: "var(--color-foreground)",
                bodyColor: "var(--color-on-surface-muted)",
                borderColor: "var(--color-border)",
                borderWidth: 1,
                padding: 8,
                displayColors: false,
                callbacks: {
                  label: (ctx) => `${ctx.parsed.y} GB`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                  color: "var(--color-chart-axis)",
                  font: { size: 11 },
                  maxTicksLimit: range === "30d" ? 10 : 7,
                },
              },
              y: {
                beginAtZero: true,
                grid: { color: "var(--color-chart-grid)", drawTicks: false },
                border: { display: false },
                ticks: {
                  color: "var(--color-chart-axis)",
                  font: { size: 11 },
                  callback: (val) => `${val} GB`,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
