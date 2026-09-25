import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { Link } from "@/i18n/routing"
import { getCourse, listCourses } from "@/features/course-management/queries"
import { fetchCourseTestsOverview } from "@/features/course-tests/queries"
import { CourseTabs } from "@/features/course-tests/components/course-tabs"
import { CourseTestsOverview } from "@/features/course-tests/components/course-tests-page"
import { DemoBadge } from "@/features/course-tests/components/demo-badge"
import { NewTestButton } from "@/features/course-tests/components/new-test-options"

export const dynamic = "force-dynamic"

export default async function CourseTestsPage({ params }: { params: Promise<{ locale: string; courseId: string }> }) {
  const { locale, courseId: rawId } = await params
  setRequestLocale(locale)
  const courseId = Number(rawId)
  if (!Number.isInteger(courseId) || courseId < 1) notFound()

  const user = await verifySession()
  if (!user) return redirectToAuth(locale, `/${locale}/courses/${courseId}/tests`)

  const t = await getTranslations({ locale, namespace: "courseTests" })
  const [course, courses, overview] = await Promise.all([
    getCourse(courseId).catch((error: unknown) => {
      if ((error as { type?: string })?.type === "NotFound") notFound()
      return null
    }),
    listCourses(user.id).catch(() => []),
    fetchCourseTestsOverview(courseId),
  ])
  const courseTitle = course?.title ?? courses.find((item) => item.id === courseId)?.title ?? ""

  return (
    <div className="flex flex-col gap-5.5">
      <header className="flex animate-fade-in flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <nav aria-label={t("page.breadcrumb")}>
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-on-surface-muted">
              <li>
                <Link href="/courses" className="rounded-sm hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {t("page.my_courses")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/courses/${courseId}` as never} className="rounded-sm hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {courseTitle || t("title")}
                </Link>
              </li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[1.75rem] leading-tight font-bold">{courseTitle || t("title")}</h1>
            <DemoBadge />
          </div>
        </div>
        <NewTestButton courseId={courseId} />
      </header>

      <CourseTabs courseId={courseId} active="tests" />

      <CourseTestsOverview courseId={courseId} courses={courses.map((item) => ({ id: item.id, title: item.title }))} initial={overview ?? undefined} />
    </div>
  )
}
