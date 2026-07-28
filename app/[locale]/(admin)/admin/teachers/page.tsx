import { setRequestLocale } from "next-intl/server";
import { verifySession } from "@/lib/auth/dal";
import { listTeachers } from "@/features/admin/queries";
import { TeachersList } from "@/features/admin/components/teachers-list";
import { TaxonomyManager } from "@/features/admin/components/taxonomy-manager";
import type { AdminTeacherListItem } from "@/features/admin/schema";

export const dynamic = "force-dynamic";

export default async function TeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await verifySession();
  if (!user) return null;

  let publicTeachers;
  try {
    publicTeachers = await listTeachers();
  } catch (err) {
    return null;
  }

  const teachers: AdminTeacherListItem[] = publicTeachers.map((tchr, i) => ({
    id: i + 1,
    name: tchr.name,
    email: "",
    phone: null,
    subjects: tchr.subjects ?? [],
    grades: tchr.grades ?? [],
    call_status: null,
    interest_level: null,
    status: null,
  }));

  return (
    <div className="space-y-10">
      <TeachersList teachers={teachers} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaxonomyManager
          kind="subjects"
          titleKey="title_subjects"
          fields={[
            { key: "name", labelKey: "table_name", required: true },
            { key: "slug", labelKey: "table_slug" },
          ]}
        />
        <TaxonomyManager
          kind="grades"
          titleKey="title_grades"
          fields={[
            { key: "name", labelKey: "table_name", required: true },
            { key: "level", labelKey: "table_level" },
          ]}
        />
      </div>
    </div>
  );
}
