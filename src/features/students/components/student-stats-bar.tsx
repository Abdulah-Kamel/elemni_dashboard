"use client";

import { TrendingUp, Clock, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface StudentStatsBarProps {
  totalStudents: number;
  activeStudents: number;
  pendingAccess: number;
}

export function StudentStatsBar({
  totalStudents,
  activeStudents,
  pendingAccess,
}: StudentStatsBarProps) {
  const t = useTranslations("student");

  const cards = [
    {
      label: t("total_students"),
      value: totalStudents,
      icon: Users,
      trend: "up" as const,
    },
    {
      label: t("active_students"),
      value: activeStudents,
      icon: TrendingUp,
      trend: "up" as const,
    },
    {
      label: t("pending_access"),
      value: pendingAccess,
      icon: Clock,
      trend: "pending" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-on-surface-muted">
              {card.label}
            </p>
            {card.trend === "up" ? (
              <TrendingUp className="size-4 text-success" aria-hidden="true" />
            ) : (
              <Clock className="size-4 text-warning" aria-hidden="true" />
            )}
          </div>
          <p className="text-3xl font-bold text-primary">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
