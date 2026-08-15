import { setRequestLocale } from "next-intl/server"
import { AdminOverviewView } from "@/features/admin/components/admin-overview"
import { getAdminOverview, listAdminSubscriptions, listAdminTeachers } from "@/features/admin/queries"

export const dynamic = "force-dynamic"

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const [overview, teachers, subscriptions] = await Promise.all([
    getAdminOverview(),
    listAdminTeachers({ limit: 5 }),
    listAdminSubscriptions({ limit: 5, paymentStatus: "completed" }),
  ])
  return <AdminOverviewView overview={overview} teachers={teachers} subscriptions={subscriptions} />
}
