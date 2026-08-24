"use client"

import { CircleCheckBig, Clock3, Users } from "lucide-react"
import { useTranslations } from "next-intl"

interface StudentStatsBarProps {
  totalStudents: number
  completedSubscriptions: number
  pendingSubscriptions: number
}

export function StudentStatsBar({
  totalStudents,
  completedSubscriptions,
  pendingSubscriptions,
}: StudentStatsBarProps) {
  const t = useTranslations("student")

  const cards = [
    {
      label: t("total_students"),
      value: totalStudents,
      icon: Users,
      iconClassName: "text-primary",
    },
    {
      label: t("completed_subscriptions"),
      value: completedSubscriptions,
      icon: CircleCheckBig,
      iconClassName: "text-success",
    },
    {
      label: t("pending_subscriptions"),
      value: pendingSubscriptions,
      icon: Clock3,
      iconClassName: "text-warning",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, iconClassName }) => (
        <div
          key={label}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-on-surface-muted">
              {label}
            </p>
            <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
          </div>
          <p className="text-3xl font-bold text-primary">{value}</p>
        </div>
      ))}
    </div>
  )
}
