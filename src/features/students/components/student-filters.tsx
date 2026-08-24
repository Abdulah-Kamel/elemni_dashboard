"use client"

import { Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StudentFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  statusOptions: string[]
  courseFilter: string
  onCourseChange: (value: string) => void
  courses: string[]
  gradeFilter: string
  onGradeChange: (value: string) => void
  grades: string[]
  streamFilter: string
  onStreamChange: (value: string) => void
  streams: string[]
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
}: StudentFiltersProps) {
  const t = useTranslations("student")
  const statusItems = [
    { value: "all", label: t("filter_all_statuses") },
    ...statusOptions.map((status) => ({
      value: status,
      label: getStatusLabel(status, t),
    })),
  ]
  const courseItems = [
    { value: "all", label: t("filter_all_courses") },
    ...courses.map((course) => ({ value: course, label: course })),
  ]
  const gradeItems = [
    { value: "all", label: t("filter_all_grades") },
    ...grades.map((grade) => ({ value: grade, label: grade })),
  ]
  const streamItems = [
    { value: "all", label: t("filter_all_streams") },
    ...streams.map((stream) => ({ value: stream, label: stream })),
  ]

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface-muted p-3 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted"
          aria-hidden="true"
        />
        <Input
          placeholder={t("search_placeholder")}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-border bg-surface ps-8"
        />
      </div>

      <Select
        value={statusFilter}
        onValueChange={(value) => onStatusChange(value ?? "all")}
        items={statusItems}
      >
        <SelectTrigger className="w-full bg-surface">
          <SelectValue placeholder={t("filter_status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={courseFilter}
        onValueChange={(value) => onCourseChange(value ?? "all")}
        items={courseItems}
      >
        <SelectTrigger className="w-full bg-surface">
          <SelectValue placeholder={t("filter_course")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {courseItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={gradeFilter}
        onValueChange={(value) => onGradeChange(value ?? "all")}
        items={gradeItems}
      >
        <SelectTrigger className="w-full bg-surface">
          <SelectValue placeholder={t("filter_grade")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {gradeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={streamFilter}
        onValueChange={(value) => onStreamChange(value ?? "all")}
        items={streamItems}
      >
        <SelectTrigger className="w-full bg-surface">
          <SelectValue placeholder={t("filter_stream")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {streamItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
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
    default:
      return status
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
  }
}
