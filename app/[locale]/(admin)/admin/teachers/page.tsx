import { setRequestLocale } from "next-intl/server";
import { verifySession } from "@/lib/auth/dal";
import { TeachersList } from "@/features/admin/components/teachers-list";
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager";

export const dynamic = "force-dynamic";

export default async function TeachersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await verifySession();
  if (!user) return null;

  return (
    <div className="space-y-10">
      <TeachersList />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaxonomyManager kind="subjects" titleKey="title_subjects" fields={[{ key: "name", labelKey: "table_name", required: true }, { key: "slug", labelKey: "table_slug" }]} />
        <TaxonomyManager kind="grades" titleKey="title_grades" fields={[{ key: "name", labelKey: "table_name", required: true }, { key: "level", labelKey: "table_level" }]} />
      </div>
    </div>
  );
}
