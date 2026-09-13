"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { useCourseMutations } from "@/features/course-management/hooks/use-course-management-queries"

export function PublishSwitch({
  courseId,
  teacherProfileId,
  isPublished,
}: {
  courseId: number
  teacherProfileId: number
  isPublished: boolean
}) {
  const t = useTranslations("courses")
  const [published, setPublished] = useState(isPublished)
  const [error, setError] = useState<string | null>(null)
  const { publish, unpublish } = useCourseMutations(teacherProfileId)
  const submitting = publish.isPending || unpublish.isPending

  const handleToggle = async () => {
    if (submitting) return
    setError(null)
    const next = !published
    try {
      if (next) {
        await publish.mutateAsync(courseId)
      } else {
        await unpublish.mutateAsync(courseId)
      }
      setPublished(next)
    } catch {
      setError(t("error_upstream"))
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={published ? "default" : "secondary"}>
        {published ? t("published") : t("draft")}
      </Badge>
      <button
        type="button"
        role="switch"
        aria-checked={published}
        aria-label={t("published_status")}
        disabled={submitting}
        onClick={() => void handleToggle()}
        data-checked={published}
        className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-muted transition-colors data-[checked=true]:bg-primary disabled:cursor-wait disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          data-on={published}
          className="absolute top-0.5 start-0.5 size-5 rounded-full bg-background shadow transition-transform data-[on=true]:translate-x-5 rtl:data-[on=true]:-translate-x-5"
        />
      </button>
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
