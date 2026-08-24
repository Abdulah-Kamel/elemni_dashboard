import { getTranslations } from "next-intl/server"
import { TeacherAnalyticsView } from "@/features/analytics/components/teacher-analytics-view"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"

type OverviewProps = {
  teacherFirstName: string
  summary: TeacherAnalytics
  topCourses: TopEarningCourse[]
  filters: {
    start?: string
    end?: string
  }
}

export async function Overview({
  teacherFirstName,
  summary,
  topCourses,
  filters,
}: OverviewProps) {
  const t = await getTranslations("overview")

  return (
    <TeacherAnalyticsView
      summary={summary}
      topCourses={topCourses}
      filters={filters}
      title={t("title")}
      subtitle={t("subtitle", { name: teacherFirstName })}
      basePath="/dashboard"
      currency="EGP"
    />
  )
}
