"use client"

import { useDeferredValue, useState } from "react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CheckCircle2, Plus, Search, UserRoundX } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardPagination } from "@/components/dashboard-pagination"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Placeholder } from "@/features/shell/components/placeholder"
import { TeacherCreateDialog } from "./teacher-create-dialog"
import { AdminActionDialog } from "./admin-action-dialog"
import {
  useTeacherMutations,
  useTeachersQuery,
} from "../hooks/use-teachers-queries"
import type { AdminTeacherListItem } from "../schema"

const PAGE_SIZE = 10

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function TeachersList() {
  const t = useTranslations("admin")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<AdminTeacherListItem | null>(
    null
  )
  const deferredSearch = useDeferredValue(search.trim())
  const [rowsRef] = useAutoAnimate({ duration: 180 })
  const params = {
    page,
    limit: PAGE_SIZE,
    search: deferredSearch || undefined,
    isActive: status === "all" ? undefined : status === "active",
  }
  const query = useTeachersQuery(params)
  const { update } = useTeacherMutations()
  const totalPages = Math.max(
    1,
    Math.ceil((query.data?.total ?? 0) / PAGE_SIZE)
  )

  async function confirmStatusChange() {
    if (!statusAction) return
    const outcome = await update.mutateAsync({
      id: statusAction.id,
      data: { is_active: !statusAction.is_active },
    })
    if (!outcome.success) {
      toast.error(outcome.error.message)
      return
    }
    toast.success(t("updated"))
    setStatusAction(null)
  }

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex animate-slide-up flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-headline-md font-semibold text-foreground">
            {t("title_teachers")}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-muted">
            {t("teachers_count", { count: query.data?.total ?? 0 })}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <Plus className="size-4" /> {t("btn_new_teacher")}
        </Button>
      </header>

      <section className="animate-slide-up rounded-2xl border border-border bg-surface p-md shadow-xs animate-stagger-1">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="ps-9"
              placeholder={t("search_placeholder")}
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status)
              setPage(1)
            }}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          >
            <option value="all">{t("status_all")}</option>
            <option value="active">{t("status_active")}</option>
            <option value="inactive">{t("status_inactive")}</option>
          </select>
        </div>
      </section>

      {query.isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : query.isError ? (
        <Placeholder state="error" />
      ) : query.data?.items.length === 0 ? (
        <Placeholder state="empty" />
      ) : (
        <section className="animate-slide-up overflow-hidden rounded-2xl border border-border bg-surface shadow-xs animate-stagger-2">
          <div className="hidden overflow-x-auto md:block">
            <Table className="text-sm">
              <TableHeader className="border-b border-border bg-surface-muted text-start text-on-surface-muted">
                <TableRow>
                  <TableHead className="px-4 py-3">{t("table_name")}</TableHead>
                  <TableHead className="px-4 py-3">
                    {t("table_subjects")}
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    {t("table_status")}
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    {t("table_library")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-end">
                    {t("table_actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody ref={rowsRef}>
                {query.data?.items.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 bg-primary-tint text-primary">
                          <AvatarFallback>
                            {initials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            href={`/admin/teachers/${teacher.id}` as never}
                            className="font-semibold hover:text-primary"
                          >
                            {teacher.name}
                          </Link>
                          <p className="text-xs text-on-surface-muted">
                            {teacher.email}
                            {teacher.phone_number
                              ? ` · ${teacher.phone_number}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {teacher.subjects.slice(0, 3).map((subject) => (
                          <Badge key={subject.id} variant="outline">
                            {subject.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={teacher.is_active ? "default" : "secondary"}
                      >
                        {teacher.is_active
                          ? t("status_active")
                          : t("status_inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {teacher.has_library
                        ? t("library_ready")
                        : t("library_missing")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={update.isPending}
                        onClick={() => setStatusAction(teacher)}
                      >
                        {teacher.is_active ? (
                          <UserRoundX className="size-4" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        {teacher.is_active
                          ? t("btn_deactivate")
                          : t("btn_activate")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div ref={rowsRef} className="divide-y divide-border md:hidden">
            {query.data?.items.map((teacher) => (
              <article key={teacher.id} className="space-y-3 p-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/teachers/${teacher.id}` as never}
                      className="font-semibold"
                    >
                      {teacher.name}
                    </Link>
                    <p className="text-sm text-on-surface-muted">
                      {teacher.email}
                    </p>
                  </div>
                  <Badge variant={teacher.is_active ? "default" : "secondary"}>
                    {teacher.is_active
                      ? t("status_active")
                      : t("status_inactive")}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {teacher.subjects.map((subject) => (
                    <Badge key={subject.id} variant="outline">
                      {subject.name}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setStatusAction(teacher)}
                >
                  {teacher.is_active ? t("btn_deactivate") : t("btn_activate")}
                </Button>
              </article>
            ))}
          </div>
        </section>
      )}

      <DashboardPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={query.data?.total ?? 0}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        labels={{
          previous: t("previous"),
          next: t("next"),
          page: (current, pages) => t("pagination", { page: current, pages }),
          summary: (from, to, total) => t("showing", { from, to, total }),
        }}
      />
      <TeacherCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <AdminActionDialog
        open={statusAction !== null}
        title={
          statusAction?.is_active
            ? t("action_deactivate_title")
            : t("action_activate_title")
        }
        description={
          statusAction?.is_active
            ? t("action_deactivate_teacher", { name: statusAction?.name ?? "" })
            : t("action_activate_teacher", { name: statusAction?.name ?? "" })
        }
        confirmLabel={
          statusAction?.is_active ? t("btn_deactivate") : t("btn_activate")
        }
        cancelLabel={t("btn_cancel")}
        variant={statusAction?.is_active ? "destructive" : "default"}
        pending={update.isPending}
        onConfirm={confirmStatusChange}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStatusAction(null)
        }}
      />
    </div>
  )
}
