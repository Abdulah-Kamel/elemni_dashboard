import { setRequestLocale } from "next-intl/server"
import { Placeholder } from "@/features/shell/components/placeholder"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"

export const dynamic = "force-dynamic"

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await verifySession()

  if (!user) {
    return redirectToAuth(locale, `/${locale}/billing`)
  }

  return (
    <Placeholder state="empty">
      <span className="text-sm text-muted-foreground">{user.name}</span>
    </Placeholder>
  )
}
