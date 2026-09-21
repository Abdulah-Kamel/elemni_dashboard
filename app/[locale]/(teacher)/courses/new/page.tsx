import { setRequestLocale, getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { getTeacherProfile } from "@/features/profile/queries"
import { redirectToAuth } from "@/lib/auth/redirect"
import { CreateCourseWorkspace } from "@/features/course-management/components/create-course-workspace"

export const dynamic = "force-dynamic"

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "courses" })
  const session = await verifySession()
  if (!session) {
    return redirectToAuth(locale, `/${locale}/courses/new`)
  }

  let profile: Awaited<ReturnType<typeof getTeacherProfile>> | null = null
  try {
    profile = await getTeacherProfile()
  } catch (error: unknown) {
    const apiError = error as { type?: string }
    if (apiError.type === "Unauthorized") {
      return redirectToAuth(locale, `/${locale}/courses/new`)
    }
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{t("curriculum_unavailable")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CreateCourseWorkspace
        locale={locale}
        teacherProfileId={session.id ?? 0}
        teacherName={profile?.name ?? ""}
        subjects={profile?.subjects ?? []}
        grades={profile?.grades ?? []}
        streams={profile?.streams ?? []}
      />
    </div>
  )
}
