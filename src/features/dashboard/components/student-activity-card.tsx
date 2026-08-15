"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  StudentActivity,
  StudentActivityStatus,
} from "@/features/dashboard/schema"

const STUDENT_TINTS: Record<StudentActivity["studentTint"], string> = {
  violet: "bg-primary-tint text-primary",
  amber: "bg-warning-tint text-warning",
  emerald: "bg-success-tint text-success",
  rose: "bg-error-tint text-error",
}

const STATUS_TINTS: Record<StudentActivityStatus, string> = {
  success: "bg-success-tint text-success",
  pending: "bg-warning-tint text-warning",
}

type Props = {
  activity: Array<
    StudentActivity & {
      actionLabel: string
      timeLabel: string
    }
  >
  title: string
  headers: {
    student: string
    action: string
    course: string
    status: string
    date: string
  }
  statuses: {
    success: string
    pending: string
  }
  filters: {
    searchPlaceholder: string
    noResults: string
    allActions: string
    allCourses: string
    allStatuses: string
    completedLesson: string
    submittedAssignment: string
    enrolled: string
  }
}

export function StudentActivityCard({
  activity,
  title,
  headers,
  statuses,
  filters,
}: Props) {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const actionItems = [
    { value: "all", label: filters.allActions },
    { value: "completed_lesson", label: filters.completedLesson },
    { value: "submitted_assignment", label: filters.submittedAssignment },
    { value: "enrolled", label: filters.enrolled },
  ]
  const courseItems = [
    { value: "all", label: filters.allCourses },
    ...[...new Set(activity.map((row) => row.course))]
      .sort()
      .map((course) => ({ value: course, label: course })),
  ]
  const statusItems = [
    { value: "all", label: filters.allStatuses },
    { value: "success", label: statuses.success },
    { value: "pending", label: statuses.pending },
  ]
  const filteredActivity = useMemo(() => {
    const term = search.trim().toLowerCase()

    return activity.filter((row) => {
      const matchesSearch =
        !term ||
        row.studentName.toLowerCase().includes(term) ||
        row.course.toLowerCase().includes(term)
      const matchesAction =
        actionFilter === "all" || row.action.kind === actionFilter
      const matchesCourse =
        courseFilter === "all" || row.course === courseFilter
      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter

      return matchesSearch && matchesAction && matchesCourse && matchesStatus
    })
  }, [actionFilter, activity, courseFilter, search, statusFilter])

  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-xs">
      <div className="border-b border-border px-md pt-md pb-3">
        <h2 className="text-title-lg text-title-lg--line-height font-semibold text-foreground">
          {title}
        </h2>
      </div>

      <div className="border-b border-border px-md py-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
            <Input
              className="ps-9"
              placeholder={filters.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select
            value={actionFilter}
            onValueChange={(value) => setActionFilter(value ?? "all")}
            items={actionItems}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={filters.allActions} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {actionItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={courseFilter}
            onValueChange={(value) => setCourseFilter(value ?? "all")}
            items={courseItems}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={filters.allCourses} />
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
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value ?? "all")}
            items={statusItems}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder={filters.allStatuses} />
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
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="grid grid-cols-[1.4fr_1.4fr_1.6fr_0.8fr_0.8fr] gap-md bg-surface-muted px-md py-2.5 text-label-sm text-label-sm--line-height font-semibold text-on-surface-muted">
            <TableHead>{headers.student}</TableHead>
            <TableHead>{headers.action}</TableHead>
            <TableHead>{headers.course}</TableHead>
            <TableHead>{headers.status}</TableHead>
            <TableHead className="text-end">{headers.date}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredActivity.length ? (
            filteredActivity.map((row) => (
              <TableRow
                key={row.id}
                className="grid grid-cols-[1.4fr_1.4fr_1.6fr_0.8fr_0.8fr] items-center gap-md border-b border-border px-md py-3 last:border-b-0"
              >
                <TableCell className="flex items-center gap-2.5">
                  <Avatar
                    className={`size-8 shrink-0 ${STUDENT_TINTS[row.studentTint]}`}
                  >
                    <AvatarFallback className="text-label-sm font-semibold">
                      {row.studentInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-body-md text-body-md--line-height font-medium text-foreground">
                    {row.studentName}
                  </span>
                </TableCell>
                <TableCell className="truncate text-body-md text-body-md--line-height text-on-surface-muted">
                  {row.actionLabel}
                </TableCell>
                <TableCell className="truncate text-body-md text-body-md--line-height text-foreground">
                  {row.course}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-sm text-label-sm--line-height font-semibold ${STATUS_TINTS[row.status]}`}
                  >
                    {row.status === "success"
                      ? statuses.success
                      : statuses.pending}
                  </span>
                </TableCell>
                <TableCell
                  className="text-end text-label-sm text-label-sm--line-height text-on-surface-muted"
                  dir="ltr"
                >
                  {row.timeLabel}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="px-md py-8 text-center text-sm text-on-surface-muted"
              >
                {filters.noResults}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
