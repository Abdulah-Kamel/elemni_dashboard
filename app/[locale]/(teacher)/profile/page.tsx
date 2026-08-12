import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { listCourses } from "@/features/course-management/queries";
import { TeacherProfilePreview } from "@/features/profile/components/teacher-profile-preview";
import {
  getPublicTeacherProfile,
  getTeacherProfile,
} from "@/features/profile/queries";
import { Placeholder } from "@/features/shell/components/placeholder";
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
    redirect(`/${locale}/sign-out?next=${encodeURIComponent(`/${locale}/profile`)}`);
  }

  const [profileResult, coursesResult] = await Promise.allSettled([
    getTeacherProfile(),
    listCourses(user.id),
  ]);

  const t = await getTranslations({ locale, namespace: "profile" });

  if (profileResult.status === "rejected" || coursesResult.status === "rejected") {
    let reason: unknown;
    if (profileResult.status === "rejected") {
      reason = profileResult.reason;
    } else if (coursesResult.status === "rejected") {
      reason = coursesResult.reason;
    }
    const error = reason as Error & { type?: ApiError["type"]; status?: number };
    return (
      <Placeholder
        state="error"
        error={{
          type: error.type ?? "Upstream",
          status: error.status ?? 0,
          message: error.message || t("error_upstream"),
        } as ApiError}
      />
    );
  }

  // The private endpoint deliberately returns the stored image key. The
  // public endpoint resolves that key through the configured CDN, matching
  // what students will actually receive.
  const publicProfileResult = await Promise.allSettled([
    getPublicTeacherProfile(profileResult.value.slug),
  ]);
  const publicImageCandidate =
    publicProfileResult[0].status === "fulfilled"
      ? publicProfileResult[0].value.img
      : null;
  const publicImageUrl =
    publicImageCandidate?.startsWith("http://") || publicImageCandidate?.startsWith("https://")
      ? publicImageCandidate
      : null;

  return (
    <TeacherProfilePreview
      profile={profileResult.value}
      courses={coursesResult.value.filter((course) => course.is_published)}
      publicImageUrl={publicImageUrl}
      locale={locale}
    />
  );
}
