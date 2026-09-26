"use client"

import Link from "next/link"
import { PencilLine, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { SortHeader, ariaSort } from "@/components/ui/sort-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SortState } from "@/lib/sort"
import type { CourseOut } from "@/features/shell/schema"
import { formatEarnings, formatPrice, type CourseCardMetrics } from "../course-card"
import { CourseCover } from "./course-cover"
import { CourseStatusBadge, PublishCourseButton } from "./course-status"
import { courseStatus, type CourseSortKey } from "./course-overview-model"

/** Compact, scannable alternative to the card grid. */
export function CourseTable({
  courses,
  teacherProfileId,
  locale,
  gradeNames,
  streamNames,
  metricsFor,
  sort,
  onSort,
}: {
  courses: CourseOut[]
  teacherProfileId: number
  locale: string
  gradeNames: Record<number, string>
  streamNames: Record<number, string>
  metricsFor: (course: CourseOut) => CourseCardMetrics
  sort: SortState<CourseSortKey>
  onSort: (key: CourseSortKey) => void
}) {
  const t = useTranslations("courses")
  const tw = useTranslations("teacherWorkspace.courses")
  const number = new Intl.NumberFormat(locale)
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })

  const sortable = (key: CourseSortKey, label: string) => (
    <TableHead className="px-3 py-2.5" aria-sort={ariaSort(sort, key)}>
      <SortHeader label={label} column={key} sort={sort} onSort={onSort} />
    </TableHead>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <Table className="min-w-[52rem]">
        <TableHeader className="bg-surface-muted text-xs font-semibold text-on-surface-muted">
          <TableRow>
            {sortable("title", tw("column_course"))}
            <TableHead className="px-3 py-2.5">{tw("column_status")}</TableHead>
            {sortable("students", tw("metric_students"))}
            {sortable("earnings", tw("metric_earnings"))}
            <TableHead className="px-3 py-2.5">{t("price")}</TableHead>
            {sortable("created", tw("column_created"))}
            <TableHead className="px-3 py-2.5">
              <span className="sr-only">{tw("column_actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => {
            const status = courseStatus(course)
            const metrics = metricsFor(course)
            const meta = [course.subject_name, gradeNames[course.grade_id], streamNames[course.stream_id]]
              .filter(Boolean)
              .join(" · ")
            return (
              <TableRow key={course.id} data-status={status}>
                <TableCell className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <CourseCover
                      img={course.img}
                      title={course.title}
                      subjectId={course.subject_id}
                      subjectName={course.subject_name}
                      size="thumb"
                      className="size-10 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/${locale}/courses/${course.id}`}
                        className="block max-w-[22rem] truncate rounded-sm text-sm font-medium text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        {course.title}
                      </Link>
                      {meta ? <p className="truncate text-xs text-on-surface-muted">{meta}</p> : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <CourseStatusBadge status={status} />
                </TableCell>
                <TableCell className="px-3 py-2 text-sm tabular-nums">
                  <span className="font-medium text-foreground">
                    {metrics.students == null ? "—" : number.format(metrics.students)}
                  </span>
                  {metrics.pending > 0 ? (
                    <span className="ms-2 text-xs text-warning">
                      {tw("pending_count", { count: metrics.pending })}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm font-medium text-foreground tabular-nums">
                  {formatEarnings(metrics.earnings, locale)}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm text-on-surface-muted tabular-nums">
                  {course.price === "0.00" ? t("free") : formatPrice(course.price, locale)}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm text-on-surface-muted tabular-nums">
                  {date.format(new Date(course.created_at))}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    {status === "draft" ? (
                      <PublishCourseButton courseId={course.id} teacherProfileId={teacherProfileId} />
                    ) : null}
                    <Link
                      href={`/${locale}/students?course=${course.id}`}
                      aria-label={`${tw("view_students")}: ${course.title}`}
                      title={tw("view_students")}
                      className="inline-flex size-7 items-center justify-center rounded-md text-on-surface-muted hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <Users className="size-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/${locale}/courses/${course.id}`}
                      aria-label={`${t("edit")}: ${course.title}`}
                      title={t("edit")}
                      className="inline-flex size-7 items-center justify-center rounded-md text-on-surface-muted hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <PencilLine className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
