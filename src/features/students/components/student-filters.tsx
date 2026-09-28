"use client"

import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type FilterOption = { value: string; label: string }

interface StudentFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  statusOptions: string[]
  courseFilter: string
  onCourseChange: (value: string) => void
  courses: FilterOption[]
  gradeFilter: string
  onGradeChange: (value: string) => void
  grades: FilterOption[]
  streamFilter: string
  onStreamChange: (value: string) => void
  streams: FilterOption[]
  accessFilter: string
  onAccessChange: (value: string) => void
  hasActiveFilters: boolean
  onClear: () => void
}

export function StudentFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  courseFilter,
  onCourseChange,
  courses,
  gradeFilter,
  onGradeChange,
  grades,
  streamFilter,
  onStreamChange,
  streams,
  accessFilter,
  onAccessChange,
  hasActiveFilters,
  onClear,
}: StudentFiltersProps) {
  const t = useTranslations("student")
  const tw = useTranslations("teacherWorkspace.students")

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-muted p-2 xl:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))_auto]">
      <div className="relative col-span-2 xl:col-span-1">
        <Search
          className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder={t("search_placeholder")}
          aria-label={t("search_placeholder")}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-border bg-surface ps-8"
        />
      </div>

      <FilterSelect
        label={t("filter_status")}
        value={statusFilter}
        onChange={onStatusChange}
        items={[
          { value: "all", label: t("filter_all_statuses") },
          ...statusOptions.map((status) => ({
            value: status,
            label: getStatusLabel(status, t),
          })),
        ]}
      />
      <FilterSelect
        label={t("filter_course")}
        value={courseFilter}
        onChange={onCourseChange}
        items={[{ value: "all", label: t("filter_all_courses") }, ...courses]}
      />
      <FilterSelect
        label={t("filter_grade")}
        value={gradeFilter}
        onChange={onGradeChange}
        items={[{ value: "all", label: t("filter_all_grades") }, ...grades]}
      />
      <FilterSelect
        label={t("filter_stream")}
        value={streamFilter}
        onChange={onStreamChange}
        items={[{ value: "all", label: t("filter_all_streams") }, ...streams]}
      />
      <FilterSelect
        label={tw("filter_access")}
        value={accessFilter}
        onChange={onAccessChange}
        items={[
          { value: "all", label: tw("access_all") },
          { value: "active", label: tw("access_active") },
          { value: "expiring", label: tw("access_expiring") },
          { value: "expired", label: tw("access_expired_filter") },
        ]}
      />
      <Button
        type="button"
        variant="ghost"
        onClick={onClear}
        disabled={!hasActiveFilters}
        className="col-span-2 h-8 text-on-surface-muted sm:col-span-1 xl:col-span-1"
      >
        <X data-icon="inline-start" aria-hidden="true" />
        {tw("clear_filters")}
      </Button>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  items: FilterOption[]
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange((next as string | null) ?? "all")}
      items={items}
    >
      <SelectTrigger className="w-full bg-surface" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function getStatusLabel(status: string, t: ReturnType<typeof useTranslations>) {
  switch (status) {
    case "completed":
      return t("status_completed")
    case "pending":
      return t("status_pending")
    case "failed":
      return t("status_failed")
    case "cancelled":
      return t("status_cancelled")
    case "refunded":
      return t("status_refunded")
    case "duplicate_paid":
      return t("status_duplicate_paid")
    default:
      return status
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
  }
}
