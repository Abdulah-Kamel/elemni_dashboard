"use client"

import * as React from "react"
import { CalendarRange } from "lucide-react"
import { useLocale } from "next-intl"
import type { DateRange } from "react-day-picker"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

type Props = {
  filters: {
    start?: string
    end?: string
  }
  basePath: string
  startParam?: string
  endParam?: string
  hiddenFields?: Record<string, string | number | undefined>
  className?: string
  triggerClassName?: string
  triggerId?: string
  onApply?: (range: { start?: string; end?: string }) => void
  onReset?: () => void
  labels: {
    range: string
    allTime: string
    choose: string
    dialogTitle: string
    dialogDescription: string
    apply: string
    reset: string
    cancel: string
  }
}

export function DateRangeFilterForm({
  filters,
  basePath,
  startParam = "start",
  endParam = "end",
  hiddenFields,
  className,
  triggerClassName,
  triggerId,
  onApply,
  onReset,
  labels,
}: Props) {
  const locale = useLocale()
  const appliedRange = React.useMemo(
    () => parseDateRange(filters.start, filters.end),
    [filters.end, filters.start]
  )
  const [open, setOpen] = React.useState(false)
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(
    appliedRange
  )
  const today = React.useMemo(() => new Date(), [])
  const earliestMonth = React.useMemo(
    () => new Date(today.getFullYear() - 5, 0, 1),
    [today]
  )
  const [visibleMonth, setVisibleMonth] = React.useState<Date>(
    appliedRange?.from ?? today
  )

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    setDraftRange(appliedRange)
    setVisibleMonth(appliedRange?.from ?? today)
  }

  const triggerLabel =
    appliedRange?.from || appliedRange?.to
      ? formatRangeLabel(
          appliedRange?.from,
          appliedRange?.to,
          labels.allTime,
          locale
        )
      : labels.choose
  const isCompleteRange = Boolean(draftRange?.from && draftRange?.to)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!onApply) return

    event.preventDefault()
    onApply({
      start: draftRange?.from ? formatDateValue(draftRange.from) : undefined,
      end: draftRange?.to ? formatDateValue(draftRange.to) : undefined,
    })
    setOpen(false)
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 xl:justify-end",
        className
      )}
    >
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button
              type="button"
              id={triggerId}
              variant="outline"
              size="lg"
              className={cn(
                "w-full justify-between bg-surface sm:w-auto sm:min-w-72",
                triggerClassName
              )}
            />
          }
        >
          <span className="flex items-center gap-2">
            <CalendarRange className="size-4" />
            <span
              className={cn(
                "truncate text-start",
                !appliedRange?.from && "text-on-surface-muted"
              )}
            >
              {triggerLabel}
            </span>
          </span>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[48rem]">
          <form method="get" className="space-y-5" onSubmit={handleSubmit}>
            <input
              type="hidden"
              name={startParam}
              value={draftRange?.from ? formatDateValue(draftRange.from) : ""}
              readOnly
            />
            <input
              type="hidden"
              name={endParam}
              value={draftRange?.to ? formatDateValue(draftRange.to) : ""}
              readOnly
            />
            {Object.entries(hiddenFields ?? {}).map(([name, value]) =>
              value == null || value === "" ? null : (
                <input
                  key={name}
                  type="hidden"
                  name={name}
                  value={String(value)}
                  readOnly
                />
              )
            )}

            <DialogHeader>
              <DialogTitle>{labels.dialogTitle}</DialogTitle>
              <DialogDescription>{labels.dialogDescription}</DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-border bg-surface-muted p-4">
              <p className="text-sm font-medium text-foreground">
                {labels.range}
              </p>
              <p className="mt-1 text-sm text-on-surface-muted">
                {formatRangeLabel(
                  draftRange?.from,
                  draftRange?.to,
                  labels.allTime,
                  locale
                )}
              </p>
            </div>

            <div className="flex justify-center rounded-2xl border border-border bg-surface p-2">
              <Calendar
                mode="range"
                selected={draftRange}
                month={visibleMonth}
                onMonthChange={setVisibleMonth}
                onSelect={setDraftRange}
                numberOfMonths={2}
                pagedNavigation
                resetOnSelect
                startMonth={earliestMonth}
                endMonth={today}
                disabled={[{ after: today }]}
                className="max-w-full"
              />
            </div>

            <DialogFooter>
              {onReset ? (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    onReset()
                    setOpen(false)
                  }}
                >
                  {labels.reset}
                </Button>
              ) : (
                <Link
                  href={basePath}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {labels.reset}
                </Link>
              )}
              <DialogClose render={<Button variant="outline" type="button" />}>
                {labels.cancel}
              </DialogClose>
              <Button type="submit" disabled={!isCompleteRange}>
                {labels.apply}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function parseDateRange(start?: string, end?: string): DateRange | undefined {
  const from = parseDateValue(start)
  const to = parseDateValue(end)

  if (!from && !to) {
    return undefined
  }

  return { from, to }
}

function parseDateValue(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined
  }

  return new Date(`${value}T12:00:00`)
}

function formatDateValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatRangeLabel(
  start: Date | undefined,
  end: Date | undefined,
  allTimeLabel: string,
  locale: string
) {
  if (!start && !end) {
    return allTimeLabel
  }

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
  const startLabel = start ? formatter.format(start) : "—"
  const endLabel = end ? formatter.format(end) : "—"

  return `${startLabel} — ${endLabel}`
}
