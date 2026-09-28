import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"

// not-found.tsx receives no params; read the locale set by the [locale] layout.
export default async function NotFoundPage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "common" })
  return <main className="mx-auto flex min-h-[60dvh] max-w-[40rem] flex-col items-center justify-center gap-4 px-6 text-center"><h1 className="text-3xl font-bold">{t("not_found_title")}</h1><p className="text-muted-foreground">{t("not_found_message")}</p><Button render={<Link href={`/${locale}/dashboard`} />}>{t("dashboard")}</Button></main>
}
