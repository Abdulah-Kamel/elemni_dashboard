"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { CourseForm } from "./course-form"
import { CourseCoverPicker } from "./course-cover-picker"
import {
  createCourse,
  listSubjectsAction,
  listGradesAction,
  listStreamsAction,
  updateCourse,
} from "@/features/course-management/actions"
import {
  formValuesToCourseCreate,
  courseFormSchema,
} from "@/features/course-management/schema"
import { uploadCourseCover } from "@/features/course-management/upload-course-cover"
import type {
  SubjectOut,
  GradeOut,
  StreamOut,
} from "@/features/course-management/schema"
import type { CourseFormValues } from "@/features/course-management/schema"

export function CreateCourseDialog({
  teacherProfileId,
}: {
  teacherProfileId: number
}) {
  const t = useTranslations("courses")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formValues, setFormValues] = useState<CourseFormValues | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<SubjectOut[]>([])
  const [grades, setGrades] = useState<GradeOut[]>([])
  const [streams, setStreams] = useState<StreamOut[]>([])

  const loadCurriculum = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [subs, grds, strms] = await Promise.all([
        listSubjectsAction(),
        listGradesAction(),
        listStreamsAction(),
      ])
      setSubjects(subs)
      setGrades(grds)
      setStreams(strms)
    } catch {
      setError(t("curriculum_unavailable"))
    } finally {
      setLoading(false)
    }
  }, [t])

  const handleSubmit = useCallback(async () => {
    if (!formValues) return
    setApiErrors({})
    setError(null)

    const parsed = courseFormSchema.safeParse(formValues)
    if (!parsed.success) {
      const fieldMap: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "")
        if (key && !fieldMap[key]) fieldMap[key] = issue.message
      }
      setApiErrors(fieldMap)
      return
    }

    setSubmitting(true)
    try {
      const body = formValuesToCourseCreate(parsed.data)
      const result = await createCourse(teacherProfileId, body)

      if (result.success) {
        let coverFailed = false
        if (coverFile) {
          try {
            const imagePath = await uploadCourseCover(
              result.course.id,
              coverFile
            )
            const imageResult = await updateCourse(
              result.course.id,
              teacherProfileId,
              { img: imagePath }
            )
            if (!imageResult.success) throw new Error(imageResult.error.message)
          } catch {
            coverFailed = true
            toast.warning(t("course_created_cover_failed"))
          }
        }
        if (!coverFailed) toast.success(t("course_created"))
        setOpen(false)
        setFormValues(null)
        setCoverFile(null)
      } else {
        const err = result.error
        if (err.type === "Validation") {
          if (err.fields) {
            const fieldMap: Record<string, string> = {}
            err.fields.forEach((f) => {
              const key = f.replace("body.", "")
              fieldMap[key] = err.message
            })
            setApiErrors(fieldMap)
          }
        } else {
          setError(err.message)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }, [coverFile, formValues, t, teacherProfileId])

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (val) loadCurriculum()
        if (!val) {
          setApiErrors({})
          setError(null)
          setFormValues(null)
          setCoverFile(null)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button id="create-course-trigger">
            <Plus data-icon="inline-start" />
            {t("create")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : error && subjects.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={loadCurriculum}>
                {t("retry")}
              </Button>
            </div>
          ) : (
            <>
              <CourseForm
                subjects={subjects}
                grades={grades}
                streams={streams}
                mode="create"
                onChange={setFormValues}
                errors={apiErrors}
                disabled={submitting}
              />

              <CourseCoverPicker
                file={coverFile}
                onChange={setCoverFile}
                disabled={submitting}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? t("saving") : t("save")}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
