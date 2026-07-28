"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useTranslations } from "next-intl";
import {
  LayoutGrid,
  BookOpen,
  GraduationCap,
  Cloud,
  Settings,
  User,
  Layers,
  GitBranch,
  Library,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/features/shell/components/logout-button";

const PRIMARY_NAV = [
  { id: "overview", href: "/dashboard", icon: LayoutGrid },
  { id: "my_courses", href: "/courses", icon: BookOpen },
  { id: "students", href: "/students", icon: GraduationCap },
  { id: "profile", href: "/profile", icon: User },
  { id: "storage", href: "/storage", icon: Cloud },
  { id: "settings", href: "/settings", icon: Settings },
] as const;

const ADMIN_NAV = [
  { id: "teachers", href: "/admin/teachers", icon: GraduationCap },
  { id: "grades", href: "/admin/grades", icon: Layers },
  { id: "streams", href: "/admin/streams", icon: GitBranch },
  { id: "subjects", href: "/admin/subjects", icon: Library },
] as const;

type SidebarProps = {
  teacherName?: string;
  teacherRole?: string;
  userRole?: string;
};

export function Sidebar({ teacherName, teacherRole, userRole }: SidebarProps) {
  const tNav = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const [navRef] = useAutoAnimate({ duration: 200 });
  const navItems = userRole === "ADMIN" ? ADMIN_NAV : PRIMARY_NAV;

  return (
    <aside
      className="hidden h-full w-sidebar shrink-0 flex-col border-e border-border bg-surface md:flex"
      aria-label={tCommon("sidebar_label")}
    >
      <div className="flex items-center gap-2.5 px-lg py-md">
        <div
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary"
        >
          <GraduationCap className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-title-md text-title-md--line-height font-semibold text-primary">
            {tCommon("brand")}
          </p>
          <p className="truncate text-label-sm text-label-sm--line-height text-on-surface-muted">
            {tCommon("brand_subtitle")}
          </p>
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-sm py-sm"
        aria-label={tCommon("nav_label")}
      >
        <ul ref={navRef} className="flex flex-col gap-0.5">
          {navItems.map(({ id, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={id}>
                <Link
                  href={href as never}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-sm py-2 text-body-md text-body-md--line-height font-medium transition-colors",
                    isActive
                      ? "bg-primary-tint text-primary border-s-4 border-primary font-semibold"
                      : "text-on-surface-muted hover:bg-surface-strong hover:text-foreground",
                  )}
                >
                  <Icon
                    className="size-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{tNav(id)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-1 px-sm pb-sm">
        <LogoutButton
          variant="sidebar"
          showIcon
          className="w-full justify-start rounded-lg px-sm py-2 text-body-md text-body-md--line-height"
        />

        {teacherName && (
          <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Avatar className="size-8 shrink-0 bg-primary-tint text-primary">
              <AvatarFallback className="text-label-sm font-semibold">
                {initials(teacherName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-md text-body-md--line-height font-medium text-foreground">
                {teacherName}
              </p>
              {teacherRole && (
                <p className="truncate text-label-sm text-label-sm--line-height text-on-surface-muted">
                  {teacherRole}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
