import { setRequestLocale, getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import {
  listCourses,
} from "@/features/course-management/queries"
import { getTeacherProfile } from "@/features/profile/queries"
import {
  CourseList,
  CourseListSkeleton,
} from "@/features/course-management/components/course-list"
import { CreateCourseDialog } from "@/features/course-management/components/create-course-dialog"
import type { CourseOut } from "@/features/shell/schema"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

async function CourseListContent({
  locale,
  teacherProfileId,
}: {
  locale: string
  teacherProfileId: number
}) {
  const t = await getTranslations({ locale, namespace: "courses" })

  let courses: Array<CourseOut> = []
  let error: string | null = null
  let gradeNames: Record<number, string> = {}
  let streamNames: Record<number, string> = {}

  try {
    const [coursesResult, profileResult] = await Promise.allSettled([
      listCourses(teacherProfileId),
      getTeacherProfile(),
    ])
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
    />
  )
}

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "courses" })
  const session = await verifySession()
  const teacherProfileId = session?.id ?? 0

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-on-surface-muted">{t("subtitle")}</p>
        </div>
        <CreateCourseDialog teacherProfileId={teacherProfileId} />
      </div>
      <Suspense fallback={<CourseListSkeleton />}>
        <CourseListContent
          locale={locale}
          teacherProfileId={teacherProfileId}
        />
      </Suspense>
    </div>
  )
}
