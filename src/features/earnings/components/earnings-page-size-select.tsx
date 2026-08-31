"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export type EarningsPageSize = 10 | 25 | 50 | 100 | "all"

type EarningsPageSizeSelectProps = {
  value: EarningsPageSize
  label: string
  options: {
    ten: string
    twentyFive: string
    fifty: string
    oneHundred: string
    all: string
  }
  disabled?: boolean
  onChange: (value: EarningsPageSize) => void
}

export function EarningsPageSizeSelect({
  value,
  label,
  options,
  disabled = false,
  onChange,
}: EarningsPageSizeSelectProps) {
  const items = [
    { value: "10", label: options.ten },
    { value: "25", label: options.twentyFive },
    { value: "50", label: options.fifty },
    { value: "100", label: options.oneHundred },
    { value: "all", label: options.all },
  ]

  function handleChange(value: string | null) {
    if (!value) return
    if (value === "all") {
      onChange("all")
      return
    }

    const nextValue = Number(value)
    if (
      nextValue === 10 ||
      nextValue === 25 ||
      nextValue === 50 ||
      nextValue === 100
    ) {
      onChange(nextValue)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor="earnings-page-size"
        className="text-xs font-medium text-on-surface-muted"
      >
        {label}
      </Label>
      <Select
        value={String(value)}
        onValueChange={handleChange}
        disabled={disabled}
        items={items}
      >
        <SelectTrigger
          id="earnings-page-size"
          aria-label={label}
          size="sm"
          className="min-w-16 bg-surface"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
