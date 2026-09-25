"use client"

import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CONTROL, ERROR_TEXT, FIELD_LABEL } from "./styles"

/** Accessible on/off switch (role="switch"); the hit area is 44px tall. */
export function Switch({ checked, onChange, label, disabled, id }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group/switch relative flex h-11 w-12 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden className={cn("flex h-[26px] w-11 items-center rounded-full p-[3px] transition-colors duration-200", checked ? "bg-primary" : "bg-border-strong dark:bg-surface-strong")}>
        <span className={cn("block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none", checked ? "translate-x-[18px] rtl:-translate-x-[18px]" : "translate-x-0")} />
      </span>
    </button>
  )
}

/** A row with text on one side and a switch on the other (design pattern). */
export function SwitchRow({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="flex min-w-0 flex-col gap-0.5 text-sm">
        <span>{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </label>
      <Switch id={id} checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className={cn("text-xs font-medium motion-safe:animate-in motion-safe:fade-in", ERROR_TEXT)}>
      {children}
    </p>
  )
}

export function Field({ label, htmlFor, hint, error, errorId, children, className }: { label: ReactNode; htmlFor?: string; hint?: ReactNode; error?: ReactNode; errorId?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className={FIELD_LABEL}>
        {label}
        {hint ? <span className="ms-1 font-normal text-muted-foreground">{hint}</span> : null}
      </label>
      {children}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

/** Segmented control rendered as a radiogroup with roving arrow keys. */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (value: T) => void; options: { value: T; label: string }[]; label: string }) {
  const move = (delta: number) => {
    const index = options.findIndex((option) => option.value === value)
    const next = options[(index + delta + options.length) % options.length]
    onChange(next.value)
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1.5 rounded-xl bg-muted p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      onKeyDown={(event) => {
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
        if (event.key === "ArrowDown" || event.key === (rtl ? "ArrowLeft" : "ArrowRight")) {
          event.preventDefault()
          move(1)
        } else if (event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft")) {
          event.preventDefault()
          move(-1)
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-11 rounded-[9px] text-[13px] outline-none transition-[background-color,box-shadow,color] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
              selected ? "border-[1.5px] border-foreground bg-card font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** Ui-kit Select with a plain options list. Use "" for "nothing chosen". */
export function ChoiceSelect({ id, value, onChange, options, placeholder, invalid, disabled, describedBy, ariaLabel }: { id?: string; ariaLabel?: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder?: string; invalid?: boolean; disabled?: boolean; describedBy?: string }) {
  return (
    <Select value={value || null} onValueChange={(next) => onChange(typeof next === "string" ? next : "")} items={options} disabled={disabled}>
      <SelectTrigger id={id} aria-label={ariaLabel} aria-invalid={invalid || undefined} aria-describedby={describedBy} className={cn(CONTROL, "w-full data-[size=default]:h-11")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="min-h-10">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
