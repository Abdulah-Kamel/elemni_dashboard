"use client";

import { useTranslations } from "next-intl";
import { LayoutGrid, BookOpen, GraduationCap, Cloud, Settings, Layers, GitBranch, Library } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const TEACHER_NAV = [
  { id: "overview", href: "/dashboard", icon: LayoutGrid },
  { id: "my_courses", href: "/courses", icon: BookOpen },
  { id: "students", href: "/students", icon: GraduationCap },
  { id: "storage", href: "/storage", icon: Cloud },
  { id: "settings", href: "/settings", icon: Settings },
] as const;

const ADMIN_NAV = [
  { id: "teachers", href: "/admin/teachers", icon: GraduationCap },
  { id: "grades", href: "/admin/grades", icon: Layers },
  { id: "streams", href: "/admin/streams", icon: GitBranch },
  { id: "subjects", href: "/admin/subjects", icon: Library },
] as const;

export function MobileBottomNav({ userRole }: { userRole?: string }) {
  const tNav = useTranslations("sidebar");
  const pathname = usePathname();
  const navItems = userRole === "ADMIN" ? ADMIN_NAV : TEACHER_NAV;

  return (
    <nav className="fixed bottom-0 start-0 z-50 flex w-full items-center justify-around border-t border-border bg-surface px-2 py-1 md:hidden shadow-lg">
      {navItems.map(({ id, href, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={id}
            href={href as never}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-on-surface-muted hover:text-foreground"
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span className="text-[10px] font-semibold">{tNav(id)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
