"use client"

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
  MoreHorizontal,
} from "lucide-react"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const TEACHER_NAV = [
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
]

const ADMIN_MORE_NAV = [
  { id: "grades", href: "/admin/grades", icon: Layers },
  { id: "streams", href: "/admin/streams", icon: GitBranch },
  { id: "subjects", href: "/admin/subjects", icon: Library },
] as const

export function MobileBottomNav({ userRole }: { userRole?: string }) {
  const tNav = useTranslations("sidebar")
  const pathname = usePathname()
  const navItems = userRole === "ADMIN" ? ADMIN_NAV : TEACHER_NAV

  return (
    <nav className="fixed start-0 bottom-0 z-50 flex w-full items-center justify-around border-t border-border bg-surface px-2 py-1 shadow-lg md:hidden">
      {navItems.map(({ id, href, icon: Icon }) => {
        const isActive = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
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
        )
      })}
      {userRole === "ADMIN" && <Sheet><SheetTrigger className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-on-surface-muted"><MoreHorizontal className="size-5" /><span className="text-[10px] font-semibold">{tNav("more")}</span></SheetTrigger><SheetContent side="bottom" className="rounded-t-2xl"><SheetHeader><SheetTitle>{tNav("catalog")}</SheetTitle></SheetHeader><div className="grid gap-2 p-4">{ADMIN_MORE_NAV.map(({ id, href, icon: Icon }) => <Link key={id} href={href as never} className="flex items-center gap-3 rounded-xl bg-surface-muted p-3 font-medium"><Icon className="size-5 text-primary" />{tNav(id)}</Link>)}</div></SheetContent></Sheet>}
    </nav>
  )
}
