import { setRequestLocale } from "next-intl/server"
import { redirect } from "next/navigation"

function buildRedirectSearch(
  searchParams: Record<string, string | string[] | undefined>
) {
  const query = new URLSearchParams()

  for (const key of ["start", "end"]) {
    const value = searchParams[key]
    const candidate = Array.isArray(value) ? value[0] : value
    if (candidate) {
      query.set(key, candidate)
    }
  }

  const search = query.toString()
  return search ? `?${search}` : ""
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const query = await searchParams
  redirect(`/${locale}/dashboard${buildRedirectSearch(query)}`)
}
