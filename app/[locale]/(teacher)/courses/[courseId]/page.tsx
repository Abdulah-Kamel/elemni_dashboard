import { setRequestLocale, getTranslations } from "next-intl/server";
import { verifySession } from "@/lib/auth/dal";
import { getCourse } from "@/features/course-management/queries";
import { listChapters } from "@/features/course-management/chapters-queries";
import { listLessons } from "@/features/course-management/lessons-queries";
import { ChapterList } from "@/features/course-management/components/chapter-list";
import { LessonList } from "@/features/course-management/components/lesson-list";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function CourseHeader({
  courseId,
  locale,
}: {
  courseId: number;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "courses" });

  let course: Awaited<ReturnType<typeof getCourse>> | null = null;
  try {
    course = await getCourse(courseId);
  } catch (err: unknown) {
    const apiErr = err as { type?: string };
    if (apiErr.type === "Unauthorized") {
      redirect(`/${locale}/sign-out?next=${encodeURIComponent(`/courses/${courseId}`)}`);
    }
    return (
      <div className="space-y-4">
        <Link
          href={`/${locale}/courses`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          {locale === "ar" ? (
            <ArrowRight className="me-2 size-4" />
          ) : (
            <ArrowLeft className="me-2 size-4" />
          )}
          {t("title")}
        </Link>
        <p className="text-sm text-destructive">{t("error_upstream")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/${locale}/courses`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        {locale === "ar" ? (
          <ArrowRight className="me-2 size-4" />
        ) : (
          <ArrowLeft className="me-2 size-4" />
        )}
        {t("title")}
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <Badge variant={course.is_published ? "default" : "secondary"}>
          {course.is_published ? t("published") : t("draft")}
        </Badge>
      </div>
    </div>
  );
}

async function ContentArea({
  courseId,
  locale,
}: {
  courseId: number;
  locale: string;
}) {
  const ct = await getTranslations({ locale, namespace: "chapters" });
  const lt = await getTranslations({ locale, namespace: "lessons" });

  let course: Awaited<ReturnType<typeof getCourse>> | null = null;
  try {
    course = await getCourse(courseId);
  } catch (err: unknown) {
    const apiErr = err as { type?: string };
    if (apiErr.type === "Unauthorized") {
      redirect(`/${locale}/sign-out?next=${encodeURIComponent(`/courses/${courseId}`)}`);
    }
    return <p className="text-sm text-destructive">{ct("error_upstream")}</p>;
  }

  const useChapters = course.use_chapters;

  if (useChapters) {
    let chapters: Awaited<ReturnType<typeof listChapters>> = [];
    let chaptersError: string | null = null;

    try {
      chapters = await listChapters(courseId);
    } catch (err: unknown) {
      const apiErr = err as { type?: string };
      if (apiErr.type === "Unauthorized") {
        redirect(`/${locale}/sign-out?next=${encodeURIComponent(`/courses/${courseId}`)}`);
      }
      chaptersError = ct("error_upstream");
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{ct("title")}</h2>
        </div>
        <ChapterList
          initialChapters={chapters}
          courseId={courseId}
          error={chaptersError}
        />
      </div>
    );
  }

  let lessons: Awaited<ReturnType<typeof listLessons>> = [];
  let error: string | null = null;
  try {
    lessons = await listLessons(courseId);
  } catch (err: unknown) {
    const apiErr = err as { type?: string };
    if (apiErr.type === "Unauthorized") {
      redirect(`/${locale}/sign-out?next=${encodeURIComponent(`/courses/${courseId}`)}`);
    }
    error = lt("error_upstream");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{lt("title")}</h2>
      </div>
      <LessonList
        initialLessons={lessons}
        courseId={courseId}
        error={error}
      />
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-5 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;
  const courseIdNum = Number(courseId);
  setRequestLocale(locale);
  const session = await verifySession();

  if (!session) {
    const path = `/${locale}/courses/${courseId}`;
    redirect(`/${locale}/sign-out?next=${encodeURIComponent(path)}`);
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <CourseHeader courseId={courseIdNum} locale={locale} />
      </Suspense>
      <Suspense fallback={<ContentSkeleton />}>
        <ContentArea courseId={courseIdNum} locale={locale} />
      </Suspense>
    </div>
  );
}
