"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CourseForm } from "./course-form"
import { CourseCoverPicker } from "./course-cover-picker"
import { PreviewWorkspace } from "@/features/student-preview/preview-workspace"
import { StudentCourseDetailPreview } from "@/features/student-preview/student-course-detail-preview"
import { buildCoursePreviewModel } from "@/features/student-preview/build-course-preview-model"
import { CourseBuilderBridgeProvider } from "@/features/course-management/course-builder-bridge"
import {
  courseFormSchema,
  formValuesToCourseCreate,
  type CourseFormValues,
  type GradeOut,
  type StreamOut,
  type SubjectOut,
} from "@/features/course-management/schema"
import { useCourseMutations } from "@/features/course-management/hooks/use-course-management-queries"
import { uploadCourseCover } from "@/features/course-management/upload-course-cover"
import { getActionError } from "@/lib/query-action"
import { useRouter } from "@/i18n/routing"

const emptyValues: CourseFormValues = {
  title: "",
  description: null,
  price: "0.00",
  subjectId: 0,
  gradeId: 0,
  streamId: 0,
  useChapters: false,
}

export function CreateCourseWorkspace({
  locale,
  teacherProfileId,
  teacherName,
  subjects,
  grades,
  streams,
}: {
  locale: string
  teacherProfileId: number
  teacherName: string
  subjects: SubjectOut[]
  grades: GradeOut[]
  streams: StreamOut[]
}) {
  const t = useTranslations("courses")
  const router = useRouter()
  const { create, update } = useCourseMutations(teacherProfileId)
  const [formValues, setFormValues] = useState<CourseFormValues | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const coverObjectUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile]
  )

  useEffect(() => {
    return () => {
      if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl)
    }
  }, [coverObjectUrl])

  const values = formValues ?? emptyValues
  const previewModel = useMemo(
    () =>
      buildCoursePreviewModel({
        courseId: null,
        values,
        coverObjectUrl,
        publicCoverUrl: null,
        teacher: { name: teacherName, avatarUrl: null },
        subjects,
        grades,
        streams,
        sections: [],
        locale,
      }),
    [values, coverObjectUrl, teacherName, subjects, grades, streams, locale]
  )

  const handleSave = useCallback(async () => {
    setApiErrors({})
    setError(null)
    const raw = formValues ?? emptyValues
    const current: CourseFormValues = {
      ...raw,
      subjectId: raw.subjectId ?? 0,
      gradeId: raw.gradeId ?? 0,
      streamId: raw.streamId ?? 0,
    }
    const parsed = courseFormSchema.safeParse(current)
    if (!parsed.success) {
      const fieldMap: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "")
        if (key === "title" && !fieldMap.title) fieldMap.title = t("title_required")
        else if (key && !fieldMap[key]) fieldMap[key] = issue.message
      }
      if (current.subjectId === 0) fieldMap.subjectId = t("subject_label")
      if (current.gradeId === 0) fieldMap.gradeId = t("grade_label")
      if (current.streamId === 0) fieldMap.streamId = t("stream_label")
      setApiErrors(fieldMap)
      return
    }

    setSubmitting(true)
    try {
      const body = formValuesToCourseCreate(parsed.data)
      const course = await create.mutateAsync(body)
      let coverFailed = false
      if (coverFile) {
        try {
          const imagePath = await uploadCourseCover(course.id, coverFile)
          await update.mutateAsync({ courseId: course.id, data: { img: imagePath } })
        } catch {
          coverFailed = true
          toast.warning(t("course_created_cover_failed"))
        }
      }
      if (!coverFailed) toast.success(t("course_created"))
      router.push(`/${locale}/courses/${course.id}`)
    } catch (err) {
      const actionError = getActionError(err)
      if (actionError?.type === "Validation" && actionError.fields) {
        const fieldMap: Record<string, string> = {}
        actionError.fields.forEach((field) => {
          fieldMap[field.replace("body.", "")] = actionError.message
        })
        setApiErrors(fieldMap)
      } else {
        setError(actionError?.message ?? t("error_upstream"))
      }
    } finally {
      setSubmitting(false)
    }
  }, [coverFile, create, formValues, locale, router, t, update])

  const editor = (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-headline-md font-bold">{t("create_title")}</h1>
        <p className="mt-1 text-sm text-on-surface-muted">{t("create_subtitle")}</p>
      </div>
      <CourseForm
        subjects={subjects}
        grades={grades}
        streams={streams}
        onChange={setFormValues}
        errors={apiErrors}
        disabled={submitting}
      />
      <CourseCoverPicker
        currentImageUrl={null}
        file={coverFile}
        onChange={setCoverFile}
        disabled={submitting}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={() => void handleSave()} disabled={submitting}>
        {submitting ? t("saving") : t("save_and_continue")}
      </Button>
    </div>
  )

  const preview = (
    <CourseBuilderBridgeProvider enabled={false}>
      <StudentCourseDetailPreview
        model={previewModel}
        locale={locale}
        interactionMode="local-only"
        hideCurriculum
      />
    </CourseBuilderBridgeProvider>
  )

  return <PreviewWorkspace editor={editor} preview={preview} locale={locale} />
}
