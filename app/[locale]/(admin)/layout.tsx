import { redirect } from "next/navigation"
import { setRequestLocale, getTranslations } from "next-intl/server"
import { DirectionProvider } from "@base-ui/react/direction-provider"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { Sidebar } from "@/features/shell/components/sidebar"
import { Topbar } from "@/features/shell/components/topbar"
import { MobileBottomNav } from "@/features/shell/components/mobile-bottom-nav"
import { CommandPaletteProvider } from "@/features/command-palette/command-palette"

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
    return redirectToAuth(locale, path)
  }

  if (user.role === "TEACHER") {
    redirect(`/${locale}/dashboard`)
  }

  if (user.role !== "ADMIN") {
    redirect(`/${locale}/sign-out?reason=role`)
  }

  const t = await getTranslations({ locale, namespace: "common" })
  const roleLabel = t("admin_role")

  return (
    <DirectionProvider direction={(locale === "ar" ? "rtl" : "ltr") as never}>
      <CommandPaletteProvider role="admin">
        <div className="flex h-dvh overflow-hidden bg-page">
          <Sidebar
            teacherName={user.name}
            teacherRole={roleLabel}
            userRole={user.role}
          />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Topbar userName={user.name} roleLabel={roleLabel} role="admin" />
            <main className="flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
              <div className="mx-auto w-full max-w-7xl animate-fade-in px-container-margin py-xl">
                {children}
              </div>
            </main>
          </div>
          <MobileBottomNav userRole={user.role} />
        </div>
      </CommandPaletteProvider>
    </DirectionProvider>
  )
}
