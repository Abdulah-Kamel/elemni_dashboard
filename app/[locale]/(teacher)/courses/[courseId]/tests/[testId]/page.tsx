import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { TestBuilderDemoPage } from "@/features/course-tests/components/test-builder-demo-page";

export default async function TestBuilderPage({ params }: { params: Promise<{ locale: string; courseId: string; testId: string }> }) {
  const { locale, courseId: courseRaw, testId: testRaw } = await params;
  setRequestLocale(locale);
  const courseId = Number(courseRaw);
  const testId = Number(testRaw);
  if (![courseId, testId].every((value) => Number.isInteger(value) && value > 0)) notFound();
  return <TestBuilderDemoPage courseId={courseId} testId={testId} />;
}
