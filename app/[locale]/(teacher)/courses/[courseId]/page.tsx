import { setRequestLocale, getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import {
  getCourse,
  listSubjects,
  listGrades,
  listStreams,
} from "@/features/course-management/queries"
import {
  getPublicTeacherProfile,
  getTeacherProfile,
} from "@/features/profile/queries"
import { listChapters } from "@/features/course-management/chapters-queries"
import { listLessons } from "@/features/course-management/lessons-queries"
import { ChapterList } from "@/features/course-management/components/chapter-list"
import { LessonList } from "@/features/course-management/components/lesson-list"
import { EditCourseDialog } from "@/features/course-management/components/edit-course-dialog"
import { CourseCardActions } from "@/features/course-management/components/course-card-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen, Layers3, Pencil } from "lucide-react"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import type { LessonOut } from "@/features/course-management/lessons-schema"
import { CourseWorkspace } from "@/features/student-preview/course-workspace"
import { buildCoursePreviewModel } from "@/features/student-preview/build-course-preview-model"
import type { CourseFormValues } from "@/features/course-management/schema"
import { loadCoursePreviewCurriculum } from "@/features/student-preview/server-actions"

export const dynamic = "force-dynamic"

function formatPrice(price: string, locale: string) {
  const value = Number(price)
  if (Number.isNaN(value)) return price
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value)
}

async function getTeacherPreviewIdentity() {
  const profile = await getTeacherProfile()
  const publicProfile = await getPublicTeacherProfile(profile.slug).catch(
    () => null
  )
  const publicAvatarUrl = publicProfile?.img
  return {
    name: profile.name,
    avatarUrl:
      publicAvatarUrl?.startsWith("https://") ||
      publicAvatarUrl?.startsWith("http://")
        ? publicAvatarUrl
        : null,
  }
}

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

  const [subjects, grades, streams, teacherPreview, previewCurriculum] =
    await Promise.all([
      listSubjects().catch(() => []),
      listGrades().catch(() => []),
      listStreams().catch(() => []),
      getTeacherPreviewIdentity().catch(() => null),
      loadCoursePreviewCurriculum(courseId),
    ])

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

  return (
    <div className="space-y-6">
      <header className="space-y-5">
        <Link
          href={`/${locale}/courses`}
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {locale === "ar" ? (
            <ArrowRight className="me-2 size-4" />
          ) : (
            <ArrowLeft className="me-2 size-4" />
          )}
          {t("title")}
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {course.title}
              </h1>
              <Badge
                variant={course.is_published ? "default" : "secondary"}
                className={
                  course.is_published
                    ? "bg-success-tint text-success"
                    : undefined
                }
              >
                {course.is_published ? t("published") : t("draft")}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {course.subject_name && <span>{course.subject_name}</span>}
              <span className="inline-flex items-center gap-1.5">
                <Layers3 className="size-3.5" />
                {course.use_chapters
                  ? t("chapters_organized")
                  : t("flat_lessons")}
              </span>
              <span>
                {course.price === "0.00"
                  ? t("free")
                  : formatPrice(course.price, locale)}
              </span>
            </div>
            {course.description && (
              <p className="w-full text-sm leading-6 text-muted-foreground">
                {course.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <EditCourseDialog
              courseId={course.id}
              teacherProfileId={course.teacher_profile_id}
            >
              <Button variant="outline">
                <Pencil className="me-2 size-4" />
                {t("course_settings")}
              </Button>
            </EditCourseDialog>
            <CourseCardActions
              courseId={course.id}
              isPublished={course.is_published}
              teacherProfileId={course.teacher_profile_id}
            />
          </div>
        </div>

        <nav
          className="flex border-b border-border"
          aria-label={t("course_navigation")}
        >
          <span className="inline-flex items-center gap-2 border-b-2 border-primary px-1 pb-3 text-sm font-semibold text-primary">
            <BookOpen className="size-4" />
            {t("content_tab")}
          </span>
        </nav>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
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
          })}
          locale={locale}
          viewer="guest"
          initialSections={
            previewCurriculum.success ? previewCurriculum.data : []
          }
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">
              {course.use_chapters ? ct("title") : lt("title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("curriculum_hint")}
            </p>
          </div>
        </div>
        {curriculum}
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
