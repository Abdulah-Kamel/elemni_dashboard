import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "forgot_password" });

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <ForgotPasswordForm locale={locale} />
    </AuthShell>
  );
}
