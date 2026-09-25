import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { TestPreview } from "@/features/course-tests/components/test-preview"

export default async function CourseTestPreviewPage({ params }: { params: Promise<{ locale: string; courseId: string; testId: string }> }) {
  const { locale, courseId: courseRaw, testId: testRaw } = await params
  setRequestLocale(locale)
  const courseId = Number(courseRaw)
  const testId = Number(testRaw)
  if (![courseId, testId].every((value) => Number.isInteger(value) && value > 0)) notFound()
  return <TestPreview courseId={courseId} testId={testId} />
}
