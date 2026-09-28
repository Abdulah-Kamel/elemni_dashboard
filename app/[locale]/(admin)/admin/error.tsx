"use client"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export default function AdminError({ unstable_retry }: { unstable_retry: () => void }) {
  const t = useTranslations("common")
  return <main className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 text-center"><h1 className="text-2xl font-bold">{t("error_title")}</h1><p className="text-muted-foreground">{t("error_message")}</p><Button onClick={unstable_retry}>{t("retry")}</Button></main>
}
