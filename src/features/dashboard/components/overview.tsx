import { getTranslations } from "next-intl/server"
import { TeacherAnalyticsView } from "@/features/analytics/components/teacher-analytics-view"
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema"
import type { TeacherSubscription } from "@/features/students/schema"

type OverviewProps = {
  teacherFirstName: string
  summary: TeacherAnalytics
  topCourses: TopEarningCourse[]
  recentSubscriptions: TeacherSubscription[] | null
  filters: {
    start?: string
    end?: string
  }
}

export async function Overview({
  teacherFirstName,
  summary,
  topCourses,
  recentSubscriptions,
  filters,
}: OverviewProps) {
  const t = await getTranslations("overview")

  return (
    <TeacherAnalyticsView
      summary={summary}
      topCourses={topCourses}
      recentSubscriptions={recentSubscriptions}
      filters={filters}
      title={t("title")}
      subtitle={t("subtitle", { name: teacherFirstName })}
      basePath="/dashboard"
      currency="EGP"
    />
  )
}
