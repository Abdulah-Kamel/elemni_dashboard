"use client"

import { useId, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createGrant } from "../actions"
import { grantCreateSchema, type CourseVideo } from "../schema"

type Props = {
  studentId: number
  courses: { id: number; title: string }[]
  videos: Record<number, CourseVideo[]>
  onClose: () => void
  onGranted: () => void
}

export function GrantViewsDialog({
  studentId,
  courses,
  videos,
  onClose,
  onGranted,
}: Props) {
  const t = useTranslations("videoGrants")
  const locale = useLocale()
  const id = useId()
  const keyRef = useRef<string | null>(null)
  if (keyRef.current === null) keyRef.current = crypto.randomUUID()
  const submitting = useRef(false)
  const [courseId, setCourseId] = useState<number | null>(() =>
    courses.length === 1 ? courses[0].id : null
  )
  const [itemId, setItemId] = useState<number | null>(null)
  const [views, setViews] = useState("1")
  const [reason, setReason] = useState("")
  const [expiry, setExpiry] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const courseVideos = courseId === null ? [] : (videos[courseId] ?? [])
  const video = courseVideos.find((v) => v.item_id === itemId)
  const errorId = `${id}-error`

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting.current) return
    const count = Number(views)
    if (
      !views.trim() ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 1000
    ) {
      setError(t("invalidViews"))
      return
    }
    const [year, month, day] = expiry.split("-").map(Number)
    const date = expiry ? new Date(year, month - 1, day, 23, 59, 59, 999) : null
    if (date && !Number.isFinite(date.getTime())) {
      setError(t("errors.invalid"))
      return
    }
    const parsed = grantCreateSchema.safeParse({
      user_id: studentId,
      item_id: video?.item_id,
      granted_views: count,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
      ...(date ? { expires_at: date.toISOString() } : {}),
    })
    if (!parsed.success) {
      setError(t("errors.invalid"))
      return
    }
    submitting.current = true
    setPending(true)
    setError(null)
    try {
      const result = await createGrant(parsed.data, keyRef.current!)
      if (!result.success) {
        setError(t(`errors.${result.code}`))
        return
      }
      toast.success(t("granted"))
      onGranted()
    } catch {
      setError(t("errors.unknown"))
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value && !submitting.current) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <DialogTitle>{t("grant")}</DialogTitle>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submit}
          className="space-y-4"
          aria-describedby={error ? errorId : undefined}
        >
          <div className="space-y-2">
            <Label htmlFor={`${id}-course`}>{t("course")}</Label>
            <Select
              value={courseId}
              onValueChange={(value) => {
                setCourseId(value)
                setItemId(null)
              }}
              disabled={pending}
            >
              <SelectTrigger id={`${id}-course`} className="w-full">
                <SelectValue>
                  {courseId === null
                    ? t("course")
                    : courses.find((c) => c.id === courseId)?.title}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-video`}>{t("video")}</Label>
            <Select
              value={itemId}
              onValueChange={setItemId}
              disabled={pending || courseId === null || !courseVideos.length}
            >
              <SelectTrigger id={`${id}-video`} className="w-full">
                <SelectValue>
                  {video
                    ? `${video.title} — ${video.lesson_title}`
                    : t("video")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courseVideos.map((v) => (
                  <SelectItem key={v.item_id} value={v.item_id}>
                    {v.title} — {v.lesson_title} (
                    {v.max_watch_count === null
                      ? t("unlimited")
                      : t("limitN", { count: v.max_watch_count })}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {video?.max_watch_count === null && (
              <p className="text-xs text-muted-foreground">
                {t("noLimitNote")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-views`}>{t("views")}</Label>
            <Input
              id={`${id}-views`}
              type="number"
              min={1}
              max={1000}
              step={1}
              value={views}
              onChange={(e) => setViews(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-reason`}>{t("reason")}</Label>
            <Textarea
              id={`${id}-reason`}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={pending}
            />
            <p className="text-end text-xs text-muted-foreground tabular-nums">
              {reason.length} / 500
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-expiry`}>{t("expiry")}</Label>
            <Input
              id={`${id}-expiry`}
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              disabled={pending}
            />
          </div>
          {error && (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending || !video}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
