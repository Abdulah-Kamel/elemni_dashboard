"use client"

import { useSyncExternalStore } from "react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { useTranslations } from "next-intl"
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
  ReceiptText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogoutButton } from "@/features/shell/components/logout-button"

const PRIMARY_NAV = [
  { id: "overview", href: "/dashboard", icon: LayoutGrid },
  { id: "my_courses", href: "/courses", icon: BookOpen },
  { id: "students", href: "/students", icon: GraduationCap },
  { id: "profile", href: "/profile", icon: User },
  { id: "storage", href: "/storage", icon: Cloud },
  { id: "settings", href: "/settings", icon: Settings },
] as const

const ADMIN_NAV = [
  { id: "overview", href: "/admin", icon: LayoutGrid },
  { id: "teachers", href: "/admin/teachers", icon: GraduationCap },
  { id: "students", href: "/admin/students", icon: User },
  { id: "subscriptions", href: "/admin/subscriptions", icon: ReceiptText },
  { id: "grades", href: "/admin/grades", icon: Layers },
  { id: "streams", href: "/admin/streams", icon: GitBranch },
  { id: "subjects", href: "/admin/subjects", icon: Library },
] as const

type SidebarProps = {
  teacherName?: string
  teacherRole?: string
  userRole?: string
}

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed"
const SIDEBAR_CHANGE_EVENT = "elemni:sidebar-collapse-change"

function readCollapsedPreference(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

function subscribeToCollapsedPreference(onChange: () => void): () => void {
  window.addEventListener("storage", onChange)
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onChange)
  }
}

export function Sidebar({ teacherName, teacherRole, userRole }: SidebarProps) {
  const tNav = useTranslations("sidebar")
  const tCommon = useTranslations("common")
  const pathname = usePathname()
  const [navRef] = useAutoAnimate({ duration: 200 })
  const navItems = userRole === "ADMIN" ? ADMIN_NAV : PRIMARY_NAV

  const collapsed = useSyncExternalStore(
    subscribeToCollapsedPreference,
    readCollapsedPreference,
    () => false
  )

  const toggleCollapsed = () => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!collapsed))
    } finally {
      window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT))
    }
  }

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col overflow-hidden border-e border-border bg-surface transition-[width] duration-200 motion-reduce:transition-none md:flex",
        collapsed ? "w-17" : "w-sidebar-width"
      )}
      aria-label={tCommon("sidebar_label")}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col items-center gap-2 px-lg py-md",
          collapsed && "px-sm"
        )}
      >
        <div className="flex w-full min-w-0 items-center justify-center gap-2.5">
          <div
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary"
          >
            <GraduationCap className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-title-md text-title-md--line-height font-semibold text-primary">
                {tCommon("brand")}
              </p>
              <p className="truncate text-label-sm text-label-sm--line-height text-on-surface-muted">
                {tCommon("brand_subtitle")}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? tCommon("expand") : tCommon("collapse")}
          aria-expanded={!collapsed}
          title={collapsed ? tCommon("expand") : tCommon("collapse")}
          className="flex size-11 items-center justify-center rounded-lg text-on-surface-muted transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-sm py-sm"
        aria-label={tCommon("nav_label")}
      >
        <ul ref={navRef} className="flex flex-col gap-0.5">
          {navItems.map(({ id, href, icon: Icon }) => {
            const isActive =
              href === "/admin"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={id}>
                <Link
                  href={href as never}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? tNav(id) : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-sm py-2 text-body-md text-body-md--line-height font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "border-s-4 border-primary bg-primary-tint font-semibold text-primary"
                      : "text-on-surface-muted hover:bg-surface-strong hover:text-foreground"
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{tNav(id)}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-col gap-1 overflow-hidden px-sm pb-sm">
        <LogoutButton
          variant="sidebar"
          showIcon
          collapsed={collapsed}
          className={cn(
            "w-full justify-start rounded-lg px-sm py-2 text-body-md text-body-md--line-height",
            collapsed && "justify-center px-0"
          )}
        />

        {teacherName && (
          <div
            className={cn(
              "mt-2 flex min-w-0 items-center gap-2.5 overflow-hidden rounded-lg px-2 py-2",
              collapsed && "justify-center px-0"
            )}
          >
            <Avatar className="size-8 shrink-0 bg-primary-tint text-primary">
              <AvatarFallback className="text-label-sm font-semibold">
                {initials(teacherName)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-body-md text-body-md--line-height font-medium text-foreground"
                  title={teacherName}
                >
                  {teacherName}
                </p>
                {teacherRole && (
                  <p className="truncate text-label-sm text-label-sm--line-height text-on-surface-muted">
                    {teacherRole}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}
