"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { toast } from "sonner"
import { Archive, CalendarClock, ClipboardCheck, Copy, Eye, MoreVertical, PenLine, PencilLine, Trash2 } from "lucide-react"
import { Link, useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { callClient, notifyCourseTestsChanged } from "../hooks"
import { displayStatus, formatDateTime, SUCCESS_TEXT, WARNING_TEXT, type DisplayStatus } from "../ui-utils"
import type { CourseTestRow } from "../types"

const testPath = (row: Pick<CourseTestRow, "course_id" | "id">) => `/courses/${row.course_id}/tests/${row.id}`

export function StatusPill({ status }: { status: DisplayStatus }) {
  const t = useTranslations("courseTests.status")
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        status === "published" && cn("bg-success-tint", SUCCESS_TEXT),
        status === "scheduled" && "bg-surface-strong text-on-surface-muted",
        status === "draft" && "border-[1.5px] border-dashed border-border-strong text-on-surface-muted",
        status === "archived" && "bg-surface-muted text-on-surface-subtle line-through decoration-1",
      )}
    >
      {t(status)}
    </span>
  )
}

function TestIcon({ status }: { status: DisplayStatus }) {
  const Icon = status === "scheduled" ? CalendarClock : status === "draft" ? PencilLine : status === "archived" ? Archive : ClipboardCheck
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[10px]",
        status === "published" && "bg-primary-tint text-primary",
        status === "scheduled" && "bg-surface-strong text-on-surface-muted",
        status === "draft" && "border-[1.5px] border-dashed border-border-strong text-on-surface-muted",
        status === "archived" && "bg-surface-muted text-on-surface-subtle",
      )}
    >
      <Icon className="size-4.5" />
    </span>
  )
}

type Confirm = { kind: "archive" | "delete"; row: CourseTestRow } | null

