import { useTranslations } from "next-intl"
import type { NavRole } from "@/features/shell/nav-config"
import { AccountMenu } from "@/features/shell/components/account-menu"
import { LocaleToggle } from "@/features/shell/components/locale-toggle"
import { PageContext } from "@/features/shell/components/page-context"
import { ThemeToggle } from "@/features/shell/components/theme-toggle"
import { SearchTrigger } from "@/features/command-palette/search-trigger"

type TopbarProps = {
  userName: string
  roleLabel: string
  role: NavRole
}

/**
 * 64px sticky bar: page context on the start side, the command palette
 * trigger in the middle (md+), utilities and the account menu on the end.
 */
export function Topbar({ userName, roleLabel, role }: TopbarProps) {
  const t = useTranslations("dashboardShell")

  return (
    <header className="sticky top-0 z-10 grid h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-surface/95 px-container-margin backdrop-blur-md md:grid-cols-[minmax(0,1fr)_minmax(16rem,26rem)_minmax(0,1fr)] md:gap-6">
      <PageContext role={role} />
      <div className="hidden md:block">
        <SearchTrigger variant="bar" />
      </div>
      <div role="group" aria-label={t("controls")} className="flex items-center justify-end gap-1">
        <div className="md:hidden">
          <SearchTrigger variant="icon" />
        </div>
        <ThemeToggle />
        <LocaleToggle />
        <span aria-hidden="true" className="mx-1.5 hidden h-6 w-px bg-border sm:block" />
        <AccountMenu userName={userName} roleLabel={roleLabel} role={role} />
      </div>
    </header>
  )
}
