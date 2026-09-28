"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDownWideNarrow, ArrowUpNarrowWide, LayoutGrid, Rows3, Search, SearchX } from "lucide-react"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Skeleton } from "@/components/ui/skeleton"
import { nextSort, sortRows } from "@/lib/sort"
import { cn } from "@/lib/utils"
import type { CourseOut } from "@/features/shell/schema"
import { useCoursesQuery } from "@/features/course-management/hooks/use-course-management-queries"
import { CourseCard, type CourseCardMetrics } from "./course-card"
import { EmptyState } from "./empty-state"
import { CourseTable } from "./course-overview/course-table"
import {
  COURSE_SORT_KEYS,
  COURSE_STATUSES,
  EMPTY_COURSE_QUERY,
  courseSortAccessors,
  courseStatus,
  defaultDirection,
  serializeCourseQuery,
  type CourseMetrics,
  type CourseQueryState,
  type CourseSortKey,
  type CourseStatusFilter,
} from "./course-overview/course-overview-model"

const STAGGER = ["animate-stagger-1", "animate-stagger-2", "animate-stagger-3", "animate-stagger-4", "animate-stagger-5", "animate-stagger-6"]

const NO_METRICS: CourseMetrics = { counts: null, earnings: null }

export function CourseList({
  courses,
  teacherProfileId,
  error,
  isEmpty,
  locale,
  gradeNames = {},
  streamNames = {},
  metrics = NO_METRICS,
  initialQuery = EMPTY_COURSE_QUERY,
}: {
  courses: CourseOut[]
  teacherProfileId: number
  error: string | null
  isEmpty: boolean
  locale: string
  gradeNames?: Record<number, string>
  streamNames?: Record<number, string>
  metrics?: CourseMetrics
  /** Parsed from the URL on the server; see `parseCourseQuery`. */
  initialQuery?: CourseQueryState
}) {
  const t = useTranslations("courses")
  const tw = useTranslations("teacherWorkspace.courses")
  const coursesQuery = useCoursesQuery(teacherProfileId, courses, error)
  const currentCourses = useMemo(
    () => coursesQuery.data ?? [],
    [coursesQuery.data]
  )
  const queryError = coursesQuery.error as { message?: string } | null
  const displayError = error ?? queryError?.message ?? null
  const [query, setQuery] = useState<CourseQueryState>(initialQuery)
  const update = (patch: Partial<CourseQueryState>) =>
    setQuery((current) => ({ ...current, ...patch }))

  const queryString = serializeCourseQuery(query)
  useEffect(() => {
    const url = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", url)
    }
  }, [queryString])

  const statusCounts = useMemo(() => {
    const counts: Record<CourseStatusFilter, number> = { all: currentCourses.length, published: 0, draft: 0, archived: 0 }
    for (const course of currentCourses) counts[courseStatus(course)] += 1
    return counts
  }, [currentCourses])

  const visibleCourses = useMemo(() => {
    const term = query.q.trim().toLocaleLowerCase(locale)
    const filtered = currentCourses.filter((course) => {
      if (query.status !== "all" && courseStatus(course) !== query.status) return false
      if (!term) return true
      return [
        course.title,
        course.description,
        course.subject_name,
        gradeNames[course.grade_id],
        streamNames[course.stream_id],
      ].some((value) => value?.toLocaleLowerCase(locale).includes(term))
    })
    return sortRows(filtered, query.sort, courseSortAccessors(metrics), locale)
  }, [currentCourses, gradeNames, locale, metrics, query.q, query.sort, query.status, streamNames])

  const metricsFor = (course: CourseOut): CourseCardMetrics => ({
    students: metrics.counts ? (metrics.counts[course.id]?.students ?? 0) : null,
    pending: metrics.counts?.[course.id]?.pending ?? 0,
    earnings: metrics.earnings?.[course.id] ?? null,
  })

  if (coursesQuery.isPending && !displayError) {
    return <CourseListSkeleton />
  }

  if (displayError && !coursesQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{displayError}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void coursesQuery.refetch()}
          >
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isEmpty && currentCourses.length === 0) return <EmptyState />

  const sortItems = COURSE_SORT_KEYS.map((key) => ({ value: key, label: tw(`sort_${key}`) }))
  const DirectionIcon = query.sort.direction === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow

  return (
    <div className="space-y-4">
      <div className="flex animate-slide-up flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder={t("search_placeholder")}
            aria-label={t("search_placeholder")}
            className="h-9 bg-surface ps-9"
          />
        </div>
        <div
          className="flex overflow-x-auto rounded-lg border border-border bg-surface-muted p-0.5"
          role="group"
          aria-label={t("filter_label")}
        >
          {COURSE_STATUSES.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => update({ status: filter })}
              aria-pressed={query.status === filter}
              className={cnFilter(query.status === filter)}
            >
              {t(`filter_${filter}`)}
              <span aria-hidden="true" className="ms-1.5 tabular-nums opacity-70">
                {statusCounts[filter]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 lg:ms-auto">
          <Select
            value={query.sort.key}
            onValueChange={(value) => {
              const key = (value as CourseSortKey | null) ?? "created"
              update({ sort: { key, direction: defaultDirection(key) } })
            }}
            items={sortItems}
          >
            <SelectTrigger className="h-9 min-w-40 bg-surface" aria-label={tw("sort_label")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sortItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() =>
              update({
                sort: {
                  key: query.sort.key,
                  direction: query.sort.direction === "asc" ? "desc" : "asc",
                },
              })
            }
            aria-label={query.sort.direction === "asc" ? tw("sort_ascending") : tw("sort_descending")}
            title={query.sort.direction === "asc" ? tw("sort_ascending") : tw("sort_descending")}
          >
            <DirectionIcon aria-hidden="true" />
          </Button>
          <div
            className="flex rounded-lg border border-border bg-surface-muted p-0.5"
            role="group"
            aria-label={tw("view_label")}
          >
            {(
              [
                { id: "grid", icon: LayoutGrid, label: tw("view_grid") },
                { id: "table", icon: Rows3, label: tw("view_table") },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={query.view === id}
                aria-label={label}
                title={label}
                onClick={() => update({ view: id })}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  query.view === id
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-on-surface-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {visibleCourses.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <span className="mb-3 rounded-xl bg-surface-muted p-3 text-on-surface-muted">
            <SearchX className="size-6" aria-hidden="true" />
          </span>
          <h2 className="font-semibold text-on-surface">{t("no_results")}</h2>
          <p className="mt-1 text-sm text-on-surface-muted">
            {t("no_results_hint")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => update({ q: "", status: "all" })}
          >
            {tw("clear_filters")}
          </Button>
        </div>
      ) : query.view === "table" ? (
        <CourseTable
          courses={visibleCourses}
          teacherProfileId={teacherProfileId}
          locale={locale}
          gradeNames={gradeNames}
          streamNames={streamNames}
          metricsFor={metricsFor}
          sort={query.sort}
          onSort={(key) => update({ sort: nextSort(query.sort, key) })}
        />
      ) : (
        <div className="grid animate-slide-up gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCourses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              teacherProfileId={teacherProfileId}
              locale={locale}
              gradeName={gradeNames[course.grade_id]}
              streamName={streamNames[course.stream_id]}
              metrics={metricsFor(course)}
              className={`animate-slide-up ${STAGGER[index % STAGGER.length]}`}
            />
          ))}
        </div>
      )}
      {metrics.counts === null || metrics.earnings === null ? (
        <p className="text-xs text-on-surface-muted">{tw("metrics_partial")}</p>
      ) : null}
    </div>
  )
}

function cnFilter(active: boolean): string {
  return `inline-flex min-w-20 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
    active
      ? "bg-primary text-primary-foreground shadow-xs"
      : "text-on-surface-muted hover:bg-surface hover:text-on-surface"
  }`
}

export function CourseListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex flex-col gap-2 lg:flex-row">
        <Skeleton className="h-9 w-full lg:w-72" />
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-9 w-56 lg:ms-auto" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <Skeleton className="aspect-[5/2] w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-12 w-full" />
              <div className="border-t border-border pt-3">
                <Skeleton className="h-7 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
