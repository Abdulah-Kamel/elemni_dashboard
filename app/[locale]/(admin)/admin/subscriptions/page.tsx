import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import { SubscriptionsList } from "@/features/admin/components/subscriptions-list"
import { TableSkeleton } from "@/features/admin/components/list-controls"

export default async function SubscriptionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <Suspense fallback={<TableSkeleton />}>
      <SubscriptionsList />
    </Suspense>
  )
}
