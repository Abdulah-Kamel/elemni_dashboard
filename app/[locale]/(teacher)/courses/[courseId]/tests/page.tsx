import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CourseTestsDemoPage } from "@/features/course-tests/components/course-tests-demo-page";

export default async function CourseTestsPage({ params }: { params: Promise<{ locale: string; courseId: string }> }) {
  const { locale, courseId: rawId } = await params;
  setRequestLocale(locale);
  const courseId = Number(rawId);
  if (!Number.isInteger(courseId) || courseId < 1) notFound();
  return <CourseTestsDemoPage courseId={courseId} locale={locale} />;
}
