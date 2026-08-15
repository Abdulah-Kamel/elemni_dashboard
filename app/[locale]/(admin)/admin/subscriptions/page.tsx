import { setRequestLocale } from "next-intl/server"
import { SubscriptionsList } from "@/features/admin/components/subscriptions-list"
export default async function SubscriptionsPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; setRequestLocale(locale); return <SubscriptionsList /> }
