import { getTranslations } from "next-intl/server"
import { OverviewSkeleton } from "@/features/dashboard/components/overview-skeleton"

export default async function DashboardLoading() {
  const t = await getTranslations("teacherHome")
  return <OverviewSkeleton label={t("loading")} />
}
