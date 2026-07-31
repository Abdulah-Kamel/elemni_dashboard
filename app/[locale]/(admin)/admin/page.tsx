import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/admin/teachers`);
}
