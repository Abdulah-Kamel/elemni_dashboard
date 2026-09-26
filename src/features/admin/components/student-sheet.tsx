"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Trash2, UserRoundX } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "@/features/billing/components/payment-status-badge"
import { getStudentAction, listSubscriptionsAction } from "../actions"
import { formatDate, formatMoney } from "../format"
import { adminKeys } from "../query-keys"
import type { AdminStudent } from "../schema"
import { AdminActionDialog } from "./admin-action-dialog"
import { AdminSheet, FactList, SheetLoading, SheetSection } from "./admin-sheet"

/** The subscriptions API searches by name/email/phone; rows are then matched on student_id. */
const SUBSCRIPTION_LOOKUP_LIMIT = 50

export function StudentSheet({
  studentId,
  row,
  onClose,
  onToggleStatus,
  onDelete,
  pending,
}: {
  studentId: number | null
  row: AdminStudent | undefined
  onClose: () => void
  /** Resolve true when the API accepted the change. */
  onToggleStatus: (student: AdminStudent) => Promise<boolean>
  onDelete: (student: AdminStudent) => Promise<boolean>
  pending: boolean
}) {
  const t = useTranslations("admin")
  const c = useTranslations("adminConsole")
  const detail = useQuery({
    queryKey: ["admin", "student", studentId ?? 0],
    queryFn: () => getStudentAction(studentId as number),
    enabled: studentId !== null && !row,
  })
  const student = row ?? detail.data
  const [action, setAction] = useState<"status" | "delete" | null>(null)

  async function confirm() {
    if (!student || !action) return
    const ok = action === "delete" ? await onDelete(student) : await onToggleStatus(student)
    if (!ok) return
    setAction(null)
    if (action === "delete") onClose()
  }

  const copy =
    action === "delete"
      ? { title: t("action_delete_student_title"), description: t("action_delete_student", { name: student?.name ?? "" }), label: t("btn_delete"), destructive: true }
      : student?.is_active
        ? { title: t("action_deactivate_title"), description: t("action_deactivate_student", { name: student?.name ?? "" }), label: t("btn_deactivate"), destructive: true }
        : { title: t("action_activate_title"), description: t("action_activate_student", { name: student?.name ?? "" }), label: t("btn_activate"), destructive: false }

  return (
    <AdminSheet
      open={studentId !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={student?.name ?? c("sheet.student_title")}
      description={student?.email}
      badges={
        student && (
          <Badge variant={student.is_active ? "default" : "secondary"}>
            {student.is_active ? t("status_active") : t("status_inactive")}
          </Badge>
        )
      }
      footer={
        student && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={student.is_active ? "destructive" : "default"} disabled={pending} onClick={() => setAction("status")}>
                {student.is_active ? <UserRoundX className="size-4" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                {student.is_active ? t("btn_deactivate") : t("btn_activate")}
              </Button>
              <Button variant="ghost" className="ms-auto text-destructive" disabled={pending} onClick={() => setAction("delete")}>
                <Trash2 className="size-4" aria-hidden="true" />
                {t("btn_delete")}
              </Button>
            </div>
            <AdminActionDialog
              open={action !== null}
              title={copy.title}
              description={copy.description}
              confirmLabel={copy.label}
              cancelLabel={t("btn_cancel")}
              variant={copy.destructive ? "destructive" : "default"}
              pending={pending}
              onConfirm={confirm}
              onOpenChange={(open) => {
                if (!open) setAction(null)
              }}
            />
          </>
        )
      }
    >
      {student ? (
        <StudentSheetBody student={student} />
      ) : detail.isError ? (
        <p role="alert" className="text-sm text-destructive">{c("sheet.load_error")}</p>
      ) : (
        <SheetLoading />
      )}
    </AdminSheet>
  )
}

function StudentSheetBody({ student }: { student: AdminStudent }) {
  const t = useTranslations("admin")
  const c = useTranslations("adminConsole")
  const locale = useLocale()
  const subscriptions = useQuery({
    queryKey: adminKeys.subscriptions({ student: student.id, search: student.email }),
    queryFn: () => listSubscriptionsAction({ search: student.email, paymentStatus: "all", limit: SUBSCRIPTION_LOOKUP_LIMIT }),
    select: (page) => page.items.filter((item) => item.student_id === student.id),
  })

  return (
    <>
      <FactList
        items={[
          { label: t("field_phone"), value: student.phone_number, ltr: true },
          { label: c("fields.whatsapp"), value: student.whatsapp_number, ltr: true },
          { label: c("fields.parent_phone"), value: student.parent_phone, ltr: true },
          { label: t("table_level"), value: [student.grade_name, student.stream_name].filter(Boolean).join(" · ") },
          { label: c("fields.joined"), value: formatDate(locale, student.created_at) },
        ]}
      />
      <SheetSection
        title={t("title_subscriptions")}
        action={
          <Link
            href={`/admin/subscriptions?status=all&q=${encodeURIComponent(student.email)}` as never}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("view_all")}
          </Link>
        }
      >
        {subscriptions.isLoading ? (
          <SheetLoading />
        ) : subscriptions.isError ? (
          <p className="text-sm text-on-surface-muted">{c("sheet.section_error")}</p>
        ) : subscriptions.data?.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {subscriptions.data.map((item) => (
              <li key={item.enrollment_id}>
                <Link
                  href={`/admin/subscriptions?status=all&q=${encodeURIComponent(student.email)}&view=${item.enrollment_id}` as never}
                  className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.course.title}</span>
                    <span className="block text-xs text-on-surface-muted">
                      {c("sheet.period", { from: formatDate(locale, item.purchased_at), to: formatDate(locale, item.expires_at) })}
                    </span>
                  </span>
                  <PaymentStatusBadge status={item.payment_status} />
                  <span className="shrink-0 text-sm font-semibold tabular-nums" dir="ltr">
                    {formatMoney(locale, item.total_paid, item.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-on-surface-muted">{c("sheet.no_student_subscriptions")}</p>
        )}
      </SheetSection>
    </>
  )
}
