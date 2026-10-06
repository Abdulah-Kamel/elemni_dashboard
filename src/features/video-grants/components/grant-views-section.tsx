"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { StudentSubscriptionRow } from "@/features/students/components/student-table"
import { listCourseVideos, listStudentGrants } from "../actions"
import type { CourseVideo, Grant, GrantCreate } from "../schema"
import { GrantViewsDialog } from "./grant-views-dialog"
import { GrantList } from "./grant-list"

type Props = {
  studentId: number
  subscriptions: StudentSubscriptionRow[]
  now: number
}
type Loaded = { grants: Grant[]; videos: Record<number, CourseVideo[]> }

export function GrantViewsSection({ studentId, subscriptions, now }: Props) {
  const t = useTranslations("videoGrants")
  const courses = useMemo(
    () =>
      Array.from(
        new Map(
          subscriptions
            .filter(
              (s) => s.status === "completed" && Date.parse(s.expiresAt) > now
            )
            .map((s) => [s.courseId, { id: s.courseId, title: s.course }])
        ).values()
      ),
    [subscriptions, now]
  )
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)
  const [open, setOpen] = useState(false)
  const [pendingGrant, setPendingGrant] = useState<{
    payload: GrantCreate
    key: string
  } | null>(null)

  function getIdempotencyKey(payload: GrantCreate) {
    if (
      pendingGrant &&
      pendingGrant.payload.user_id === payload.user_id &&
      pendingGrant.payload.item_id === payload.item_id &&
      pendingGrant.payload.granted_views === payload.granted_views &&
      pendingGrant.payload.reason === payload.reason &&
      pendingGrant.payload.expires_at === payload.expires_at
    )
      return pendingGrant.key
    const key = crypto.randomUUID()
    setPendingGrant({ payload, key })
    return key
  }

  useEffect(() => {
    let current = true
    Promise.all([
      listStudentGrants(studentId),
      Promise.all(
        courses.map(async (course) => ({
          id: course.id,
          result: await listCourseVideos(course.id),
        }))
      ),
    ])
      .then(([grants, videos]) => {
        if (!current) return
        if (!grants.success || videos.some((v) => !v.result.success)) {
          setError(true)
          return
        }
        setLoaded({
          grants: grants.data,
          videos: Object.fromEntries(
            videos.map((v) => [v.id, v.result.success ? v.result.data : []])
          ),
        })
      })
      .catch(() => {
        if (current) setError(true)
      })
    return () => {
      current = false
    }
  }, [studentId, courses, revision])

  function refresh(keepLoaded = false) {
    if (!keepLoaded) setLoaded(null)
    setError(false)
    setRevision((value) => value + 1)
  }

  return (
    <section
      aria-labelledby="student-video-grants-title"
      aria-busy={!loaded && !error}
      className="border-t border-border p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="student-video-grants-title" className="text-sm font-semibold">
          {t("title")}
        </h3>
        <Button
          type="button"
          size="sm"
          disabled={!courses.length || !loaded || error}
          onClick={() => setOpen(true)}
          aria-describedby={
            !courses.length ? "video-grants-no-subscription" : undefined
          }
        >
          {t("grant")}
        </Button>
      </div>
      {!courses.length && (
        <p
          id="video-grants-no-subscription"
          className="mt-2 text-xs text-muted-foreground"
        >
          {t("noActiveSubscription")}
        </p>
      )}
      {error ? (
        <div role="alert" className="mt-3 space-y-2">
          <p>{t("loadError")}</p>
          <Button type="button" variant="outline" onClick={() => refresh()}>
            {t("retry")}
          </Button>
        </div>
      ) : loaded ? (
        <GrantList
          studentId={studentId}
          grants={loaded.grants}
          videos={Object.values(loaded.videos).flat()}
          now={now}
          onRefresh={refresh}
        />
      ) : (
        <div className="mt-3 space-y-2" aria-hidden="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
      {open && loaded && (
        <GrantViewsDialog
          studentId={studentId}
          courses={courses}
          videos={loaded.videos}
          onClose={() => setOpen(false)}
          getIdempotencyKey={getIdempotencyKey}
          onUnknownError={() => refresh(true)}
          onGranted={() => {
            setPendingGrant(null)
            setOpen(false)
            refresh()
          }}
        />
      )}
    </section>
  )
}