export function TestsTable({ rows }: { rows: CourseTestRow[] }) {
  const t = useTranslations("courseTests.table")
  const tr = useTranslations("courseTests.row_actions")
  const locale = useLocale()
  const router = useRouter()
  const [bodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 220 })
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [busy, setBusy] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const archivedCount = rows.filter((row) => row.status === "archived").length
  const visible = rows.filter((row) => showArchived || row.status !== "archived")

  async function duplicate(row: CourseTestRow) {
    const result = await callClient((client) => client.duplicateTest(row.id))
    if (!result.ok) return void toast.error(result.error)
    toast.success(tr("duplicated"))
    notifyCourseTestsChanged()
  }

  async function runConfirm() {
    if (!confirm) return
    setBusy(true)
    const { kind, row } = confirm
    const result = await callClient((client) => (kind === "archive" ? client.archiveTest(row.id) : client.deleteTest(row.id)))
    setBusy(false)
    if (!result.ok) return void toast.error(result.error)
    toast.success(tr(kind === "archive" ? "archived" : "deleted"))
    setConfirm(null)
    notifyCourseTestsChanged()
  }

  const headClass = "h-11 px-3 text-start text-xs font-semibold whitespace-nowrap text-on-surface-muted first:ps-5 last:pe-5"

  return (
    <div className="animate-slide-up animate-stagger-3 overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <caption className="sr-only">{t("caption")}</caption>
          <thead className="border-b border-border bg-surface-muted">
            <tr>
              <th scope="col" className={cn(headClass, "w-[24%]")}>{t("test")}</th>
              <th scope="col" className={headClass}>{t("placement")}</th>
              <th scope="col" className={headClass}>{t("questions")}</th>
              <th scope="col" className={headClass}>{t("duration")}</th>
              <th scope="col" className={headClass}>{t("attempts")}</th>
              <th scope="col" className={headClass}>{t("status")}</th>
              <th scope="col" className={headClass}>{t("submissions")}</th>
              <th scope="col" className={cn(headClass, "w-14")}>
                <span className="sr-only">{t("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {visible.map((row) => {
              const status = displayStatus(row)
              const muted = "text-on-surface-muted"
              return (
                <tr key={row.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/60">
                  <th scope="row" className="py-3.5 ps-5 pe-3 text-start font-semibold">
                    <Link
                      href={testPath(row) as never}
                      className={cn("flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", status === "draft" && muted)}
                    >
                      <TestIcon status={status} />
                      <span className="min-w-0 hover:underline">{row.title}</span>
                    </Link>
                  </th>
                  <td className={cn("px-3 py-3.5", row.placement_label ? "text-on-surface-muted" : "text-on-surface-subtle")}>{row.placement_label ?? t("not_placed")}</td>
                  <td className="px-3 py-3.5 whitespace-nowrap tabular-nums">
                    {row.total_points > 0 ? t("questions_points", { questions: row.question_count, points: row.total_points }) : row.question_count}
                  </td>
                  <td className={cn("px-3 py-3.5 whitespace-nowrap tabular-nums", row.time_limit_minutes === null && muted)}>
                    {row.time_limit_minutes === null ? t("no_time") : t("minutes", { count: row.time_limit_minutes })}
                  </td>
                  <td className={cn("px-3 py-3.5 tabular-nums", row.max_attempts === null && muted)}>{row.max_attempts ?? t("unlimited")}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex flex-col items-start gap-1">
                      <StatusPill status={status} />
                      {status === "scheduled" && row.opens_at && <span className="text-[11px] text-on-surface-muted tabular-nums">{formatDateTime(row.opens_at, locale)}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums">
                    {status === "draft" ? (
                      <Link href={testPath(row) as never} className="inline-flex min-h-11 items-center text-[13px] font-semibold text-primary hover:underline focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                        {t("continue_editing")}
                      </Link>
                    ) : row.submission_count > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span>{t("students", { count: row.submission_count })}</span>
                        {row.pending_grading_count > 0 && (
                          <Link
                            href={`/grading?testId=${row.id}` as never}
                            className={cn("text-xs font-medium hover:underline", WARNING_TEXT, " focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}
                          >
                            {t("pending_link", { count: row.pending_grading_count })}
                          </Link>
                        )}
                      </div>
                    ) : (
                      <span className={muted}>{t("none")}</span>
                    )}
                  </td>
                  <td className="py-3.5 ps-3 pe-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="outline" size="icon" className="size-11 rounded-[10px] text-on-surface-muted" aria-label={t("row_menu", { title: row.title })}>
                            <MoreVertical className="size-4.5" aria-hidden="true" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-52">
                        {row.status !== "archived" && (
                          <DropdownMenuItem className="min-h-10" onClick={() => router.push(testPath(row) as never)}>
                            <PenLine aria-hidden="true" />
                            {tr("edit")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="min-h-10" onClick={() => void duplicate(row)}>
                          <Copy aria-hidden="true" />
                          {tr("duplicate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="min-h-10" onClick={() => router.push(`${testPath(row)}/preview` as never)}>
                          <Eye aria-hidden="true" />
                          {tr("preview")}
                        </DropdownMenuItem>
                        {row.pending_grading_count > 0 && (
                          <DropdownMenuItem className="min-h-10" onClick={() => router.push(`/grading?testId=${row.id}` as never)}>
                            <ClipboardCheck aria-hidden="true" />
                            {tr("grade")}
                          </DropdownMenuItem>
                        )}
                        {(row.status === "published" || row.status === "draft") && <DropdownMenuSeparator />}
                        {row.status === "published" && (
                          <DropdownMenuItem className="min-h-10" onClick={() => setConfirm({ kind: "archive", row })}>
                            <Archive aria-hidden="true" />
                            {tr("archive")}
                          </DropdownMenuItem>
                        )}
                        {row.status === "draft" && (
                          <DropdownMenuItem variant="destructive" className="min-h-10" onClick={() => setConfirm({ kind: "delete", row })}>
                            <Trash2 aria-hidden="true" />
                            {tr("delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {archivedCount > 0 && (
        <div className="border-t border-border px-5 py-2">
          <Button variant="ghost" className="h-11 text-on-surface-muted" aria-expanded={showArchived} onClick={() => setShowArchived((value) => !value)}>
            <Archive className="size-4" aria-hidden="true" />
            {showArchived ? t("archived_hide") : t("archived_toggle", { count: archivedCount })}
          </Button>
        </div>
      )}

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        <DialogContent>
          {confirm && (
            <>
              <DialogHeader>
                <DialogTitle>{tr(confirm.kind === "archive" ? "archive_title" : "delete_title", { title: confirm.row.title })}</DialogTitle>
                <DialogDescription>{tr(confirm.kind === "archive" ? "archive_body" : "delete_body")}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" className="h-11 px-4" disabled={busy} onClick={() => setConfirm(null)}>
                  {tr("cancel")}
                </Button>
                <Button
                  variant={confirm.kind === "delete" ? "destructive" : "default"}
                  className="h-11 px-4"
                  disabled={busy}
                  aria-busy={busy}
                  onClick={() => void runConfirm()}
                >
                  {tr(confirm.kind === "archive" ? "archive_confirm" : "delete_confirm")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function TestsTableSkeleton() {
  return (
    <div className="space-y-3 rounded-[20px] border border-border bg-card p-5" aria-hidden="true">
      <Skeleton className="h-6 w-full" />
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  )
}
