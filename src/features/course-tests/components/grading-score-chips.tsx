"use client"

import { useRef } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

/**
 * Score chips 0..max (Teacher-Grading design). Toggle buttons with
 * aria-pressed; arrow keys / Home / End move between chips and select, so the
 * group is operable from the keyboard like a segmented control.
 */
export function ScoreChips({ max, value, onChange, labelId, disabled }: { max: number; value: number | null; onChange: (points: number) => void; labelId: string; disabled?: boolean }) {
  const t = useTranslations("courseTests.grading")
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const scores = Array.from({ length: max + 1 }, (_, index) => index)

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const forward = rtl ? "ArrowLeft" : "ArrowRight"
    const backward = rtl ? "ArrowRight" : "ArrowLeft"
    let next: number | null = null
    if (event.key === forward || event.key === "ArrowDown") next = Math.min(max, index + 1)
    else if (event.key === backward || event.key === "ArrowUp") next = Math.max(0, index - 1)
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = max
    if (next === null) return
    event.preventDefault()
    refs.current[next]?.focus()
    onChange(next)
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
      {scores.map((points) => {
        const pressed = value === points
        return (
          <button
            key={points}
            ref={(node) => {
              refs.current[points] = node
            }}
            type="button"
            aria-pressed={pressed}
            aria-label={t("score_option", { points, max })}
            disabled={disabled}
            onClick={() => onChange(points)}
            onKeyDown={(event) => onKeyDown(event, points)}
            className={cn(
              "h-12 min-w-14 rounded-xl border-[1.5px] px-3 text-base font-semibold tabular-nums",
              "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out motion-reduce:transition-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60",
              pressed
                ? "scale-105 border-2 border-foreground bg-primary font-bold text-primary-foreground shadow-[3px_3px_0_var(--color-foreground)] motion-reduce:scale-100"
                : "border-border bg-card text-foreground hover:border-primary/60 hover:bg-primary-tint/50",
            )}
          >
            {points}
          </button>
        )
      })}
    </div>
  )
}
