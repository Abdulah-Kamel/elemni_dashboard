import { useTranslations } from "next-intl"
import { FlaskConical } from "lucide-react"
import { isCourseTestsDemo } from "../client"

/** Small, unobtrusive marker shown only when local demo data is active (dev). */
export function DemoBadge() {
  const t = useTranslations("courseTests")
  if (!isCourseTestsDemo) return null
  return (
    <span
      title={t("demo_badge_hint")}
      className="inline-flex items-center gap-1 rounded-full border border-dashed border-warning/60 bg-warning-tint/60 px-2 py-0.5 text-xs font-medium text-on-surface-muted"
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {t("demo_badge")}
      <span className="sr-only">{t("demo_badge_hint")}</span>
    </span>
  )
}
