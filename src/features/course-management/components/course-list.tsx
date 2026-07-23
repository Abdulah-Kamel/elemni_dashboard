import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CourseCard } from "./course-card";
import { EmptyState } from "./empty-state";
import type { CourseOut } from "@/features/shell/schema";

export async function CourseList({
  courses,
  teacherProfileId,
  error,
  isEmpty,
  locale,
}: {
  courses: CourseOut[];
  teacherProfileId: number;
  error: string | null;
  isEmpty: boolean;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "courses" });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm">
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return <EmptyState locale={locale} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} teacherProfileId={teacherProfileId} locale={locale} />
      ))}
    </div>
  );
}

export function CourseListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-border">
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
