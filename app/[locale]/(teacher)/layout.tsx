import { redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { DirectionProvider } from "@base-ui/react/direction-provider"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { Sidebar } from "@/features/shell/components/sidebar"
import { Topbar } from "@/features/shell/components/topbar"
import { MobileBottomNav } from "@/features/shell/components/mobile-bottom-nav"
import { ChapterNavigationProvider } from "@/features/course-management/chapter-navigation-context"
import { fetchPendingGradingCount } from "@/features/course-tests/queries"

export const dynamic = "force-dynamic"

export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await verifySession()

  if (!user) {
    const path = `/${locale}/dashboard`
    return redirectToAuth(locale, path)
  }

  if (user.role === "ADMIN") {
    redirect(`/${locale}/admin`)
  }

  // STUDENT and ASSISTANT are bounced to /sign-out with a reason.
  if (user.role !== "TEACHER") {
    redirect(`/${locale}/sign-out?reason=role`)
  }

  const [t, pendingGradingCount] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    // null in demo mode or when the API is unavailable: the sidebar then shows no badge
    // (demo mode reads the local demo client in the browser instead).
    fetchPendingGradingCount(),
  ])
  const teacherRole = t("teacher_role")

  return (
    <DirectionProvider direction={(locale === "ar" ? "rtl" : "ltr") as never}>
      <div className="flex h-dvh overflow-hidden bg-page">
        <Sidebar teacherName={user.name} teacherRole={teacherRole} pendingGradingCount={pendingGradingCount} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar teacherName={user.name} />
          <main className="flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            <ChapterNavigationProvider>
              <div className="teacher-content-shell mx-auto w-full max-w-7xl animate-fade-in px-container-margin py-xl">
                {children}
              </div>
            </ChapterNavigationProvider>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </DirectionProvider>
  )
}
