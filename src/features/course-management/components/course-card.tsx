import { getTranslations } from "next-intl/server";
import Link from "next/link";
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
    <div
      className={`rounded-2xl border border-border bg-surface shadow-xs overflow-hidden transition-shadow hover:shadow-md ${course.is_published ? "" : "opacity-75"}`}
    >
      <div className="h-40 bg-surface-muted relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-4xl text-on-surface-subtle">
          📚
        </div>
        <div
          className={`absolute top-3 end-3 text-white px-3 py-1 rounded-xl text-[11px] font-bold shadow-xs ${
            course.is_published ? "bg-emerald-600" : "bg-on-surface-muted"
          }`}
        >
          {course.is_published ? t("published") : t("draft")}
        </div>
      </div>
      <Link
        href={`/${locale}/courses/${course.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-sm text-primary truncate">{course.title}</h3>
          <div className="flex items-center justify-between text-on-surface-muted text-xs">
            <span className="font-bold text-primary text-sm">
              {course.price === "0.00" ? t("free") : formatPrice(course.price, locale)}
            </span>
          </div>
          {course.subject_name && (
            <span className="inline-block px-2 py-0.5 bg-surface-muted rounded-full text-[11px] font-semibold text-on-surface-muted">
              {course.subject_name}
            </span>
          )}
        </div>
      </Link>
      <div className="px-4 pb-4 pt-2 border-t border-border flex gap-2">
        <CourseCardActions courseId={course.id} isPublished={course.is_published} teacherProfileId={teacherProfileId} />
      </div>
    </div>
  );
}
