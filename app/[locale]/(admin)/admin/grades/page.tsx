import { setRequestLocale } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager"

export const dynamic = "force-dynamic"

export default async function GradesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await verifySession()
  if (!user) return redirectToAuth(locale, `/${locale}/admin/grades`)

  return (
    <TaxonomyManager
      kind="grades"
      titleKey="title_grades"
      fields={[
        { key: "name", labelKey: "table_name", required: true },
        { key: "level", labelKey: "table_level", required: true },
      ]}
    />
  )
}
