import { setRequestLocale } from "next-intl/server"
import { fetchGradingQueue } from "@/features/course-tests/queries"
import { GradingWorkspace } from "@/features/course-tests/components/grading-page"

export const dynamic = "force-dynamic"

export default async function GradingPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ testId?: string; status?: string }>
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { testId: rawTestId, status } = await searchParams
  const parsed = Number(rawTestId)
  const testId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  const initial = await fetchGradingQueue(testId)

  return (
    <GradingWorkspace
      key={testId ?? "all"}
      testId={testId}
      initialFilter={status === "graded" ? "graded" : "pending"}
      initial={initial ?? undefined}
    />
  )
}
