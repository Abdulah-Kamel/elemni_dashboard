import { setRequestLocale, getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { getCourse } from "@/features/course-management/queries"
import { listChapters } from "@/features/course-management/chapters-queries"
import { listLessons } from "@/features/course-management/lessons-queries"
import { EditorToolbar } from "@/features/course-management/components/editor-toolbar"
import { LessonList } from "@/features/course-management/components/lesson-list"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"
import { redirectToAuth } from "@/lib/auth/redirect"

export const dynamic = "force-dynamic"

async function ChapterPageContent({
  courseId,
  chapterId,
  locale,
}: {
  courseId: number
  chapterId: number
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: "chapters" })
  const lt = await getTranslations({ locale, namespace: "lessons" })

  let course: Awaited<ReturnType<typeof getCourse>> | null = null
  try {
    course = await getCourse(courseId)
  } catch (err: unknown) {
    const apiErr = err as { type?: string }
    if (apiErr.type === "Unauthorized") {
      return redirectToAuth(
        locale,
        `/${locale}/courses/${courseId}/chapters/${chapterId}`
      )
    }
    return <p className="text-sm text-destructive">{t("error_upstream")}</p>
  }

  let chapters: Awaited<ReturnType<typeof listChapters>> = []
  try {
    chapters = await listChapters(courseId)
  } catch (err: unknown) {
    const apiErr = err as { type?: string }
    if (apiErr.type === "Unauthorized") {
      return redirectToAuth(
        locale,
        `/${locale}/courses/${courseId}/chapters/${chapterId}`
      )
    }
    return <p className="text-sm text-destructive">{t("error_upstream")}</p>
  }

  const chapter = chapters.find((ch) => ch.id === chapterId)
  if (!chapter) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{t("not_found")}</p>
      </div>
    )
  }

  let lessons: Awaited<ReturnType<typeof listLessons>> = []
  let lessonsError: string | null = null
  try {
    lessons = await listLessons(courseId, chapterId)
  } catch (err: unknown) {
    const apiErr = err as { type?: string }
    if (apiErr.type === "Unauthorized") {
      return redirectToAuth(
        locale,
        `/${locale}/courses/${courseId}/chapters/${chapterId}`
      )
    }
    lessonsError = lt("error_upstream")
  }

  return (
    <div className="space-y-6">
      <EditorToolbar
        courseId={courseId}
        courseTitle={course.title}
        chapterTitle={chapter.title}
        locale={locale}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{chapter.title}</h1>
          <Badge variant="outline" className="text-xs">
            {lt("count", { count: lessons.length })}
          </Badge>
        </div>
      </div>

      <LessonList
        initialLessons={lessons}
        courseId={courseId}
        chapterId={chapterId}
        error={lessonsError}
      />
    </div>
  )
}

function ChapterPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-1/3" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <Skeleton className="h-5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string; chapterId: string }>
}) {
  const { locale, courseId, chapterId } = await params
  const courseIdNum = Number(courseId)
  const chapterIdNum = Number(chapterId)
  setRequestLocale(locale)

  const session = await verifySession()
  if (!session) {
    const path = `/${locale}/courses/${courseId}/chapters/${chapterId}`
    return redirectToAuth(locale, path)
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<ChapterPageSkeleton />}>
        <ChapterPageContent
          courseId={courseIdNum}
          chapterId={chapterIdNum}
          locale={locale}
        />
      </Suspense>
    </div>
  )
}
