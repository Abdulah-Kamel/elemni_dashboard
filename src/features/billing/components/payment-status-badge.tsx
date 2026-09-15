"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  refunded: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  duplicate_paid: "bg-violet-500/10 text-violet-700 border-violet-500/30",
}

const statusLabelKeys: Record<string, string> = {
  completed: "payment_status.completed",
  pending: "payment_status.pending",
  failed: "payment_status.failed",
  cancelled: "payment_status.cancelled",
  refunded: "payment_status.refunded",
  duplicate_paid: "payment_status.duplicate_paid",
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const t = useTranslations("billing")
  const normalized = status.toLowerCase()
  const labelKey = statusLabelKeys[normalized]

  return (
    <Badge
      variant="outline"
      data-testid={`payment-status-${normalized}`}
      className={cn(statusStyles[normalized] ?? "", "whitespace-nowrap")}
    >
      {labelKey ? t(labelKey) : humanizeStatus(normalized)}
    </Badge>
  )
}

function humanizeStatus(status: string) {
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
