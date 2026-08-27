"use client"

import { useLocale, useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface StudentSubscriptionRow {
  enrollmentId: number
  studentId: number
  name: string
  initials: string
  email: string
  phone: string | null
  courseId: number
  course: string
  purchasedAt: string
  expiresAt: string
  totalPaid: number
  currency: string
  status: string
  grade: string | null
  stream: string | null
}

interface StudentTableProps {
  students: StudentSubscriptionRow[]
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-success-tint text-success",
  pending: "bg-warning-tint text-warning",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-surface-strong text-on-surface-muted",
  refunded: "bg-surface-strong text-on-surface-muted",
}

export function StudentTable({ students }: StudentTableProps) {
  const t = useTranslations("student")
  const locale = useLocale()
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const [tableBodyRef] = useAutoAnimate({ duration: 180 })

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <Table>
        <TableHeader className="bg-surface-muted text-xs font-bold text-on-surface-muted">
          <TableRow>
            <TableHead className="px-4 py-3">{t("name")}</TableHead>
            <TableHead className="px-4 py-3">{t("course")}</TableHead>
            <TableHead className="px-4 py-3">{t("enrollment_date")}</TableHead>
            <TableHead className="px-4 py-3">{t("expires_at")}</TableHead>
            <TableHead className="px-4 py-3">{t("payment")}</TableHead>
            <TableHead className="px-4 py-3">{t("status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={tableBodyRef}>
          {students.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="px-4 py-8 text-center text-xs text-on-surface-muted"
              >
                {t("no_results")}
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.enrollmentId}>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8 bg-primary-tint text-primary">
                      <AvatarFallback className="text-xs font-semibold">
                        {student.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {student.name}
                      </p>
                      <p className="truncate text-xs text-on-surface-muted">
                        {student.phone ?? student.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  <div className="space-y-0.5">
                    <p>{student.course}</p>
                    {student.grade || student.stream ? (
                      <p className="text-xs text-on-surface-muted">
                        {[student.grade, student.stream]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {dateFormatter.format(new Date(student.purchasedAt))}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {dateFormatter.format(new Date(student.expiresAt))}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                  {formatCurrency(
                    student.totalPaid,
                    student.currency || "EGP",
                    currencyFormatter,
                    locale
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLES[student.status] ??
                      "bg-surface-strong text-on-surface-muted"
                    }`}
                  >
                    {getStatusLabel(student.status, t)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function getStatusLabel(status: string, t: ReturnType<typeof useTranslations>) {
  switch (status) {
    case "completed":
      return t("status_completed")
    case "pending":
      return t("status_pending")
    case "failed":
      return t("status_failed")
    case "cancelled":
      return t("status_cancelled")
    case "refunded":
      return t("status_refunded")
    default:
      return status
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
  }
}

function formatCurrency(
  amount: number,
  currency: string,
  fallbackFormatter: Intl.NumberFormat,
  locale: string
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return fallbackFormatter.format(amount)
  }
}
