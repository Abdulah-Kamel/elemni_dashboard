import { setRequestLocale } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { SettingsDashboard } from "@/features/settings/components/settings-dashboard"

export const dynamic = "force-dynamic"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await verifySession()

  if (!user) {
    return redirectToAuth(locale, `/${locale}/settings`)
  }

  return <SettingsDashboard />
}
