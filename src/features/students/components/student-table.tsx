"use client"

import { useLocale, useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SortHeader, ariaSort } from "@/components/ui/sort-header"
import { PaymentStatusBadge } from "@/features/billing/components/payment-status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SortState } from "@/lib/sort"
import { cn } from "@/lib/utils"
import {
  getAccessState,
  type StudentSortKey,
  type StudentSubscriptionRow,
} from "@/features/students/roster-model"
import { formatAmount } from "@/features/students/format"

export type { StudentSubscriptionRow }

interface StudentTableProps {
  students: StudentSubscriptionRow[]
  sort?: SortState<StudentSortKey> | null
  onSort?: (column: StudentSortKey) => void
  onOpenStudent?: (studentId: number) => void
  selectedStudentId?: number | null
  /** Reference time for access windows; server-provided to stay hydration-stable. */
  now?: number
}

const COLUMNS: { key: StudentSortKey; label: string }[] = [
  { key: "name", label: "name" },
  { key: "course", label: "course" },
  { key: "purchased", label: "enrollment_date" },
  { key: "expires", label: "expires_at" },
  { key: "amount", label: "payment" },
  { key: "status", label: "status" },
]

export function StudentTable({
  students,
  sort = null,
  onSort,
  onOpenStudent,
  selectedStudentId = null,
  now,
}: StudentTableProps) {
  const t = useTranslations("student")
  const tw = useTranslations("teacherWorkspace.students")
  const locale = useLocale()
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight

  const [tableBodyRef] = useAutoAnimate({ duration: 180 })

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <Table>
        <TableHeader className="bg-surface-muted text-xs font-semibold text-on-surface-muted">
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead
                key={column.key}
                className="px-4 py-2.5"
                aria-sort={onSort ? ariaSort(sort, column.key) : undefined}
              >
                {onSort ? (
                  <SortHeader
                    label={t(column.label)}
                    column={column.key}
                    sort={sort}
                    onSort={onSort}
                  />
                ) : (
                  t(column.label)
                )}
              </TableHead>
            ))}
            {onOpenStudent ? (
              <TableHead className="w-10 px-2 py-2.5">
                <span className="sr-only">{t("actions")}</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody ref={tableBodyRef}>
          {students.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={onOpenStudent ? 7 : 6}
                className="px-4 py-10 text-center text-sm text-on-surface-muted"
              >
                {t("no_results")}
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => {
              const access = now == null ? null : getAccessState(student, now)
              const selected = selectedStudentId === student.studentId
              return (
                <TableRow
                  key={student.enrollmentId}
                  data-state={selected ? "selected" : undefined}
                  onClick={
                    onOpenStudent
                      ? (event) => {
                          // Let real links/buttons inside the row do their own thing.
                          if ((event.target as HTMLElement).closest("a,button")) return
                          onOpenStudent(student.studentId)
                        }
                      : undefined
                  }
                  className={cn(onOpenStudent && "cursor-pointer hover:bg-primary-tint/40")}
                >
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 bg-primary-tint text-primary">
                        <AvatarFallback className="text-xs font-semibold">
                          {student.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        {onOpenStudent ? (
                          <button
                            type="button"
                            onClick={() => onOpenStudent(student.studentId)}
                            aria-label={tw("open_student", { name: student.name })}
                            className="block max-w-[16rem] truncate rounded-sm text-start text-sm font-medium text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                          >
                            {student.name}
                          </button>
                        ) : (
                          <p className="truncate text-sm font-medium text-foreground">
                            {student.name}
                          </p>
                        )}
                        <p className="truncate text-xs text-on-surface-muted" dir="ltr">
                          {student.phone ?? student.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-on-surface-muted">
                    <div className="space-y-0.5">
                      <p className="text-foreground">{student.course}</p>
                      {student.grade || student.stream ? (
                        <p className="text-xs text-on-surface-muted">
                          {[student.grade, student.stream].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-on-surface-muted tabular-nums">
                    {dateFormatter.format(new Date(student.purchasedAt))}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-on-surface-muted tabular-nums">
                    <p>{dateFormatter.format(new Date(student.expiresAt))}</p>
                    {access?.kind === "active" ? (
                      <p
                        className={cn(
                          "text-xs",
                          access.expiring ? "font-medium text-warning" : "text-on-surface-muted"
                        )}
                      >
                        {tw("days_left", { count: access.daysLeft })}
                      </p>
                    ) : access?.kind === "expired" ? (
                      <p className="text-xs text-on-surface-muted">{tw("access_expired")}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm font-medium text-foreground tabular-nums">
                    {formatAmount(student.totalPaid, student.currency, locale)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <PaymentStatusBadge status={student.status} />
                  </TableCell>
                  {onOpenStudent ? (
                    <TableCell className="px-2 py-2.5 text-on-surface-muted">
                      <Chevron className="size-4" aria-hidden="true" />
                    </TableCell>
                  ) : null}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
