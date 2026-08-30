"use client"

import { useState, useCallback, useEffect } from "react"
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
import { CourseForm } from "./course-form"
import { CourseCoverPicker } from "./course-cover-picker"
import {
  getTeacherCurriculumAction,
} from "@/features/course-management/actions"
import {
  formValuesToCourseUpdate,
  formatCoursePrice,
} from "@/features/course-management/schema"
import { uploadCourseCover } from "@/features/course-management/upload-course-cover"
import type {
  SubjectOut,
  GradeOut,
  StreamOut,
} from "@/features/course-management/schema"
import type { CourseFormValues } from "@/features/course-management/schema"
import {
  useCourseMutations,
  useCourseQuery,
} from "@/features/course-management/hooks/use-course-management-queries"
import { getActionError } from "@/lib/query-action"

type DialogState =
  | "idle"
  | "loading"
  | "submitting"
  | "validation-error"
  | "conflict"
  | "network-error"

export function EditCourseDialog({
  courseId,
  teacherProfileId,
  children,
}: {
  courseId: number
  teacherProfileId: number
  children: React.ReactElement
}) {
  const t = useTranslations("courses")
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<DialogState>("idle")
  const [formValues, setFormValues] = useState<CourseFormValues | null>(null)
  const [initialValues, setInitialValues] = useState<CourseFormValues | null>(
    null
  )
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<SubjectOut[]>([])
  const [grades, setGrades] = useState<GradeOut[]>([])
  const [streams, setStreams] = useState<StreamOut[]>([])
  const courseQuery = useCourseQuery(courseId, undefined, false)
  const { update } = useCourseMutations(teacherProfileId)

  const isDirty =
    initialValues !== null &&
    formValues !== null &&
    JSON.stringify(formValues) !== JSON.stringify(initialValues)

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const loadData = useCallback(async () => {
    setState("loading")
    try {
      const [courseResult, curriculum] = await Promise.all([
        courseQuery.refetch(),
        getTeacherCurriculumAction(),
      ])
      if (!courseResult.data) {
        throw courseResult.error ?? new Error(t("error_upstream"))
      }
      const course = courseResult.data
      setSubjects(curriculum.subjects)
      setGrades(curriculum.grades)
      setStreams(curriculum.streams)
      setCurrentImageUrl(course.img ?? null)
      const values: CourseFormValues = {
        title: course.title,
        description: course.description,
        price: formatCoursePrice(course.price),
        subjectId: course.subject_id ?? (null as unknown as number),
        gradeId: course.grade_id ?? (null as unknown as number),
        streamId: course.stream_id ?? (null as unknown as number),
        useChapters: course.use_chapters ?? false,
        isPublished: course.is_published ?? false,
      }
      setInitialValues(values)
      setFormValues(values)
      setState("idle")
    } catch {
      setState("network-error")
      setNetworkError(t("error_upstream"))
    }
  }, [courseQuery, t])

  const handleSubmit = useCallback(async () => {
    if (!formValues) return
    setState("submitting")
    setApiErrors({})
    setNetworkError(null)

    try {
      const body = formValuesToCourseUpdate(formValues)
      if (coverFile) body.img = await uploadCourseCover(courseId, coverFile)

      await update.mutateAsync({ courseId, data: body })
      setOpen(false)
      setState("idle")
      setFormValues(null)
      setCoverFile(null)
    } catch (err) {
      const actionError = getActionError(err)
      if (actionError?.type === "Validation") {
        setState("validation-error")
        if (actionError.fields) {
          const fieldMap: Record<string, string> = {}
          actionError.fields.forEach((field) => {
            const key = field.replace("body.", "")
            fieldMap[key] = actionError.message
          })
          setApiErrors(fieldMap)
        }
      } else if (actionError?.type === "Conflict") {
        setState("conflict")
        setNetworkError(actionError.message)
      } else {
        setState("network-error")
        setNetworkError(
          actionError?.type === "Upstream"
            ? t("error_upstream")
            : actionError?.message ?? t("error_upload")
        )
      }
    }
  }, [coverFile, courseId, formValues, t, update])

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (val) loadData()
        if (!val) {
          setState("idle")
          setApiErrors({})
          setNetworkError(null)
          setInitialValues(null)
          setFormValues(null)
          setCurrentImageUrl(null)
          setCoverFile(null)
        }
      }}
    >
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("edit_title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {state === "loading" ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : initialValues ? (
            <>
              <CourseForm
                initialValues={initialValues}
                subjects={subjects}
                grades={grades}
                streams={streams}
                mode="edit"
                onChange={setFormValues}
                errors={apiErrors}
                disabled={state === "submitting"}
              />

              <CourseCoverPicker
                currentImageUrl={currentImageUrl}
                file={coverFile}
                onChange={setCoverFile}
                disabled={state === "submitting"}
              />

              {state === "conflict" && (
                <p className="text-sm text-destructive">
                  {networkError ?? t("conflict")}
                </p>
              )}
              {state === "network-error" && (
                <p className="text-sm text-destructive">{networkError}</p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={state === "submitting"}
                >
                  {state === "submitting" ? t("saving") : t("save")}
                </Button>
              </div>
            </>
          ) : state === "network-error" ? (
            <p className="text-sm text-destructive">{networkError}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
