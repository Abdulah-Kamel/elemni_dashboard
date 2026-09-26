"use client"

import { useTranslations } from "next-intl"
import { LogOut, UserRound } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Link } from "@/i18n/routing"
import type { NavRole } from "@/features/shell/nav-config"
import { useSignOut } from "@/features/shell/components/use-sign-out"
import { initials } from "@/features/shell/components/initials"

type AccountMenuProps = {
  userName: string
  roleLabel: string
  role: NavRole
}

export function AccountMenu({ userName, roleLabel, role }: AccountMenuProps) {
  const t = useTranslations("topbar")
  const tShell = useTranslations("dashboardShell")
  const { signOut, pending, error } = useSignOut()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t("account_menu")}: ${userName}`}
        className="flex items-center rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
      >
        <Avatar className="size-9 bg-primary-tint text-primary transition-opacity hover:opacity-85">
          <AvatarFallback className="bg-primary-tint text-label-md font-semibold text-primary">
            {initials(userName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-1">
        <div className="flex items-center gap-3 px-2 py-2.5">
          <Avatar className="size-9 shrink-0 bg-primary-tint text-primary">
            <AvatarFallback className="bg-primary-tint text-label-md font-semibold text-primary">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-lg font-semibold text-on-surface" title={userName}>
              {userName}
            </p>
            <p className="truncate text-label-md text-on-surface-muted">{roleLabel}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        {role === "teacher" && (
          <DropdownMenuItem
            render={<Link href="/profile" />}
            className="gap-2.5 px-2 py-2 text-body-md"
          >
            <UserRound className="size-4 text-on-surface-muted" aria-hidden="true" />
            {tShell("actions.view_profile")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          closeOnClick={false}
          disabled={pending}
          onClick={() => void signOut()}
          className="gap-2.5 px-2 py-2 text-body-md"
        >
          <LogOut className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("sign_out")}
        </DropdownMenuItem>
        {error && (
          <p role="alert" className="px-2 pb-2 text-label-md text-error">
            {error}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
