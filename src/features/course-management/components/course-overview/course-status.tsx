"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCourseMutations } from "@/features/course-management/hooks/use-course-management-queries"
import type { courseStatus } from "./course-overview-model"

type Status = ReturnType<typeof courseStatus>

const STATUS_STYLE: Record<Status, string> = {
  published: "bg-success-tint text-success",
  draft: "bg-warning-tint text-warning",
  archived: "bg-surface-strong text-on-surface-muted",
}

const STATUS_DOT: Record<Status, string> = {
  published: "bg-success",
  draft: "bg-warning",
  archived: "bg-on-surface-muted",
}

export function CourseStatusBadge({ status, className }: { status: Status; className?: string }) {
  const t = useTranslations("courses")
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLE[status],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} aria-hidden="true" />
      {t(status)}
    </span>
  )
}

/**
 * One-click publish for a draft. The API decides whether the course is ready;
 * a rejection is shown inline, never assumed away.
 */
export function PublishCourseButton({
  courseId,
  teacherProfileId,
  className,
}: {
  courseId: number
  teacherProfileId: number
  className?: string
}) {
  const t = useTranslations("courses")
  const { publish } = useCourseMutations(teacherProfileId)
  const [error, setError] = useState<string | null>(null)

  async function handlePublish() {
    setError(null)
    try {
      await publish.mutateAsync(courseId)
    } catch (err) {
      const type = (err as { type?: string } | null)?.type
      setError(type === "Validation" || type === "Conflict" ? t("publish_rejected") : t("error_upstream"))
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={publish.isPending}
        onClick={() => void handlePublish()}
        aria-busy={publish.isPending}
      >
        {publish.isPending ? (
          <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <Send className="rtl:-scale-x-100" aria-hidden="true" />
        )}
        {t("publish")}
      </Button>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
