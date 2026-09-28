"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export default function LocaleError({ unstable_retry }: { unstable_retry: () => void }) {
  const t = useTranslations("common")
  return <main className="mx-auto flex min-h-[60dvh] max-w-[40rem] flex-col items-center justify-center gap-4 px-6 text-center"><h1 className="text-3xl font-bold">{t("error_title")}</h1><p className="text-muted-foreground">{t("error_message")}</p><div className="flex flex-wrap gap-3"><Button onClick={unstable_retry}>{t("retry")}</Button><Button variant="outline" render={<Link href="/" />}>{t("dashboard")}</Button></div></main>
}
