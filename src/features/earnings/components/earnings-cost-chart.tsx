"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type EarningsChartPoint = {
  date: string
  label: string
  cost: number
}

type EarningsCostChartProps = {
  data: EarningsChartPoint[]
  ariaLabel: string
  costLabel: string
  locale: string
}

export function EarningsCostChart({
  data,
  ariaLabel,
  costLabel,
  locale,
}: EarningsCostChartProps) {
  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const config = {
    cost: {
      label: costLabel,
      color: "var(--brand-indigo)",
    },
  } satisfies ChartConfig

  return (
    <ChartContainer
      config={config}
      className="h-72 min-h-64 w-full px-4 pt-4 pb-6 text-body-md text-body-md--line-height sm:h-80"
      role="img"
      aria-label={ariaLabel}
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 12, right: 8, left: 8, bottom: 4 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20}
          tick={{
            fill: "var(--on-surface-muted)",
            fontFamily: "var(--font-app)",
            fontSize: 13,
          }}
        />
        <YAxis hide domain={[0, "dataMax"]} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => currency.format(Number(value))}
            />
          }
        />
        <Bar
          dataKey="cost"
          fill="var(--color-cost)"
          radius={6}
          maxBarSize={48}
        />
      </BarChart>
    </ChartContainer>
  )
}
