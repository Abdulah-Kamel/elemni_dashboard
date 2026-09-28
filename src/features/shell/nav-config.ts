import {
  BookOpen,
  GitBranch,
  GraduationCap,
  Layers,
  LayoutGrid,
  Library,
  ReceiptText,
  TicketPercent,
  User,
  type LucideIcon,
} from "lucide-react"

/**
 * Single source of truth for dashboard navigation. The sidebar, the mobile
 * bottom nav, the top bar's page context and the command palette all read
 * from here, so a destination added once shows up everywhere.
 */

export type NavRole = "teacher" | "admin"

/** Section ids map to `dashboardShell.groups.<id>` labels. */
export type NavGroupId = "workspace" | "account" | "operations" | "catalog"

export type NavItem = {
  /** Label key in the `sidebar` namespace. */
  id: string
  href: string
  icon: LucideIcon
  group: NavGroupId
  /** Shown directly in the mobile bottom bar (others go under "More"). */
  mobile: boolean
}

export const TEACHER_NAV: readonly NavItem[] = [
  { id: "overview", href: "/dashboard", icon: LayoutGrid, group: "workspace", mobile: true },
  { id: "my_courses", href: "/courses", icon: BookOpen, group: "workspace", mobile: true },
  { id: "students", href: "/students", icon: GraduationCap, group: "workspace", mobile: true },
  { id: "earnings", href: "/usage", icon: ReceiptText, group: "workspace", mobile: true },
  { id: "profile", href: "/profile", icon: User, group: "account", mobile: true },
]

export const ADMIN_NAV: readonly NavItem[] = [
  { id: "overview", href: "/admin", icon: LayoutGrid, group: "operations", mobile: true },
  { id: "teachers", href: "/admin/teachers", icon: GraduationCap, group: "operations", mobile: true },
  { id: "students", href: "/admin/students", icon: User, group: "operations", mobile: true },
  { id: "subscriptions", href: "/admin/subscriptions", icon: ReceiptText, group: "operations", mobile: true },
  { id: "coupons", href: "/admin/coupons", icon: TicketPercent, group: "operations", mobile: true },
  { id: "grades", href: "/admin/grades", icon: Layers, group: "catalog", mobile: false },
  { id: "streams", href: "/admin/streams", icon: GitBranch, group: "catalog", mobile: false },
  { id: "subjects", href: "/admin/subjects", icon: Library, group: "catalog", mobile: false },
]

export function roleFromUserRole(userRole: string | undefined): NavRole {
  return userRole === "ADMIN" ? "admin" : "teacher"
}

export function navFor(role: NavRole): readonly NavItem[] {
  return role === "admin" ? ADMIN_NAV : TEACHER_NAV
}

export function homeHref(role: NavRole): string {
  return role === "admin" ? "/admin" : "/dashboard"
}

/** Items grouped by section, preserving config order. */
export function groupedNav(role: NavRole): { group: NavGroupId; items: NavItem[] }[] {
  const groups: { group: NavGroupId; items: NavItem[] }[] = []
  for (const item of navFor(role)) {
    const last = groups[groups.length - 1]
    if (last && last.group === item.group) last.items.push(item)
    else groups.push({ group: item.group, items: [item] })
  }
  return groups
}

/** A role's home matches exactly; other items also match their sub-pages. */
export function isNavActive(href: string, pathname: string, role: NavRole): boolean {
  if (href === homeHref(role)) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function activeNavItem(pathname: string, role: NavRole): NavItem | null {
  return navFor(role).find((item) => isNavActive(item.href, pathname, role)) ?? null
}

/**
 * Routes that exist but are not in the sidebar; the top bar still names them.
 * Values are keys in the `sidebar` namespace.
 */
const UNLISTED_SECTIONS: Record<string, string> = {
  "/billing": "billing",
  "/lessons": "lessons",
  "/analytics": "analytics",
}

/** One crumb: `labelKey` is in `dashboardShell.crumbs` unless `navId` is set. */
export type Crumb = { href: string; navId?: string; labelKey?: string }

/**
 * Page context for the top bar: the section (from the nav config) followed by
 * generic crumbs for deeper routes. Entity names are not known here, so deeper
 * crumbs use neutral labels ("Course", "Chapter") rather than guessing.
 */
export function pageTrail(pathname: string, role: NavRole): Crumb[] {
  const section = activeNavItem(pathname, role)
  if (!section) {
    const unlisted = Object.keys(UNLISTED_SECTIONS).find(
      (href) => pathname === href || pathname.startsWith(`${href}/`)
    )
    return unlisted ? [{ href: unlisted, navId: UNLISTED_SECTIONS[unlisted] }] : []
  }

  const trail: Crumb[] = [{ href: section.href, navId: section.id }]
  const rest = pathname.slice(section.href.length).split("/").filter(Boolean)
  if (rest.length === 0) return trail

  if (section.href === "/courses") {
    if (rest[0] === "new") {
      trail.push({ href: pathname, labelKey: "new_course" })
      return trail
    }
    const courseHref = `/courses/${rest[0]}`
    trail.push({ href: courseHref, labelKey: "course" })
    if (rest[1] === "chapters" && rest[2]) {
      trail.push({ href: `${courseHref}/chapters/${rest[2]}`, labelKey: "chapter" })
    }
    return trail
  }

  if (section.href === "/admin/teachers") {
    trail.push({ href: `/admin/teachers/${rest[0]}`, labelKey: "teacher" })
    return trail
  }

  trail.push({ href: pathname, labelKey: "details" })
  return trail
}
