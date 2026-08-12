import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { verifySession } from "@/lib/auth/dal";
import { Sidebar } from "@/features/shell/components/sidebar";
import { Topbar } from "@/features/shell/components/topbar";
import { MobileBottomNav } from "@/features/shell/components/mobile-bottom-nav";
import { ChapterNavigationProvider } from "@/features/course-management/chapter-navigation-context";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await verifySession();

  if (!user) {
    const path = `/${locale}/dashboard`;
    redirect(`/${locale}/sign-out?next=${encodeURIComponent(path)}`);
  }

  // Only TEACHER and ADMIN may access this dashboard. STUDENT and ASSISTANT
  // are bounced to /sign-out (which clears the session) with a reason.
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    redirect(`/${locale}/sign-out?reason=role`);
  }

  const t = await getTranslations({ locale, namespace: "common" });
  const teacherRole = user.role === "ADMIN" ? t("admin_role") : t("teacher_role");

  return (
    <DirectionProvider direction={(locale === "ar" ? "rtl" : "ltr") as never}>
      <div className="flex h-screen overflow-hidden bg-page">
        <Sidebar teacherName={user.name} teacherRole={teacherRole} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar teacherName={user.name} />
          <main className="flex-1 overflow-auto">
            <ChapterNavigationProvider>
              <div className="mx-auto w-full max-w-7xl px-container-margin py-xl animate-fade-in">
                {children}
              </div>
            </ChapterNavigationProvider>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </DirectionProvider>
  );
}
