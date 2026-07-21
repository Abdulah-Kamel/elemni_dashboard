import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import {Placeholder} from "@/features/shell/components/placeholder";
import {verifySession} from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await verifySession();

  if (!user) {
    return <Placeholder state="error" error={{ type: "Unauthorized", status: 401, message: "No session" }} />;
  }

  return (
    <Placeholder state="empty">
      <span className="text-sm text-muted-foreground">{user.name}</span>
    </Placeholder>
  );
}