import { setRequestLocale, getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { listCourses } from "@/features/course-management/queries"
import { getTeacherProfile } from "@/features/profile/queries"
import {
  CourseList,
  CourseListSkeleton,
} from "@/features/course-management/components/course-list"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { CourseOut } from "@/features/shell/schema"
import { Suspense } from "react"
import { redirectToAuth } from "@/lib/auth/redirect"
import { listTeacherSubscriptions } from "@/features/students/queries"
import { listTopEarningCourses } from "@/features/analytics/queries"
import {
  deriveCourseCounts,
  earningsByCourse,
  parseCourseQuery,
  serializeCourseQuery,
  type CourseMetrics,
  type CourseQueryState,
} from "@/features/course-management/components/course-overview/course-overview-model"

export const dynamic = "force-dynamic"

async function CourseListContent({
  locale,
  teacherProfileId,
  initialQuery,
}: {
  locale: string
  teacherProfileId: number
  initialQuery: CourseQueryState
}) {
  const t = await getTranslations({ locale, namespace: "courses" })

  let courses: Array<CourseOut> = []
  let error: string | null = null
  let gradeNames: Record<number, string> = {}
  let streamNames: Record<number, string> = {}
  const metrics: CourseMetrics = { counts: null, earnings: null }

  try {
    // Per-course numbers are best-effort: the list still renders if they fail.
    // Top-courses caps at 100 rows (API max); courses beyond that show "—".
    const [coursesResult, profileResult, subscriptionsResult, topCoursesResult] =
      await Promise.allSettled([
        listCourses(teacherProfileId),
        getTeacherProfile(),
        listTeacherSubscriptions(),
        listTopEarningCourses({ limit: 100 }),
      ])
    if (subscriptionsResult.status === "fulfilled") {
      metrics.counts = deriveCourseCounts(subscriptionsResult.value)
    }
    if (topCoursesResult.status === "fulfilled") {
      metrics.earnings = earningsByCourse(topCoursesResult.value)
    }
    if (coursesResult.status === "rejected") throw coursesResult.reason
    courses = coursesResult.value

    if (profileResult.status === "fulfilled") {
      gradeNames = Object.fromEntries(
        profileResult.value.grades.map((grade) => [grade.id, grade.name])
      )
      streamNames = Object.fromEntries(
        profileResult.value.streams.map((stream) => [stream.id, stream.name])
      )
    }
  } catch (err: unknown) {
    const apiErr = err as { type?: string; message?: string }
    if (apiErr.type === "Unauthorized") {
      return redirectToAuth(locale, `/${locale}/courses`)
    }
    const errorKey: Record<string, string> = {
      Unauthorized: "error_unauthorized",
      Forbidden: "error_forbidden",
      NotFound: "error_not_found",
      Validation: "error_validation",
      RateLimited: "error_rate_limited",
      Conflict: "error_conflict",
      Upstream: "error_upstream",
    }
    const key = errorKey[apiErr.type ?? ""] ?? "error_upstream"
    error = t(key)
  }

  return (
    <CourseList
      courses={courses}
      teacherProfileId={teacherProfileId}
      error={error}
      isEmpty={!error && courses.length === 0}
      locale={locale}
      gradeNames={gradeNames}
      streamNames={streamNames}
      metrics={metrics}
      initialQuery={initialQuery}
    />
  )
}

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const initialQuery = parseCourseQuery(await searchParams)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "courses" })
  const session = await verifySession()
  if (!session) {
    return redirectToAuth(locale, `/${locale}/courses`)
  }
  const teacherProfileId = session?.id ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-on-surface-muted">{t("subtitle")}</p>
        </div>
        <Button
          id="create-course-trigger"
          nativeButton={false}
          render={
            <Link href="/courses/new">
              <Plus data-icon="inline-start" />
              {t("create")}
            </Link>
          }
        />
      </div>
      <Suspense fallback={<CourseListSkeleton />}>
        <CourseListContent
          key={serializeCourseQuery(initialQuery)}
          locale={locale}
          teacherProfileId={teacherProfileId}
          initialQuery={initialQuery}
        />
      </Suspense>
    </div>
  )
}
