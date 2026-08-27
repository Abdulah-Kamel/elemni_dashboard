"use client"

import { useMemo, useState } from "react"
import { Search, SearchX } from "lucide-react"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { CourseOut } from "@/features/shell/schema"
import { CourseCard } from "./course-card"
import { EmptyState } from "./empty-state"

type StatusFilter = "all" | "published" | "draft"

const FILTERS: StatusFilter[] = ["all", "published", "draft"]

const STAGGER = ["animate-stagger-1", "animate-stagger-2", "animate-stagger-3", "animate-stagger-4", "animate-stagger-5", "animate-stagger-6"]

export function CourseList({
  courses,
  teacherProfileId,
  error,
  isEmpty,
  locale,
  gradeNames = {},
  streamNames = {},
}: {
  courses: CourseOut[]
  teacherProfileId: number
  error: string | null
  isEmpty: boolean
  locale: string
  gradeNames?: Record<number, string>
  streamNames?: Record<number, string>
}) {
  const t = useTranslations("courses")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(locale)
    return courses.filter((course) => {
      const matchesStatus =
        status === "all" ||
        (status === "published" ? course.is_published : !course.is_published)
      if (!matchesStatus) return false
      if (!term) return true

      return [
        course.title,
        course.description,
        course.subject_name,
        gradeNames[course.grade_id],
        streamNames[course.stream_id],
      ].some((value) => value?.toLocaleLowerCase(locale).includes(term))
    })
  }, [courses, gradeNames, locale, search, status, streamNames])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isEmpty) return <EmptyState />

  return (
    <div className="space-y-5">
      <div className="flex animate-slide-up flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("search_placeholder")}
            aria-label={t("search_placeholder")}
            className="h-10 bg-surface ps-9"
          />
        </div>
        <div
          className="flex rounded-xl border border-border bg-surface-muted p-1"
          role="group"
          aria-label={t("filter_label")}
        >
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatus(filter)}
              aria-pressed={status === filter}
              className={cnFilter(status === filter)}
            >
              {t(`filter_${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <span className="mb-3 rounded-2xl bg-surface-muted p-3 text-on-surface-muted">
            <SearchX className="size-6" aria-hidden="true" />
          </span>
          <h2 className="font-semibold text-on-surface">{t("no_results")}</h2>
          <p className="mt-1 text-sm text-on-surface-muted">
            {t("no_results_hint")}
          </p>
        </div>
      ) : (
        <div className="grid animate-slide-up gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              teacherProfileId={teacherProfileId}
              locale={locale}
              gradeName={gradeNames[course.grade_id]}
              streamName={streamNames[course.stream_id]}
              className={`animate-slide-up ${STAGGER[index % STAGGER.length]}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function cnFilter(active: boolean): string {
  return `min-w-20 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
    active
      ? "bg-primary text-primary-foreground shadow-xs"
      : "text-on-surface-muted hover:bg-surface hover:text-on-surface"
  }`
}

export function CourseListSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Skeleton className="h-10 w-full sm:max-w-md" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="border-t border-border pt-3">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
