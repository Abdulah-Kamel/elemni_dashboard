import { setRequestLocale } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager"

export const dynamic = "force-dynamic"

export default async function SubjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await verifySession()
  if (!user) return redirectToAuth(locale, `/${locale}/admin/subjects`)

  return (
    <TaxonomyManager
      kind="subjects"
      titleKey="title_subjects"
      fields={[
        { key: "name", labelKey: "table_name", required: true },
        { key: "slug", labelKey: "table_slug", required: true },
      ]}
    />
  )
}
