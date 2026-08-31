import { setRequestLocale } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager"

export const dynamic = "force-dynamic"

export default async function StreamsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await verifySession()
  if (!user) return redirectToAuth(locale, `/${locale}/admin/streams`)

  return (
    <TaxonomyManager
      kind="streams"
      titleKey="title_streams"
      fields={[
        { key: "name", labelKey: "table_name", required: true },
        { key: "slug", labelKey: "table_slug", required: true },
      ]}
    />
  )
}
