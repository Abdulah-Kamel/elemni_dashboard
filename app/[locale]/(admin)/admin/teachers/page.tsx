import { setRequestLocale } from "next-intl/server";
import { verifySession } from "@/lib/auth/dal";
import { TeachersList } from "@/features/admin/components/teachers-list";

export const dynamic = "force-dynamic";

export default async function TeachersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await verifySession();
  if (!user) return null;

  return <TeachersList />;
}
