import { setRequestLocale, getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { getCourse } from "@/features/course-management/queries"
import {
  getPublicTeacherProfile,
  getTeacherProfile,
} from "@/features/profile/queries"
import { listChapters } from "@/features/course-management/chapters-queries"
import { listLessons } from "@/features/course-management/lessons-queries"
import { ChapterList } from "@/features/course-management/components/chapter-list"
import { LessonList } from "@/features/course-management/components/lesson-list"
import { CourseCardActions } from "@/features/course-management/components/course-card-actions"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import type { LessonOut } from "@/features/course-management/lessons-schema"
import { CourseWorkspace } from "@/features/student-preview/course-workspace"
import { buildCoursePreviewModel } from "@/features/student-preview/build-course-preview-model"
import type { CourseFormValues } from "@/features/course-management/schema"
import { loadCoursePreviewCurriculum } from "@/features/student-preview/server-actions"

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
  try {
    course = await getCourse(courseId)
  } catch (error: unknown) {
    const apiError = error as { type?: string }
    if (apiError.type === "Unauthorized") {
      redirect(
        `/${locale}/sign-out?next=${encodeURIComponent(`/courses/${courseId}`)}`
      )
    }

    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{t("error_upstream")}</p>
      </div>
    )
  }

  const [teacherProfile, previewCurriculum] = await Promise.all([
    getTeacherProfile().catch(() => null),
    loadCoursePreviewCurriculum(courseId),
  ])
  const subjects = teacherProfile?.subjects ?? []
  const grades = teacherProfile?.grades ?? []
  const streams = teacherProfile?.streams ?? []
  let teacherPreview: { name: string; avatarUrl: string | null } | null = null
  if (teacherProfile) {
    const publicProfile = await getPublicTeacherProfile(
      teacherProfile.slug
    ).catch(() => null)
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
    let chapters: Awaited<ReturnType<typeof listChapters>> = []
    let chaptersError: string | null = null

    try {
      chapters = await listChapters(courseId)
    } catch (error: unknown) {
      const apiError = error as { type?: string }
      if (apiError.type === "Unauthorized") {
        redirect(
          `/${locale}/sign-out?next=${encodeURIComponent(`/courses/${courseId}`)}`
        )
      }
      chaptersError = ct("error_upstream")
    }

    const lessonResults = await Promise.allSettled(
      chapters.map((chapter) => listLessons(courseId, chapter.id))
    )
    const lessonsByChapter: Record<number, LessonOut[]> = {}
    const lessonErrorsByChapter: Record<number, string | null> = {}
    lessonResults.forEach((result, index) => {
      const chapterId = chapters[index]?.id
      if (chapterId == null) return
      if (result.status === "fulfilled") {
        lessonsByChapter[chapterId] = result.value
      } else {
        lessonsByChapter[chapterId] = []
        lessonErrorsByChapter[chapterId] = lt("error_upstream")
      }
    })

    curriculum = (
      <ChapterList
        initialChapters={chapters}
        initialLessonsByChapter={lessonsByChapter}
        lessonErrorsByChapter={lessonErrorsByChapter}
        courseId={courseId}
        error={chaptersError}
      />
    )
  } else {
    let lessons: LessonOut[] = []
    let lessonsError: string | null = null
    try {
      lessons = await listLessons(courseId)
    } catch (error: unknown) {
      const apiError = error as { type?: string }
      if (apiError.type === "Unauthorized") {
        redirect(
          `/${locale}/sign-out?next=${encodeURIComponent(`/courses/${courseId}`)}`
        )
      }
      lessonsError = lt("error_upstream")
    }

    curriculum = (
      <LessonList
        initialLessons={lessons}
        courseId={courseId}
        error={lessonsError}
      />
    )
  }

  const editorActions = (
    <div
      dir="ltr"
      className="flex items-center justify-between gap-3"
    >
      <Link
        href={`/${locale}/courses`}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {locale === "ar" ? (
          <ArrowRight className="size-4" aria-hidden="true" />
        ) : (
          <ArrowLeft className="size-4" aria-hidden="true" />
        )}
        {t("title")}
      </Link>

      <div
        className="flex shrink-0 items-center gap-2"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <CourseCardActions
          courseId={course.id}
          isPublished={course.is_published}
          teacherProfileId={course.teacher_profile_id}
          showEdit={false}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <section className="animate-slide-up animate-stagger-2 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        <CourseWorkspace
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
            sections: previewCurriculum.success ? previewCurriculum.data : [],
            locale,
          })}
          locale={locale}
          teacherProfileId={course.teacher_profile_id}
          editorActions={editorActions}
          initialSections={
            previewCurriculum.success ? previewCurriculum.data : []
          }
          curriculum={curriculum}
          curriculumTitle={course.use_chapters ? ct("title") : lt("title")}
          curriculumHint={t("curriculum_hint")}
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
  const courseIdNum = Number(courseId)
  setRequestLocale(locale)

  const session = await verifySession()
  if (!session) {
    const path = `/${locale}/courses/${courseId}`
    redirect(`/${locale}/sign-out?next=${encodeURIComponent(path)}`)
  }

  return (
    <Suspense fallback={<EditorSkeleton />}>
      <CourseEditor courseId={courseIdNum} locale={locale} />
    </Suspense>
  )
}
