import ar from "@/i18n/messages/ar.json"
import en from "@/i18n/messages/en.json"

type TitleIssue = { code: string; path: PropertyKey[] }

export function titleValidationError(locale: "ar" | "en", issues: TitleIssue[]) {
  const isTooLong = issues.some((issue) => issue.code === "too_big")
  const template = isTooLong
    ? (locale === "ar" ? ar.lessons.title_too_long : en.lessons.title_too_long)
    : (locale === "ar" ? ar.placeholder.error_validation : en.placeholder.error_validation)
  const message = template.replace("{max}", "200")
  return {
    success: false as const,
    error: {
      type: "Validation",
      ...(isTooLong ? { code: "title_too_long" } : {}),
      message,
      fields: [...new Set(issues.map((issue) => issue.path.join(".")))],
    },
  }
}
