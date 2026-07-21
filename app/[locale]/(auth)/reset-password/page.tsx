import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "reset_password" });

  if (!token) {
    return (
      <AuthShell title={t("title")}>
        <p className="text-body-md text-body-md--line-height text-error">
          {t("invalid_token")}
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <ResetPasswordForm locale={locale} token={token} />
    </AuthShell>
  );
}
