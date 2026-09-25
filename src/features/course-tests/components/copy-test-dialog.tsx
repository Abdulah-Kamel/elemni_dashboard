"use client"

import { useEffect, useId, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { callClient, notifyCourseTestsChanged } from "../hooks"
import { displayStatus } from "../ui-utils"
import type { CourseTestRow } from "../types"
import { builderPath } from "./new-test-options"

export type CourseOption = { id: number; title: string }

export function CopyTestDialog({ courseId, courses, open, onOpenChange }: { courseId: number; courses: CourseOption[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("courseTests.copy")
  const tStatus = useTranslations("courseTests.status")
  const tActions = useTranslations("courseTests.row_actions")
  const router = useRouter()
  const id = useId()
  const [sourceCourse, setSourceCourse] = useState(String(courseId))
  const [tests, setTests] = useState<CourseTestRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [working, setWorking] = useState(false)

  // Always offer the current course, even if the course list failed to load.
  const courseItems = [
    ...(courses.some((course) => course.id === courseId) ? [] : [{ id: courseId, title: "" }]),
    ...courses,
  ].map((course) => ({ value: String(course.id), label: course.id === courseId ? t("this_course", { title: course.title }).trim() : course.title }))

  useEffect(() => {
    if (!open) return
    let cancelled = false
    callClient((client) => client.listTests(Number(sourceCourse))).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setError(null)
        setTests(result.data)
      } else setError(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [open, sourceCourse])

  async function submit() {
    if (selected === null) return
    setWorking(true)
    const result = await callClient((client) => client.duplicateTest(selected, courseId))
    setWorking(false)
    if (!result.ok) return void toast.error(result.error)
    notifyCourseTestsChanged()
    onOpenChange(false)
    router.push(builderPath(courseId, result.data.id) as never)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (working) return
        onOpenChange(next)
        if (!next) {
          setSelected(null)
          setTests(null)
          setSourceCourse(String(courseId))
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label id={`${id}-course`}>{t("course_label")}</Label>
          <Select
            value={sourceCourse}
            items={courseItems}
            onValueChange={(value) => {
              if (!value) return
              setSourceCourse(value)
              setSelected(null)
              setTests(null)
            }}
          >
            <SelectTrigger className="h-11 w-full" aria-labelledby={`${id}-course`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {courseItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex min-h-32 flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t("test_label")}</legend>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : tests === null ? (
            <div className="space-y-2" aria-busy="true">
              <span className="sr-only">{t("loading")}</span>
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : tests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-on-surface-muted">{t("empty")}</p>
          ) : (
            <div className="flex max-h-[40dvh] animate-fade-in flex-col gap-2 overflow-y-auto pe-1">
              {tests.map((test) => (
                <label
                  key={test.id}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors duration-150",
                    selected === test.id ? "border-primary bg-primary-tint/60" : "border-border hover:bg-surface-muted",
                  )}
                >
                  <input type="radio" name={`${id}-test`} checked={selected === test.id} onChange={() => setSelected(test.id)} className="size-5 shrink-0 accent-primary" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{test.title}</span>
                    <span className="text-xs text-on-surface-muted tabular-nums">{t("summary", { questions: test.question_count, status: tStatus(displayStatus(test)) })}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <DialogFooter>
          <Button variant="outline" className="h-11 px-4" disabled={working} onClick={() => onOpenChange(false)}>
            {tActions("cancel")}
          </Button>
          <Button className="h-11 gap-2 px-5" disabled={selected === null || working} aria-busy={working} onClick={() => void submit()}>
            {working && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {working ? t("working") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
