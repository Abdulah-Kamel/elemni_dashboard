import { setRequestLocale } from "next-intl/server"
import { Placeholder } from "@/features/shell/components/placeholder"
import { verifySession } from "@/lib/auth/dal"
import { redirectToAuth } from "@/lib/auth/redirect"
import { Overview } from "@/features/dashboard/components/overview"
import { loadDashboardOverview } from "@/features/dashboard/load-overview"

export const dynamic = "force-dynamic"

function normalizeDateParam(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate) return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : undefined
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await verifySession()
  if (!user) {
    return redirectToAuth(locale, `/${locale}/dashboard`)
  }

  const query = await searchParams
  const filters = {
    start: normalizeDateParam(query.start),
    end: normalizeDateParam(query.end),
  }
  const result = await loadDashboardOverview(filters)
  if (result.kind === "ready") {
    const teacherFirstName = user.name.split(/\s+/)[0] ?? user.name
    return (
      <Overview
        teacherFirstName={teacherFirstName}
        summary={result.summary}
        topCourses={result.topCourses}
        recentSubscriptions={result.recentSubscriptions}
        filters={filters}
      />
    )
  }
  if (result.kind === "unauthorized") {
    return redirectToAuth(locale, `/${locale}/dashboard`)
  }
  return <Placeholder state="error" error={result.error} />
}
