"use client"

import { useMemo, useState } from "react"
import { BookOpen, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { DashboardPagination } from "@/components/dashboard-pagination"
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
import type { CourseUsageRow } from "@/features/storage/types"

const ITEMS_PER_PAGE = 10

const STATUS_STYLES: Record<string, string> = {
  published: "bg-success-tint text-success",
  draft: "bg-surface-strong text-on-surface-muted",
}

export function StorageTable({ rows }: { rows: CourseUsageRow[] }) {
  const t = useTranslations("storage")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | CourseUsageRow["status"]
  >("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [streamFilter, setStreamFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const statusItems = [
    { value: "all", label: t("all_statuses") },
    { value: "published", label: t("published") },
    { value: "draft", label: t("draft") },
  ]
  const subjectItems = [
    { value: "all", label: t("all_subjects") },
    ...uniqueValues(rows.map((row) => row.subject)).map((subject) => ({
      value: subject,
      label: subject,
    })),
  ]
  const gradeItems = [
    { value: "all", label: t("all_grades") },
    ...uniqueValues(rows.map((row) => row.grade)).map((grade) => ({
      value: grade,
      label: grade,
    })),
  ]
  const streamItems = [
    { value: "all", label: t("all_streams") },
    ...uniqueValues(rows.map((row) => row.stream)).map((stream) => ({
      value: stream,
      label: stream,
    })),
  ]

  const filtered = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()

    return rows.filter((course) => {
      const matchesSearch =
        !normalizedTerm ||
        course.title.toLowerCase().includes(normalizedTerm) ||
        course.subject?.toLowerCase().includes(normalizedTerm) ||
        course.grade?.toLowerCase().includes(normalizedTerm) ||
        course.stream?.toLowerCase().includes(normalizedTerm)
      const matchesStatus =
        statusFilter === "all" || course.status === statusFilter
      const matchesSubject =
        subjectFilter === "all" || course.subject === subjectFilter
      const matchesGrade = gradeFilter === "all" || course.grade === gradeFilter
      const matchesStream =
        streamFilter === "all" || course.stream === streamFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSubject &&
        matchesGrade &&
        matchesStream
      )
    })
  }, [gradeFilter, rows, searchTerm, statusFilter, streamFilter, subjectFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginatedRows = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  function updateAndReset(filterAction: () => void) {
    filterAction()
    setCurrentPage(1)
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-xs">
      <div className="grid gap-3 border-b border-border px-4 py-3 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
          <Input
            placeholder={t("search_courses")}
            value={searchTerm}
            onChange={(e) =>
              updateAndReset(() => {
                setSearchTerm(e.target.value)
              })
            }
            className="border-border bg-surface ps-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            updateAndReset(() => {
              setStatusFilter(value as "all" | CourseUsageRow["status"])
            })
          }
          items={statusItems}
        >
          <SelectTrigger className="w-full">
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
          value={subjectFilter}
          onValueChange={(value) =>
            updateAndReset(() => {
              setSubjectFilter(value ?? "all")
            })
          }
          items={subjectItems}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("filter_subject")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {subjectItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={gradeFilter}
          onValueChange={(value) =>
            updateAndReset(() => {
              setGradeFilter(value ?? "all")
            })
          }
          items={gradeItems}
        >
          <SelectTrigger className="w-full">
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
          onValueChange={(value) =>
            updateAndReset(() => {
              setStreamFilter(value ?? "all")
            })
          }
          items={streamItems}
        >
          <SelectTrigger className="w-full">
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
      <Table>
        <TableHeader className="bg-surface-muted text-xs font-bold text-on-surface-muted">
          <TableRow>
            <TableHead className="px-4 py-3">{t("course_name")}</TableHead>
            <TableHead className="px-4 py-3">{t("subject")}</TableHead>
            <TableHead className="px-4 py-3">{t("grade")}</TableHead>
            <TableHead className="px-4 py-3">{t("stream")}</TableHead>
            <TableHead className="px-4 py-3">{t("lessons")}</TableHead>
            <TableHead className="px-4 py-3">{t("items")}</TableHead>
            <TableHead className="px-4 py-3">{t("content_mix")}</TableHead>
            <TableHead className="px-4 py-3">{t("subscriptions")}</TableHead>
            <TableHead className="px-4 py-3">{t("status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="px-4 py-8 text-center text-xs text-on-surface-muted"
              >
                {t("no_results")}
              </TableCell>
            </TableRow>
          ) : (
            paginatedRows.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary-tint text-primary">
                      <BookOpen className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {course.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {course.subject ?? t("not_available")}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {course.grade ?? t("not_available")}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {course.stream ?? t("not_available")}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {course.lessonCount}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {course.itemCount}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <ContentBadge
                      label={t("videos")}
                      value={course.videoCount}
                    />
                    <ContentBadge
                      label={t("documents")}
                      value={course.documentCount}
                    />
                    <ContentBadge label={t("exams")} value={course.examCount} />
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {course.subscriptionCount}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[course.status]}`}
                  >
                    {t(course.status)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="border-t border-border px-4 py-3">
        <DashboardPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          labels={{
            previous: t("prev_page"),
            next: t("next_page"),
            page: (page, pages) => t("pagination", { page, pages }),
            summary: (from, to, total) => t("showing", { from, to, total }),
          }}
        />
      </div>
    </div>
  )
}

function ContentBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-1 text-on-surface-muted">
      {label}: {value}
    </span>
  )
}

function uniqueValues(values: Array<string | null>) {
  return [...new Set(values.filter(Boolean) as string[])].sort()
}
