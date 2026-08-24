import { setRequestLocale } from "next-intl/server"
import { AdminOverviewView } from "@/features/admin/components/admin-overview"
import { Placeholder } from "@/features/shell/components/placeholder"
import { loadAdminPageData } from "@/features/admin/page-data"

export const dynamic = "force-dynamic"

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const result = await loadAdminPageData()

  if (result.kind === "error") {
    return <Placeholder state="error" error={result.error} />
  }

  return (
    <AdminOverviewView
      overview={result.overview}
      teachers={result.teachers}
      subscriptions={result.subscriptions}
    />
  )
}
