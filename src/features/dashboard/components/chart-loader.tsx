"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const MiniBarChart = dynamic(
  () => import("./mini-bar-chart").then((m) => m.MiniBarChart),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-full w-full" />
    ),
  },
);

export const MonthlyEarningsChart = dynamic(
  () => import("./monthly-earnings-chart").then((m) => m.MonthlyEarningsChart),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-full w-full" />
    ),
  },
);
