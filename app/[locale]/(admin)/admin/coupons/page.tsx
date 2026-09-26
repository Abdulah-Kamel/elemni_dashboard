import { Suspense } from "react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { CouponsPage } from "@/features/coupons/components/coupons-page"
import { TableSkeleton } from "@/features/admin/components/list-controls"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "adminCoupons" })
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

  return (
    <Suspense fallback={<TableSkeleton />}>
      <CouponsPage />
    </Suspense>
  )
}
