"use client"

import Link from "next/link"
import { Layers3, PencilLine, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { CourseOut } from "@/features/shell/schema"
import { CourseCover } from "./course-overview/course-cover"
import { CourseStatusBadge, PublishCourseButton } from "./course-overview/course-status"
import { courseStatus } from "./course-overview/course-overview-model"

export type CourseCardMetrics = {
  /** null = the subscriptions list is unavailable, show a dash. */
  students: number | null
  pending: number
  /** null = no earnings figure from the API for this course. */
  earnings: number | null
}

export function formatPrice(price: string, locale: string): string {
  const num = Number(price)
  if (Number.isNaN(num)) return price
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatEarnings(value: number | null, locale: string): string {
  if (value == null) return "—"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function CourseCard({
  course,
  teacherProfileId,
  locale,
  gradeName,
  streamName,
  metrics,
  className,
}: {
  course: CourseOut
  teacherProfileId: number
  locale: string
  gradeName?: string
  streamName?: string
  metrics?: CourseCardMetrics
  className?: string
}) {
  const t = useTranslations("courses")
  const tw = useTranslations("teacherWorkspace.courses")
  const status = courseStatus(course)
  const isDraft = status === "draft"
  const href = `/${locale}/courses/${course.id}`
  const number = new Intl.NumberFormat(locale)

  return (
    <article
      data-slot="card"
      data-status={status}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border bg-surface transition-colors hover:border-primary/40",
        isDraft ? "border-dashed border-warning/60" : "border-border",
        className
      )}
    >
      <Link
        href={href}
        className="relative block aspect-[5/2] overflow-hidden focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
        aria-label={`${t("manage")}: ${course.title}`}
      >
        <CourseCover
          img={course.img}
          title={course.title}
          subjectId={course.subject_id}
          subjectName={course.subject_name}
          className={cn("absolute inset-0", status === "archived" && "grayscale")}
        />
        <span className="absolute top-2.5 start-2.5">
          <CourseStatusBadge status={status} className="ring-1 ring-surface/70" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <Link
            href={href}
            className="line-clamp-2 text-base font-semibold text-on-surface transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {course.title}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-on-surface-muted">
            {course.subject_name && <span>{course.subject_name}</span>}
            {gradeName && (
              <>
                <span aria-hidden="true">•</span>
                <span>{gradeName}</span>
              </>
            )}
            {streamName && (
              <>
                <span aria-hidden="true">•</span>
                <span>{streamName}</span>
              </>
            )}
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs text-on-surface-muted">
            <Layers3 className="size-3.5" aria-hidden="true" />
            {course.use_chapters ? t("chapters_organized") : t("flat_lessons")}
          </p>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-surface-muted/60 text-center">
          <div className="px-2 py-2">
            <dt className="text-[0.7rem] text-on-surface-muted">{tw("metric_students")}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
              {metrics?.students == null ? "—" : number.format(metrics.students)}
            </dd>
          </div>
          <div className="px-2 py-2">
            <dt className="text-[0.7rem] text-on-surface-muted">{tw("metric_earnings")}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-foreground tabular-nums">
              {formatEarnings(metrics?.earnings ?? null, locale)}
            </dd>
          </div>
          <div className="px-2 py-2">
            <dt className="text-[0.7rem] text-on-surface-muted">{t("price")}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-primary tabular-nums">
              {course.price === "0.00" ? t("free") : formatPrice(course.price, locale)}
            </dd>
          </div>
        </dl>

        {metrics && metrics.pending > 0 ? (
          <p className="text-xs text-warning">
            {tw("pending_count", { count: metrics.pending })}
          </p>
        ) : null}

        {isDraft ? (
          <p className="rounded-lg bg-warning-tint/60 px-3 py-2 text-xs text-on-surface">
            {tw("draft_hint")}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-start gap-2 border-t border-border pt-3">
          <Link
            href={href}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              isDraft
                ? "bg-primary text-primary-foreground hover:bg-primary/85"
                : "border border-border hover:bg-surface-muted"
            )}
          >
            <PencilLine className="size-3.5" aria-hidden="true" />
            {isDraft ? tw("continue_setup") : t("edit")}
          </Link>
          <Link
            href={`/${locale}/students?course=${course.id}`}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium transition-colors hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Users className="size-3.5" aria-hidden="true" />
            {tw("view_students")}
          </Link>
          {isDraft ? (
            <PublishCourseButton
              courseId={course.id}
              teacherProfileId={teacherProfileId}
              className="ms-auto"
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}
