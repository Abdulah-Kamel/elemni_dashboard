"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useLocale } from "next-intl"
import { DayPicker } from "react-day-picker"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const locale = useLocale()
  const isRtl = locale === "ar"

  return (
    <DayPicker
      dir={isRtl ? "rtl" : "ltr"}
      showOutsideDays={showOutsideDays}
      className={cn("w-full p-3", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col gap-6 lg:flex-row lg:items-start",
        month: "flex flex-1 flex-col gap-4",
        month_caption: "flex items-center justify-center px-10 pt-1",
        caption_label: "text-sm font-medium text-foreground",
        nav: "mb-3 flex items-center justify-between gap-2",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "h-8 w-8 shrink-0 bg-surface p-0"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "h-8 w-8 shrink-0 bg-surface p-0"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-[0.8rem] font-medium text-on-surface-muted",
        week: "mt-2 flex w-full",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-9 rounded-md p-0 font-normal aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground"
        ),
        selected: "bg-primary/15 text-foreground",
        range_start: "bg-primary/15 rounded-s-md",
        range_middle: "bg-primary/10",
        range_end: "bg-primary/15 rounded-e-md",
        today: "text-foreground",
        outside: "text-on-surface-muted opacity-50",
        disabled: "text-on-surface-muted opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-4", iconClassName)}
                {...iconProps}
              />
            )
          }

          return (
            <ChevronRightIcon
              className={cn("size-4", iconClassName)}
              {...iconProps}
            />
          )
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
