import { useTranslations } from "next-intl";
import { AccountMenu } from "@/features/shell/components/account-menu";
import { LocaleToggle } from "@/features/shell/components/locale-toggle";
import { ThemeToggle } from "@/features/shell/components/theme-toggle";

type TopbarProps = {
  teacherName: string;
};

export function Topbar({ teacherName }: TopbarProps) {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-md border-b border-border bg-surface/90 px-lg backdrop-blur-md">
      <div
        role="group"
        aria-label={t("controls")}
        className="ms-auto flex items-center gap-1 rounded-2xl border bg-surface-raised px-3 py-1.5"
      >
        <LocaleToggle />
        <ThemeToggle />
        <AccountMenu teacherName={teacherName} />
      </div>
    </header>
  )
}
