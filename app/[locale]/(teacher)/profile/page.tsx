import { setRequestLocale } from "next-intl/server";
import { Placeholder } from "@/features/shell/components/placeholder";
import { verifySession } from "@/lib/auth/dal";
import { getTeacherProfile } from "@/features/profile/queries";
import { TeacherProfilePage } from "@/features/profile/components/teacher-profile-page";
import type { ApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
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

  let profile;
  try {
    profile = await getTeacherProfile();
  } catch (err) {
    const errorType = (err as Error)?.name?.replace("ApiError:", "") ?? "Upstream";
    return (
      <Placeholder
        state="error"
        error={{ type: errorType, status: 0, message: (err as Error)?.message ?? "Error" } as never}
      />
    );
  }

  return <TeacherProfilePage profile={profile} />;
}
