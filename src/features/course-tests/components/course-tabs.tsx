import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type CourseTab = "content" | "tests"

/**
 * Section tabs of a course (Teacher-Tests design). These are page links, so
 * they're a navigation landmark with aria-current rather than an ARIA tablist.
 */
export function CourseTabs({ courseId, active, className }: { courseId: number; active: CourseTab; className?: string }) {
  const t = useTranslations("courseTests.tabs")
  const tabs: { id: CourseTab; href: string }[] = [
    { id: "content", href: `/courses/${courseId}` },
    { id: "tests", href: `/courses/${courseId}/tests` },
  ]
  return (
    <nav aria-label={t("label")} className={cn("flex gap-1 overflow-x-auto border-b border-border", className)}>
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <Link
            key={tab.id}
            href={tab.href as never}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "relative inline-flex min-h-11 shrink-0 items-center px-4 text-sm transition-colors focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              "after:absolute after:inset-x-2 after:-bottom-px after:h-[3px] after:rounded-full after:bg-primary after:transition-transform after:duration-200 motion-reduce:after:transition-none",
              selected ? "font-semibold text-primary after:scale-x-100" : "font-medium text-on-surface-muted after:scale-x-0 hover:text-foreground",
            )}
          >
            {t(tab.id)}
          </Link>
        )
      })}
    </nav>
  )
}
