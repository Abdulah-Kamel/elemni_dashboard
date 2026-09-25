import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { TestBuilder, type BuilderStep } from "@/features/course-tests/components/test-builder"

const STEPS: BuilderStep[] = ["questions", "settings", "review"]

export default async function TestBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; courseId: string; testId: string }>
  searchParams: Promise<{ step?: string | string[] }>
}) {
  const [{ locale, courseId: courseRaw, testId: testRaw }, { step }] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  const courseId = Number(courseRaw)
  const testId = Number(testRaw)
  if (![courseId, testId].every((value) => Number.isInteger(value) && value > 0)) notFound()
  const initialStep = STEPS.find((item) => item === step) ?? "questions"
  return <TestBuilder courseId={courseId} testId={testId} initialStep={initialStep} />
}
