import { setRequestLocale } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager"
import { listSubjects } from "@/features/course-management/queries"

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
  const initialData = await listSubjects()

  return (
    <TaxonomyManager
      kind="subjects"
      initialData={initialData}
      titleKey="title_subjects"
      fields={[
        { key: "name", labelKey: "table_name", required: true },
        { key: "slug", labelKey: "table_slug", required: true },
      ]}
    />
  )
}
