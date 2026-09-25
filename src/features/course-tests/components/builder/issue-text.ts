"use client"

import { useCallback } from "react"
import { useTranslations } from "next-intl"
import type { Issue, IssueCode } from "./builder-model"

/** Localized text for client-side validation issues. */
export function useIssueText() {
  const t = useTranslations("courseTests.builder.issues")
  const message = useCallback((code: IssueCode) => t(code), [t])
  const full = useCallback((issue: Issue) => (issue.number ? t("question_prefix", { number: issue.number, message: t(issue.code) }) : t(issue.code)), [t])
  return { message, full }
}
