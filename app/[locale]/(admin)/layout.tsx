import { redirect } from "next/navigation"
import { setRequestLocale, getTranslations } from "next-intl/server"
import { DirectionProvider } from "@base-ui/react/direction-provider"
import { verifySession } from "@/lib/auth/dal"
import { Sidebar } from "@/features/shell/components/sidebar"
import { Topbar } from "@/features/shell/components/topbar"
import { MobileBottomNav } from "@/features/shell/components/mobile-bottom-nav"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
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
    const path = `/${locale}/admin`
    redirect(`/${locale}/sign-out?next=${encodeURIComponent(path)}`)
  }

  if (user.role === "TEACHER") {
    redirect(`/${locale}/dashboard`)
  }

  if (user.role !== "ADMIN") {
    redirect(`/${locale}/sign-out?reason=role`)
  }

  const t = await getTranslations({ locale, namespace: "common" })

  return (
    <DirectionProvider direction={(locale === "ar" ? "rtl" : "ltr") as never}>
      <div className="flex h-screen overflow-hidden bg-page">
        <Sidebar
          teacherName={user.name}
          teacherRole={t("admin_role")}
          userRole={user.role}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar teacherName={user.name} userRole={user.role} />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-7xl animate-fade-in px-container-margin py-xl">
              {children}
            </div>
          </main>
        </div>
        <MobileBottomNav userRole={user.role} />
      </div>
    </DirectionProvider>
  )
}
