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
  getCourseAction,
  updateCourse,
  listSubjectsAction,
  listGradesAction,
  listStreamsAction,
} from "@/features/course-management/actions"
import { formValuesToCourseUpdate } from "@/features/course-management/schema"
import { uploadCourseCover } from "@/features/course-management/upload-course-cover"
import type {
  SubjectOut,
  GradeOut,
  StreamOut,
} from "@/features/course-management/schema"
import type { CourseFormValues } from "@/features/course-management/schema"

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
      const [course, subs, grds, strms] = await Promise.all([
        getCourseAction(courseId),
        listSubjectsAction(),
        listGradesAction(),
        listStreamsAction(),
      ])
      setSubjects(subs)
      setGrades(grds)
      setStreams(strms)
      setCurrentImageUrl(course.img ?? null)
      const values: CourseFormValues = {
        title: course.title,
        description: course.description,
        price: String(course.price),
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
  }, [courseId, t])

  const handleSubmit = useCallback(async () => {
    if (!formValues) return
    setState("submitting")
    setApiErrors({})
    setNetworkError(null)

    const body = formValuesToCourseUpdate(formValues)
    try {
      if (coverFile) body.img = await uploadCourseCover(courseId, coverFile)
    } catch {
      setState("network-error")
      setNetworkError(t("error_upload"))
      return
    }
    const result = await updateCourse(courseId, teacherProfileId, body)

    if (result.success) {
      setOpen(false)
      setState("idle")
      setFormValues(null)
      setCoverFile(null)
    } else {
      const err = result.error
      if (err.type === "Validation") {
        setState("validation-error")
        if (err.fields) {
          const fieldMap: Record<string, string> = {}
          err.fields.forEach((f) => {
            const key = f.replace("body.", "")
            fieldMap[key] = err.message
          })
          setApiErrors(fieldMap)
        }
      } else if (err.type === "Conflict") {
        setState("conflict")
        setNetworkError(err.message)
      } else {
        setState("network-error")
        setNetworkError(err.message)
      }
    }
  }, [coverFile, courseId, formValues, t, teacherProfileId])

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
