import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CourseOut } from "@/features/shell/schema";
import { CourseCardActions } from "./course-card-actions";

function formatPrice(price: string, locale: string): string {
  const num = Number(price);
  if (isNaN(num)) return price;
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export async function CourseCard({
  course,
  teacherProfileId,
  locale,
}: {
  course: CourseOut;
  teacherProfileId: number;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "courses" });

  return (
    <Card
      className={course.is_published ? undefined : "opacity-75"}
    >
      <Link
        href={`/${locale}/courses/${course.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <h3 className="text-base font-semibold">{course.title}</h3>
          <Badge variant={course.is_published ? "default" : "secondary"}>
            {course.is_published ? t("published") : t("draft")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg font-medium text-amber-600">
            {course.price === "0.00" ? t("free") : formatPrice(course.price, locale)}
          </p>
          <div className="flex flex-wrap gap-2">
            {course.subject_name && (
              <Badge variant="outline">{course.subject_name}</Badge>
            )}
            <Badge variant="outline">{t("curriculum_placement")}</Badge>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="justify-end gap-2">
        <CourseCardActions courseId={course.id} isPublished={course.is_published} teacherProfileId={teacherProfileId} />
      </CardFooter>
    </Card>
  );
}
