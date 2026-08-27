"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { BookOpen, Layers3 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CourseOut } from "@/features/shell/schema"
import { CourseCardActions } from "./course-card-actions"

function formatPrice(price: string, locale: string): string {
  const num = Number(price)
  if (Number.isNaN(num)) return price
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export function CourseCard({
  course,
  teacherProfileId,
  locale,
  gradeName,
  streamName,
  className,
}: {
  course: CourseOut
  teacherProfileId: number
  locale: string
  gradeName?: string
  streamName?: string
  className?: string
}) {
  const t = useTranslations("courses")
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = course.img && !imageFailed

  return (
    <article
      data-slot="card"
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md ${className ?? ""}`}
    >
      <Link
        href={`/${locale}/courses/${course.id}`}
        className="relative block aspect-video overflow-hidden bg-primary-tint focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
        aria-label={`${t("manage")}: ${course.title}`}
      >
        {hasImage ? (
          <Image
            src={course.img ?? ""}
            alt={course.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary-tint via-surface-muted to-primary-tint text-primary">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-surface/80 ring-1 ring-primary/10">
              <BookOpen className="size-8" aria-hidden="true" />
            </span>
          </span>
        )}
        <span className="absolute inset-x-0 top-0 flex items-start justify-between bg-linear-to-b from-on-surface/45 to-transparent p-3">
          <Badge
            className={cn(
              "border-0 shadow-xs",
              course.is_published
                ? "bg-success-tint text-success"
                : "bg-surface/95 text-on-surface-muted"
            )}
          >
            {course.is_published ? t("published") : t("draft")}
          </Badge>
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          <Link
            href={`/${locale}/courses/${course.id}`}
            className="line-clamp-2 text-title-lg font-bold text-on-surface transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {course.title}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 text-label-md text-on-surface-muted">
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
        </div>

        <div className="flex items-center justify-between gap-3 text-label-md text-on-surface-muted">
          <span className="inline-flex items-center gap-1.5">
            <Layers3 className="size-3.5" aria-hidden="true" />
            {course.use_chapters ? t("chapters_organized") : t("flat_lessons")}
          </span>
          <span className="shrink-0 text-sm font-bold text-primary">
            {course.price === "0.00"
              ? t("free")
              : formatPrice(course.price, locale)}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
          <Link
            href={`/${locale}/courses/${course.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "flex-1 bg-surface font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            {t("manage")}
          </Link>
          <CourseCardActions
            courseId={course.id}
            isPublished={course.is_published}
            teacherProfileId={teacherProfileId}
          />
        </div>
      </div>
    </article>
  )
}
