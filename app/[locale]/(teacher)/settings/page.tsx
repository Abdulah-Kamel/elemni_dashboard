import { setRequestLocale } from "next-intl/server";
import { verifySession } from "@/lib/auth/dal";
import { Placeholder } from "@/features/shell/components/placeholder";
import { SettingsDashboard } from "@/features/settings/components/settings-dashboard";
import type { ApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await verifySession();

  if (!user) {
    return (
      <Placeholder
        state="error"
        error={{ type: "Unauthorized", status: 401, message: "No session" } satisfies ApiError}
      />
    );
  }

  return <SettingsDashboard />;
}
