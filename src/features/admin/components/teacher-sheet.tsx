"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, ExternalLink, Mail, UserRoundX, Video } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Link } from "@/i18n/routing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { listAdminTeacherPaymentsAction } from "@/features/billing/actions"
import { createTeacherLibrary, listSubscriptionsAction, sendSetPasswordEmail } from "../actions"
import { formatDate, formatMoney, formatRelative } from "../format"
import { useTeacherMutations, useTeacherQuery } from "../hooks/use-teachers-queries"
import { adminKeys } from "../query-keys"
import type { AdminTeacherListItem } from "../schema"
import { AdminActionDialog } from "./admin-action-dialog"
import { AdminSheet, FactList, SheetLoading, SheetSection } from "./admin-sheet"

type SheetAction = "status" | "invite" | "create-library"

const RECENT_LIMIT = 5

export function TeacherSheet({
  teacherId,
  row,
  onClose,
}: {
  teacherId: number | null
  /** The row already on screen, if any — avoids a refetch. */
  row: AdminTeacherListItem | undefined
  onClose: () => void
}) {
  const detail = useTeacherQuery(teacherId, !row)
  const teacher = row ?? detail.data
  const t = useTranslations("admin")
  const c = useTranslations("adminConsole")

  return (
    <AdminSheet
      open={teacherId !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={teacher?.name ?? c("sheet.teacher_title")}
      description={teacher?.email}
      badges={
        teacher && (
          <>
            <Badge variant={teacher.is_active ? "default" : "secondary"}>
              {teacher.is_active ? t("status_active") : t("status_inactive")}
            </Badge>
            <Badge variant="outline" className={teacher.has_library ? "" : "border-warning/50 bg-warning-tint text-warning"}>
              <Video className="size-3" aria-hidden="true" />
              {teacher.has_library ? t("library_ready") : t("library_missing")}
            </Badge>
          </>
        )
      }
      footer={teacher && <TeacherSheetActions teacher={teacher} />}
    >
      {teacher ? (
        <TeacherSheetBody teacher={teacher} />
      ) : detail.isError ? (
        <p role="alert" className="text-sm text-destructive">{c("sheet.load_error")}</p>
      ) : (
        <SheetLoading />
      )}
    </AdminSheet>
  )
}

function TeacherSheetBody({ teacher }: { teacher: AdminTeacherListItem }) {
  const t = useTranslations("admin")
  const c = useTranslations("adminConsole")
  const b = useTranslations("billing")
  const locale = useLocale()

  const subscriptions = useQuery({
    queryKey: adminKeys.subscriptions({ teacherProfileId: teacher.teacher_profile_id, limit: RECENT_LIMIT, sheet: true }),
    queryFn: () =>
      listSubscriptionsAction({ teacherProfileId: teacher.teacher_profile_id, limit: RECENT_LIMIT, paymentStatus: "completed" }),
  })
  const payments = useQuery({
    queryKey: [...adminKeys.payments(teacher.teacher_profile_id), "summary"],
    queryFn: () => listAdminTeacherPaymentsAction(teacher.teacher_profile_id, { skip: 0, limit: 1 }),
  })
  const balance = (value: number | null | undefined) =>
    value == null ? b("not_available") : formatMoney(locale, value, "EGP")

  return (
    <>
      <FactList
        items={[
          { label: t("field_phone"), value: teacher.phone_number, ltr: true },
          { label: c("fields.joined"), value: formatDate(locale, teacher.created_at) },
          { label: t("field_location"), value: teacher.location },
          { label: t("field_experience"), value: teacher.experience ?? null },
          { label: c("fields.bandwidth_cost"), value: teacher.bandwidth_cost_per_gb, ltr: true },
          { label: c("fields.storage_cost"), value: teacher.storage_cost_per_gb_monthly, ltr: true },
        ]}
      />

      <SheetSection title={t("section_assignment")}>
        {teacher.subjects.length === 0 && teacher.grades.length === 0 ? (
          <p className="text-sm text-on-surface-muted">{c("sheet.no_assignments")}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {teacher.subjects.map((subject) => (
              <Badge key={`s-${subject.id}`} variant="outline">{subject.name}</Badge>
            ))}
            {teacher.grades.map((grade) => (
              <Badge key={`g-${grade.id}`} variant="secondary">{grade.name}</Badge>
            ))}
          </div>
        )}
      </SheetSection>

      <SheetSection title={b("summary_title")}>
        {payments.isError ? (
          <p className="text-sm text-on-surface-muted">{c("sheet.section_error")}</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <dt className="text-xs text-on-surface-muted">{b("total_paid")}</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums" dir="ltr">
                {payments.isLoading ? "…" : balance(payments.data?.total_paid)}
              </dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-xs text-on-surface-muted">{b("pending_dues")}</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums" dir="ltr">
                {payments.isLoading ? "…" : balance(payments.data?.pending_dues)}
              </dd>
            </div>
          </dl>
        )}
      </SheetSection>

      <SheetSection
        title={c("sheet.completed_subscriptions")}
        action={
          subscriptions.data ? (
            <span className="text-xs text-on-surface-muted">{t("subscriptions_count", { count: subscriptions.data.total })}</span>
          ) : null
        }
      >
        {subscriptions.isLoading ? (
          <SheetLoading />
        ) : subscriptions.isError ? (
          <p className="text-sm text-on-surface-muted">{c("sheet.section_error")}</p>
        ) : subscriptions.data?.items.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {subscriptions.data.items.map((item) => (
              <li key={item.enrollment_id} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.student_name}</p>
                  <p className="truncate text-xs text-on-surface-muted">
                    {item.course.title} · {formatRelative(locale, item.purchased_at)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums" dir="ltr">
                  {formatMoney(locale, item.total_paid, item.currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-on-surface-muted">{c("empty.subscriptions")}</p>
        )}
      </SheetSection>
    </>
  )
}

function TeacherSheetActions({ teacher }: { teacher: AdminTeacherListItem }) {
  const t = useTranslations("admin")
  const c = useTranslations("adminConsole")
  const queryClient = useQueryClient()
  const { update } = useTeacherMutations()
  const [action, setAction] = useState<SheetAction | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    if (!action) return
    if (action === "status") {
      const outcome = await update.mutateAsync({ id: teacher.id, data: { is_active: !teacher.is_active } })
      if (!outcome.success) return void toast.error(outcome.error.message)
      toast.success(t("updated"))
    } else {
      setBusy(true)
      const outcome = action === "invite" ? await sendSetPasswordEmail(teacher.id) : await createTeacherLibrary(teacher.id)
      setBusy(false)
      if (!outcome.success) return void toast.error(outcome.error.message)
      toast.success(outcome.data.detail)
      if (action === "create-library") await queryClient.invalidateQueries({ queryKey: adminKeys.all })
    }
    setAction(null)
  }

  const copy =
    action === "invite"
      ? { title: t("action_invite_title"), description: t("action_invite_teacher", { name: teacher.name }), label: t("btn_send_invite"), destructive: false }
      : action === "create-library"
        ? { title: t("action_create_library_title"), description: t("action_create_library", { name: teacher.name }), label: t("create_library"), destructive: false }
        : teacher.is_active
          ? { title: t("action_deactivate_title"), description: t("action_deactivate_teacher", { name: teacher.name }), label: t("btn_deactivate"), destructive: true }
          : { title: t("action_activate_title"), description: t("action_activate_teacher", { name: teacher.name }), label: t("btn_activate"), destructive: false }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button render={<Link href={`/admin/teachers/${teacher.id}` as never} />} nativeButton={false}>
          <ExternalLink className="size-4" aria-hidden="true" />
          {c("sheet.open_profile")}
        </Button>
        {!teacher.has_library && (
          <Button variant="outline" disabled={busy} onClick={() => setAction("create-library")}>
            <Video className="size-4" aria-hidden="true" />
            {t("create_library")}
          </Button>
        )}
        <Button variant="outline" disabled={busy} onClick={() => setAction("invite")}>
          <Mail className="size-4" aria-hidden="true" />
          {t("btn_send_invite")}
        </Button>
        <Button
          variant={teacher.is_active ? "destructive" : "outline"}
          className="ms-auto"
          disabled={update.isPending}
          onClick={() => setAction("status")}
        >
          {teacher.is_active ? <UserRoundX className="size-4" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
          {teacher.is_active ? t("btn_deactivate") : t("btn_activate")}
        </Button>
      </div>
      <AdminActionDialog
        open={action !== null}
        title={copy.title}
        description={copy.description}
        confirmLabel={copy.label}
        cancelLabel={t("btn_cancel")}
        variant={copy.destructive ? "destructive" : "default"}
        pending={busy || update.isPending}
        onConfirm={confirm}
        onOpenChange={(open) => {
          if (!open) setAction(null)
        }}
      />
    </>
  )
}
