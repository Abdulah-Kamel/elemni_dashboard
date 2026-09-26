"use client"

import { CircleCheckBig, Clock3, Hourglass, Users } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { StatTile } from "@/components/ui/stat-tile"
import type { RosterStats } from "@/features/students/roster-model"

export type StatFilter = "all" | "completed" | "pending" | "expiring"

interface StudentStatsBarProps {
  stats: RosterStats
  /** Which tile's filter is currently applied, if any. */
  active: StatFilter | null
  onSelect: (filter: StatFilter) => void
}

/**
 * Headline counts that double as one-click filters. Each tile is a toggle
 * button: pressing an applied tile clears its filter.
 */
export function StudentStatsBar({ stats, active, onSelect }: StudentStatsBarProps) {
  const t = useTranslations("student")
  const tw = useTranslations("teacherWorkspace.students")
  const number = new Intl.NumberFormat(useLocale())

  const tiles: {
    id: StatFilter
    label: string
    value: number
    hint: string
    icon: typeof Users
    tone: "default" | "primary" | "warning" | "success"
  }[] = [
    {
      id: "all",
      label: t("total_students"),
      value: stats.totalStudents,
      hint: tw("tile_all_hint"),
      icon: Users,
      tone: "primary",
    },
    {
      id: "completed",
      label: t("completed_subscriptions"),
      value: stats.completed,
      hint: tw("tile_filter_hint"),
      icon: CircleCheckBig,
      tone: "success",
    },
    {
      id: "pending",
      label: t("pending_subscriptions"),
      value: stats.pending,
      hint: tw("tile_filter_hint"),
      icon: Clock3,
      tone: "warning",
    },
    {
      id: "expiring",
      label: tw("tile_expiring"),
      value: stats.expiring,
      hint: tw("tile_expiring_hint"),
      icon: Hourglass,
      tone: "warning",
    },
  ]

  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      role="group"
      aria-label={tw("tiles_label")}
    >
      {tiles.map((tile) => {
        const pressed = active === tile.id
        return (
          <button
            key={tile.id}
            type="button"
            aria-pressed={pressed}
            onClick={() => onSelect(tile.id)}
            className="group rounded-xl text-start transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-px motion-reduce:transition-none"
          >
            <StatTile
              label={tile.label}
              value={number.format(tile.value)}
              hint={tile.hint}
              icon={tile.icon}
              tone={pressed ? tile.tone : "default"}
              className="h-full group-hover:border-primary/50 group-hover:bg-primary-tint/30"
            />
          </button>
        )
      })}
    </div>
  )
}

