import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "sign_up" });

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <SignUpForm locale={locale} />
    </AuthShell>
  );
}
