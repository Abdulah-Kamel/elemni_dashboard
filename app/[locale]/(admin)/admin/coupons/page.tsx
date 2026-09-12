import { getTranslations, setRequestLocale } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { CouponsManager } from "@/features/coupons/components/coupons-manager"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "coupons" })
  return { title: t("title") }
}

export default async function AdminCouponsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await verifySession()
  if (!user) return redirectToAuth(locale, `/${locale}/admin/coupons`)

  return <CouponsManager />
}
