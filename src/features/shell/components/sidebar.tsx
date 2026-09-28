"use client"

import Image from "next/image"
import { useSyncExternalStore } from "react"
import { useTranslations } from "next-intl"
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import logoIcon from "@/src/assets/logo-icon.png"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { groupedNav, isNavActive, roleFromUserRole } from "@/features/shell/nav-config"
import { useSignOut } from "@/features/shell/components/use-sign-out"
import { initials } from "@/features/shell/components/initials"

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

const rowBase =
  "relative flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-body-lg transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"

export function Sidebar({ teacherName, teacherRole, userRole }: SidebarProps) {
  const tNav = useTranslations("sidebar")
  const tCommon = useTranslations("common")
  const tTop = useTranslations("topbar")
  const tShell = useTranslations("dashboardShell")
  const pathname = usePathname()
  const role = roleFromUserRole(userRole)
  const groups = groupedNav(role)
  const { signOut, pending, error } = useSignOut()

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

  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose

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
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <Image
          src={logoIcon}
          alt={collapsed ? tCommon("brand") : ""}
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-lg bg-white object-contain p-1 ring-1 ring-border"
          priority
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-title-md font-semibold leading-tight text-primary">
              {tCommon("brand")}
            </p>
            <p className="truncate text-label-md text-on-surface-muted">
              {role === "admin"
                ? tShell("brand_subtitle_admin")
                : tShell("brand_subtitle_teacher")}
            </p>
          </div>
        )}
      </div>

      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3"
        aria-label={tCommon("nav_label")}
      >
        {groups.map(({ group, items }, groupIndex) => (
          <div key={group} className={cn(groupIndex > 0 && "mt-4")}>
            {groupIndex > 0 &&
              (collapsed ? (
                <div aria-hidden="true" className="mx-auto mb-3 h-px w-6 bg-border" />
              ) : (
                <p className="mb-1 px-2.5 text-label-sm font-semibold uppercase tracking-wide text-on-surface-subtle">
                  {tShell(`groups.${group}` as never)}
                </p>
              ))}
            <ul className="flex flex-col gap-0.5">
              {items.map(({ id, href, icon: Icon }) => {
                const active = isNavActive(href, pathname, role)
                return (
                  <li key={id}>
                    <Link
                      href={href as never}
                      aria-current={active ? "page" : undefined}
                      aria-label={collapsed ? tNav(id as never) : undefined}
                      title={collapsed ? tNav(id as never) : undefined}
                      className={cn(
                        rowBase,
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-primary-tint font-semibold text-primary before:absolute before:inset-y-2 before:start-0 before:w-0.75 before:rounded-full before:bg-primary"
                          : "font-medium text-on-surface-muted hover:bg-surface-muted hover:text-on-surface"
                      )}
                    >
                      <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                      {!collapsed && <span className="truncate">{tNav(id as never)}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 flex-col gap-0.5 border-t border-border px-2.5 py-2.5">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? tCommon("expand") : tCommon("collapse")}
          aria-expanded={!collapsed}
          title={collapsed ? tCommon("expand") : tCommon("collapse")}
          className={cn(
            rowBase,
            "font-medium text-on-surface-muted hover:bg-surface-muted hover:text-on-surface",
            collapsed && "justify-center px-0"
          )}
        >
          <CollapseIcon className="size-4.5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
          {!collapsed && <span className="truncate">{tCommon("collapse")}</span>}
        </button>

        <button
          type="button"
          onClick={() => void signOut()}
          disabled={pending}
          aria-label={collapsed ? tTop("sign_out") : undefined}
          title={collapsed ? tTop("sign_out") : undefined}
          className={cn(
            rowBase,
            "font-medium text-on-surface-muted hover:bg-error-tint hover:text-error disabled:opacity-60",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="size-4.5 shrink-0 rtl:rotate-180" aria-hidden="true" />
          {!collapsed && <span className="truncate">{tTop("sign_out")}</span>}
        </button>
        {error && (
          <p role="alert" className="px-2.5 text-label-sm text-error">
            {error}
          </p>
        )}

        {teacherName && (
          <div
            className={cn(
              "mt-1.5 flex min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5",
              collapsed && "justify-center px-0"
            )}
          >
            <Avatar className="size-8 shrink-0 bg-primary-tint text-primary" title={collapsed ? teacherName : undefined}>
              <AvatarFallback className="bg-primary-tint text-label-sm font-semibold text-primary">
                {initials(teacherName)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md font-medium text-on-surface" title={teacherName}>
                  {teacherName}
                </p>
                {teacherRole && (
                  <p className="truncate text-label-sm text-on-surface-muted">{teacherRole}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
