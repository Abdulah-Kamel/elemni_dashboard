import { setRequestLocale, getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { getCourse } from "@/features/course-management/queries"
import {
  getPublicTeacherProfile,
  getTeacherProfile,
} from "@/features/profile/queries"
import { listChapters } from "@/features/course-management/chapters-queries"
import { listLessons } from "@/features/course-management/lessons-queries"
import { listItems } from "@/features/course-management/items-queries"
import { ChapterList } from "@/features/course-management/components/chapter-list"
import { LessonList } from "@/features/course-management/components/lesson-list"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Suspense } from "react"
import { redirectToAuth } from "@/lib/auth/redirect"
import type { LessonOut } from "@/features/course-management/lessons-schema"
import { CourseWorkspaceLoader } from "@/features/student-preview/course-workspace-loader"
import { buildCoursePreviewModel } from "@/features/student-preview/build-course-preview-model"
import type { CourseFormValues } from "@/features/course-management/schema"
import { notFound } from "next/navigation"
import { isApiNotFound, parsePositiveRouteId } from "@/lib/routes"

export const dynamic = "force-dynamic"

async function CourseEditor({
  courseId,
  locale,
}: {
  courseId: number
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: "courses" })
  const ct = await getTranslations({ locale, namespace: "chapters" })
  const lt = await getTranslations({ locale, namespace: "lessons" })

  let course: Awaited<ReturnType<typeof getCourse>>
  let teacherProfile: Awaited<ReturnType<typeof getTeacherProfile>> | null
  let chapters: Awaited<ReturnType<typeof listChapters>>
  let allLessons: LessonOut[]
  let chapterLoadError: unknown = null
  try {
    const [loadedCourse, loadedTeacherProfile, chapterResult, loadedLessons] = await Promise.all([
      getCourse(courseId),
      getTeacherProfile().catch(() => null),
      listChapters(courseId).then(
        (data) => ({ data, error: null }),
        (error: unknown) => ({ data: [], error })
      ),
      listLessons(courseId),
    ])
    course = loadedCourse
    teacherProfile = loadedTeacherProfile
    chapters = chapterResult.data
    chapterLoadError = chapterResult.error
    allLessons = loadedLessons
  } catch (error: unknown) {
    const apiError = error as { type?: string }
    if (isApiNotFound(error)) notFound()
    if (apiError.type === "Unauthorized") {
      return redirectToAuth(locale, `/${locale}/courses/${courseId}`)
    }

    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{t("error_upstream")}</p>
      </div>
    )
  }
  if ((chapterLoadError as { type?: string } | null)?.type === "Unauthorized") {
    return redirectToAuth(locale, `/${locale}/courses/${courseId}`)
  }

  const [lessonItems, publicProfile] = await Promise.all([
    Promise.all(
      allLessons.map((lesson) => listItems(courseId, lesson.id).catch(() => []))
    ),
    teacherProfile
      ? getPublicTeacherProfile(teacherProfile.slug).catch(() => null)
      : Promise.resolve(null),
  ])
  const itemsByLesson = new Map(allLessons.map((lesson, i) => [lesson.id, lessonItems[i]]))
  const groupedLessons = new Map<number | null, LessonOut[]>()
  for (const lesson of allLessons) {
    const key = lesson.chapter_id ?? null
    groupedLessons.set(key, [...(groupedLessons.get(key) ?? []), lesson])
  }
  const previewSections = [
    ...chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      lessons: (groupedLessons.get(chapter.id) ?? []).map((lesson) => ({
        id: lesson.id, title: lesson.title, description: lesson.description,
        durationMinutes: null,
        items: (itemsByLesson.get(lesson.id) ?? []).map((item) => ({
          id: item.id, title: item.title, hasVideo: !!item.bunny_stream_id,
          hasDocument: !!item.document_path, hasExam: !!item.exam_id,
        })),
      })),
    })),
    ...(groupedLessons.has(null) ? [{
      id: "ungrouped" as const, title: null,
      lessons: (groupedLessons.get(null) ?? []).map((lesson) => ({
        id: lesson.id, title: lesson.title, description: lesson.description,
        durationMinutes: null,
        items: (itemsByLesson.get(lesson.id) ?? []).map((item) => ({
          id: item.id, title: item.title, hasVideo: !!item.bunny_stream_id,
          hasDocument: !!item.document_path, hasExam: !!item.exam_id,
        })),
      })),
    }] : []),
  ]
  const subjects = teacherProfile?.subjects ?? []
  const grades = teacherProfile?.grades ?? []
  const streams = teacherProfile?.streams ?? []
  let teacherPreview: { name: string; avatarUrl: string | null } | null = null
  if (teacherProfile) {
    const publicAvatarUrl = publicProfile?.img
    teacherPreview = {
      name: teacherProfile.name,
      avatarUrl:
        publicAvatarUrl?.startsWith("https://") ||
        publicAvatarUrl?.startsWith("http://")
          ? publicAvatarUrl
          : null,
    }
  }

  let curriculum: React.ReactNode
  if (course.use_chapters) {
    const initialChapters = chapters
    const chaptersError = chapterLoadError ? ct("error_upstream") : null

    const lessonsByChapter: Record<number, LessonOut[]> = {}
    for (const chapter of initialChapters) {
      lessonsByChapter[chapter.id] = groupedLessons.get(chapter.id) ?? []
    }

    curriculum = (
      <ChapterList
        initialChapters={initialChapters}
        initialLessonsByChapter={lessonsByChapter}
        lessonErrorsByChapter={{}}
        courseId={courseId}
        error={chaptersError}
      />
    )
  } else {
    curriculum = (
      <LessonList
        initialLessons={allLessons}
        courseId={courseId}
        error={null}
      />
    )
  }

  const editorActions = (
    <div dir="ltr" className="flex items-center gap-3">
      <Link
        href={`/${locale}/courses`}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {locale === "ar" ? (
          <ArrowRight className="size-4" aria-hidden="true" />
        ) : (
          <ArrowLeft className="size-4" aria-hidden="true" />
        )}
        {t("title")}
      </Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <section className="animate-slide-up rounded-2xl border border-border bg-card p-4 shadow-xs animate-stagger-2 sm:p-6">
        <CourseWorkspaceLoader
          model={buildCoursePreviewModel({
            courseId: course.id,
            values: {
              title: course.title,
              description: course.description,
              price: course.price,
              subjectId: course.subject_id ?? 0,
              gradeId: course.grade_id,
              streamId: course.stream_id,
              useChapters: course.use_chapters,
            } satisfies CourseFormValues,
            coverObjectUrl: null,
            publicCoverUrl: course.img ?? null,
            teacher: teacherPreview,
            subjects,
            grades,
            streams,
            sections: previewSections,
            locale,
          })}
          locale={locale}
          teacherProfileId={course.teacher_profile_id}
          isPublished={course.is_published}
          isArchived={course.is_archived}
          editorActions={editorActions}
          initialSections={previewSections}
          subjects={subjects}
          grades={grades}
          streams={streams}
          curriculum={curriculum}
          curriculumTitle={course.use_chapters ? ct("title") : lt("title")}
          curriculumHint={t("curriculum_hint")}
          useChapters={course.use_chapters}
        />
      </section>
    </div>
  )
}

function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-5 w-28" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-2/5" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="space-y-3 rounded-2xl border p-6">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  )
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>
}) {
  const { locale, courseId } = await params
  const courseIdNum = parsePositiveRouteId(courseId)
  if (courseIdNum === null) notFound()
  setRequestLocale(locale)

  const session = await verifySession()
  if (!session) {
    const path = `/${locale}/courses/${courseId}`
    return redirectToAuth(locale, path)
  }

  return (
    <Suspense fallback={<EditorSkeleton />}>
      <CourseEditor courseId={courseIdNum} locale={locale} />
    </Suspense>
  )
}
