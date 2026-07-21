import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { validateNextParam } from "@/features/shell/components/sign-in-redirect";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; registered?: string; reset?: string; reason?: string }>;
}) {
  const { locale } = await params;
  const { next: nextRaw, registered, reset, reason } = await searchParams;
  setRequestLocale(locale);

  const next = validateNextParam(nextRaw, locale);
  const t = await getTranslations({ locale, namespace: "sign_in" });

  const notice = reason === "role" ? "role" : registered ? "registered" : reset ? "reset" : undefined;

  return (
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <p className="text-label-sm text-label-sm--line-height text-on-surface-muted">
          <Link
            href={"/sign-up" as never}
            className="font-semibold text-primary hover:underline"
          >
            {t("no_account")}
          </Link>
        </p>
      }
    >
      <SignInForm locale={locale} next={next} notice={notice} />
    </AuthShell>
  );
}
