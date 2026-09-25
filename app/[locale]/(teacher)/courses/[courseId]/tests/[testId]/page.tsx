import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCourseTest } from "@/features/course-tests/actions";
import { TestBuilder } from "@/features/course-tests/components/test-builder";

export const dynamic = "force-dynamic";

export default async function TestBuilderPage({ params }: { params: Promise<{ locale: string; courseId: string; testId: string }> }) {
  const { locale, courseId: courseRaw, testId: testRaw } = await params;
  setRequestLocale(locale);
  const courseId = Number(courseRaw);
  const testId = Number(testRaw);
  if (![courseId, testId].every((value) => Number.isInteger(value) && value > 0)) notFound();
  const test = await getCourseTest(testId);
  if (test.course_id !== courseId) notFound();
  return <TestBuilder initialTest={test} />;
}
