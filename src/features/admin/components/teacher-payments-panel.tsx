"use client"

import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  listAdminTeacherPaymentsAction,
  recordTeacherPaymentAction,
} from "@/features/billing/actions"
import { adminKeys } from "@/features/admin/query-keys"

const PAGE_SIZE = 10

export function TeacherPaymentsPanel({
  teacherProfileId,
}: {
  teacherProfileId: number
}) {
  const t = useTranslations("admin")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const paymentsQuery = useQuery({
    queryKey: [...adminKeys.payments(teacherProfileId), page],
    queryFn: () =>
      listAdminTeacherPaymentsAction(teacherProfileId, {
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        sortBy: "created_at",
        sortOrder: "desc",
      }),
  })

  const recordMutation = useMutation({
    mutationFn: (input: { amount: number; note?: string }) =>
      recordTeacherPaymentAction(teacherProfileId, input),
    onSuccess: (result) => {
      if (!result.success) {
        setFormError(result.error.message)
        toast.error(result.error.message)
        return
      }
      setAmount("")
      setNote("")
      setFormError(null)
      setPage(1)
      toast.success(t("payment_recorded"))
      return queryClient.invalidateQueries({
        queryKey: adminKeys.payments(teacherProfileId),
      })
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t("error_create")
      setFormError(message)
      toast.error(message)
    },
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError(t("payment_amount_invalid"))
      return
    }
    if (note.trim().length > 500) {
      setFormError(t("payment_note_too_long"))
      return
    }
    setFormError(null)
    await recordMutation.mutateAsync({
      amount: parsedAmount,
      note: note.trim() ? note.trim() : undefined,
    })
  }

  const total = paymentsQuery.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <Card
      data-testid="teacher-payments-panel"
      className="rounded-2xl border-border p-md shadow-xs"
    >
      <h2 className="text-title-lg font-semibold">{t("title_payments")}</h2>
      <p className="mt-1 text-sm text-on-surface-muted">
        {t("payments_count", { count: total })}
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <Table className="text-sm">
          <TableHeader className="border-b border-border bg-surface-muted text-on-surface-muted">
            <TableRow>
              <TableHead className="px-4 py-3">{t("table_amount")}</TableHead>
              <TableHead className="px-4 py-3">{t("table_date")}</TableHead>
              <TableHead className="px-4 py-3">{t("payments_admin")}</TableHead>
              <TableHead className="px-4 py-3">{t("payments_note")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentsQuery.data?.items.length ? (
              paymentsQuery.data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3 font-semibold" dir="ltr">
                    {currency.format(item.amount)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-on-surface-muted">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                    }).format(new Date(item.created_at))}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {item.admin_name ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-on-surface-muted">
                    {item.note ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-4 py-8 text-center text-xs text-on-surface-muted"
                >
                  {t("no_results")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-on-surface-muted">
          {t("pagination", { page, pages })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {t("previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            {t("next")}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 border-t border-border pt-4">
        <div className="grid gap-1.5">
          <Label htmlFor={`record-amount-${teacherProfileId}`}>
            {t("payment_amount")}
          </Label>
          <Input
            id={`record-amount-${teacherProfileId}`}
            aria-label={t("payment_amount")}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`record-note-${teacherProfileId}`}>
            {t("payment_note")}
          </Label>
          <Textarea
            id={`record-note-${teacherProfileId}`}
            aria-label={t("payment_note")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
          />
        </div>
        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={recordMutation.isPending}>
          {t("record_payment")}
        </Button>
      </form>
    </Card>
  )
}
