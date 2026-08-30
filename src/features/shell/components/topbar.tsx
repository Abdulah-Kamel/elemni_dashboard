import { useTranslations } from "next-intl";
import { Search, HelpCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountMenu } from "@/features/shell/components/account-menu";
import { NotificationDropdown } from "@/features/shell/components/notification-dropdown";
import { LocaleToggle } from "@/features/shell/components/locale-toggle";
import { ThemeToggle } from "@/features/shell/components/theme-toggle";

type TopbarProps = {
  teacherName: string;
  userRole?: string;
};

export function Topbar({ teacherName, userRole }: TopbarProps) {
  const t = useTranslations("common");
  const tOverview = useTranslations("overview");

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-md border-b border-border bg-surface/90 px-lg backdrop-blur-md">
      <div className="relative max-w-md flex-1">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted"
          aria-hidden="true"
        />
        <Input
          type="search"
          name="dashboard-search"
          placeholder={t("search_placeholder")}
          aria-label={t("search_placeholder")}
          className="h-10 w-full rounded-lg border border-border bg-surface-muted ps-9 pe-3 text-body-md text-body-md--line-height text-foreground placeholder:text-on-surface-muted focus:border-primary focus:bg-surface focus:ring-3 focus:ring-primary/10 focus:outline-none"
        />
      </div>

      <div className="ms-auto flex items-center gap-1">
        <LocaleToggle />
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label={t("help")}>
          <HelpCircle className="size-5" aria-hidden="true" />
        </Button>

        <NotificationDropdown />

        <AccountMenu teacherName={teacherName} />
      </div>
    </header>
  )
}
