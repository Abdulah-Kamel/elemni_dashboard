import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        <Card key={i} className="p-4">
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="mb-4 h-4 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </Card>
      ))}
    </div>
  );
}
