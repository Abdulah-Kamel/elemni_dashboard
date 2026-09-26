"use client"

import { useCallback, useEffect, useState } from "react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PanelRightOpen, Plus, Trash2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardPagination } from "@/components/dashboard-pagination"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SortHeader, ariaSort } from "@/components/ui/sort-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { nextSort, sortRows } from "@/lib/sort"
import {
  listGradesAction,
  listStreamsAction,
} from "@/features/course-management/actions"
import { adminKeys } from "../query-keys"
import {
  createStudent,
  deleteStudent,
  listStudentsAction,
  updateStudent,
} from "../actions"
import type { GradeOut, StreamOut } from "@/features/course-management/schema"
import { AccountCreationProgress } from "./account-creation-progress"
import { AdminActionDialog } from "./admin-action-dialog"
import { StudentSheet } from "./student-sheet"
import {
  FilterBar,
  FilteredEmpty,
  ListError,
  PageSortNote,
  SearchField,
  Segmented,
  TableSkeleton,
  rowOpenProps,
} from "./list-controls"
import { useDebouncedSearch, useUrlFilters } from "../hooks/use-url-filters"
import { formatDate } from "../format"
import {
  parseStudentFilters,
  serializeStudentFilters,
  type StudentFilters,
  type StudentSortKey,
} from "../url-state"
import type { AdminStudent } from "../schema"

const PAGE_SIZE = 10

const accessors: Record<StudentSortKey, (row: AdminStudent) => string | number | null> = {
  name: (row) => row.name,
  level: (row) => [row.grade_name, row.stream_name].filter(Boolean).join(" ") || null,
  status: (row) => (row.is_active ? 0 : 1),
  joined: (row) => new Date(row.created_at).getTime(),
}

export function StudentsList() {
  const t = useTranslations("admin")
  const c = useTranslations("adminConsole")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [filters, updateFilters] = useUrlFilters(parseStudentFilters, serializeStudentFilters)
  const commitSearch = useCallback((q: string) => updateFilters({ q, page: 1 }), [updateFilters])
  const [search, setSearch] = useDebouncedSearch(filters.q, commitSearch)
  const [open, setOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [creationStatus, setCreationStatus] = useState<
    "pending" | "success" | "warning" | "error"
  >("pending")
  const [studentAction, setStudentAction] = useState<{
    kind: "status" | "delete"
    student: AdminStudent
  } | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone_number: "" })
  const [grades, setGrades] = useState<GradeOut[]>([])
  const [streams, setStreams] = useState<StreamOut[]>([])
  const params = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.q || undefined,
    isActive: filters.status === "all" ? undefined : filters.status === "active",
    gradeId: filters.grade ?? undefined,
    streamId: filters.stream ?? undefined,
  }
  const query = useQuery({
    queryKey: adminKeys.students(params),
    queryFn: () => listStudentsAction(params),
    placeholderData: keepPreviousData,
  })
  const [desktopRowsRef] = useAutoAnimate({ duration: 160 })
  const [mobileRowsRef] = useAutoAnimate({ duration: 160 })
  const refresh = (result: { success: boolean }) => {
    if (result.success) {
      return queryClient.invalidateQueries({ queryKey: adminKeys.all })
    }
  }
  const create = useMutation({ mutationFn: createStudent, onSuccess: refresh })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) =>
      updateStudent(id, data),
    onSuccess: refresh,
  })
  const remove = useMutation({ mutationFn: deleteStudent, onSuccess: refresh })
  const total = query.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const gradeItems = [
    { value: "all", label: t("all_grades") },
    ...grades.map((grade) => ({ value: String(grade.id), label: grade.name })),
  ]
  const streamItems = [
    { value: "all", label: t("all_streams") },
    ...streams.map((stream) => ({
      value: String(stream.id),
      label: stream.name,
    })),
  ]

  useEffect(() => {
    let active = true

    Promise.all([listGradesAction(), listStreamsAction()]).then(
      ([nextGrades, nextStreams]) => {
        if (!active) return
        setGrades(nextGrades)
        setStreams(nextStreams)
      }
    )

    return () => {
      active = false
    }
  }, [])

  async function submit() {
    setCreationStatus("pending")
    setProgressOpen(true)
    const result = await create.mutateAsync({
      ...form,
      phone_number: form.phone_number || null,
    })
    if (!result.success) {
      setCreationStatus("error")
      toast.error(result.error.message)
      return
    }
    setCreationStatus(result.data.invitation_sent ? "success" : "warning")
  }

  function closeProgress() {
    setProgressOpen(false)
    if (creationStatus !== "error") {
      setOpen(false)
      setForm({ name: "", email: "", phone_number: "" })
    }
  }

  async function toggleStatus(student: AdminStudent) {
    const outcome = await update.mutateAsync({
      id: student.id,
      data: { is_active: !student.is_active },
    })
    if (!outcome.success) {
      toast.error(outcome.error.message)
      return false
    }
    toast.success(t("updated"))
    return true
  }

  async function removeStudent(student: AdminStudent) {
    const outcome = await remove.mutateAsync(student.id)
    if (!outcome.success) {
      toast.error(outcome.error.message)
      return false
    }
    toast.success(t("deleted"))
    return true
  }

  async function confirmStudentAction() {
    if (!studentAction) return
    const ok =
      studentAction.kind === "delete"
        ? await removeStudent(studentAction.student)
        : await toggleStatus(studentAction.student)
    if (ok) setStudentAction(null)
  }

  const students = sortRows(query.data?.items ?? [], filters.sort, accessors, locale)
  const activeFilterCount = [filters.q, filters.status !== "all", filters.grade !== null, filters.stream !== null].filter(Boolean).length
  const clearFilters = () => updateFilters({ q: "", status: "all", grade: null, stream: null, page: 1 })
  const view = (id: number) => updateFilters({ view: id })
  const sortBy = (key: StudentSortKey) => updateFilters({ sort: nextSort(filters.sort, key) })
  const head = (key: StudentSortKey, label: string) => (
    <TableHead className="px-4 py-2.5" aria-sort={ariaSort(filters.sort, key)}>
      <SortHeader label={label} column={key} sort={filters.sort} onSort={sortBy} />
    </TableHead>
  )

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex animate-slide-up flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-headline-md font-semibold">
            {t("title_students")}
          </h1>
          <p className="mt-1 text-on-surface-muted" aria-live="polite">
            {t("students_count", { count: total })}
          </p>
        </div>
        <Button size="lg" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          {t("btn_new_student")}
        </Button>
      </header>

      <FilterBar activeCount={activeFilterCount} onClear={clearFilters}>
        <SearchField value={search} onChange={setSearch} placeholder={t("search_students")} />
        <Segmented<StudentFilters["status"]>
          label={t("table_status")}
          value={filters.status}
          onChange={(status) => updateFilters({ status, page: 1 })}
          options={[
            { value: "all", label: t("status_all") },
            { value: "active", label: t("status_active") },
            { value: "inactive", label: t("status_inactive") },
          ]}
        />
        <Select
          value={filters.grade === null ? "all" : String(filters.grade)}
          onValueChange={(value) => {
            updateFilters({ grade: !value || value === "all" ? null : Number(value), page: 1 })
          }}
          items={gradeItems}
        >
          <SelectTrigger className="h-9 w-full sm:w-44" aria-label={t("all_grades")}>
            <SelectValue placeholder={t("all_grades")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {gradeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={filters.stream === null ? "all" : String(filters.stream)}
          onValueChange={(value) => {
            updateFilters({ stream: !value || value === "all" ? null : Number(value), page: 1 })
          }}
          items={streamItems}
        >
          <SelectTrigger className="h-9 w-full sm:w-44" aria-label={t("all_streams")}>
            <SelectValue placeholder={t("all_streams")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {streamItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </FilterBar>

      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ListError onRetry={() => query.refetch()} />
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <FilteredEmpty filtered={activeFilterCount > 0} onClear={clearFilters} />
        </div>
      ) : (
        <section
          className="overflow-hidden rounded-xl border border-border bg-surface transition-opacity data-[stale=true]:opacity-70"
          data-stale={query.isPlaceholderData}
          aria-busy={query.isFetching}
        >
          <div className="hidden overflow-x-auto md:block">
            <Table className="text-sm">
              <TableHeader className="bg-surface-muted text-start text-on-surface-muted">
                <TableRow className="hover:bg-transparent">
                  {head("name", t("table_student"))}
                  {head("level", t("table_level"))}
                  {head("status", t("table_status"))}
                  {head("joined", c("fields.joined"))}
                  <TableHead className="px-4 py-2.5 text-end">
                    {t("table_actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody ref={desktopRowsRef}>
                {students.map((student) => (
                  <TableRow key={student.id} {...rowOpenProps(() => view(student.id), filters.view === student.id)}>
                    <TableCell className="px-4 py-2.5">
                      <div className="max-w-[24rem] min-w-0">
                        <button
                          type="button"
                          onClick={() => view(student.id)}
                          className="rounded-sm text-start font-semibold hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                          {student.name}
                        </button>
                        <p className="truncate text-xs text-on-surface-muted">
                          {student.email}
                          {student.phone_number
                            ? ` · ${student.phone_number}`
                            : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-sm text-on-surface-muted">
                      {[student.grade_name, student.stream_name]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <Badge
                        variant={student.is_active ? "default" : "secondary"}
                      >
                        {student.is_active
                          ? t("status_active")
                          : t("status_inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 whitespace-nowrap text-on-surface-muted">
                      {formatDate(locale, student.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-end">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => view(student.id)}>
                          <PanelRightOpen className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                          {c("actions.view")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={update.isPending}
                          onClick={() =>
                            setStudentAction({ kind: "status", student })
                          }
                        >
                          {student.is_active
                            ? t("btn_deactivate")
                            : t("btn_activate")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={remove.isPending}
                          className="text-destructive"
                          aria-label={t("btn_delete")}
                          onClick={() =>
                            setStudentAction({ kind: "delete", student })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PageSortNote show={!!filters.sort && pages > 1} />
          </div>
          <ul ref={mobileRowsRef} className="divide-y divide-border md:hidden">
            {students.map((student) => (
              <li key={student.id} className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  onClick={() => view(student.id)}
                  className="min-w-0 flex-1 rounded-md text-start focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span className="block truncate font-semibold">{student.name}</span>
                  <span className="block truncate text-sm text-on-surface-muted">
                    {student.email}
                  </span>
                  <span className="block text-xs text-on-surface-muted">
                    {[student.grade_name, student.stream_name]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
                <Badge variant={student.is_active ? "default" : "secondary"}>
                  {student.is_active
                    ? t("status_active")
                    : t("status_inactive")}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={remove.isPending}
                  className="text-destructive"
                  aria-label={t("btn_delete")}
                  onClick={() =>
                    setStudentAction({ kind: "delete", student })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <DashboardPagination
        currentPage={Math.min(filters.page, pages)}
        totalPages={pages}
        totalItems={total}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => updateFilters({ page })}
        labels={{
          previous: t("previous"),
          next: t("next"),
          page: (current, totalPages) =>
            t("pagination", { page: current, pages: totalPages }),
          summary: (from, to, totalItems) => t("showing", { from, to, total: totalItems }),
        }}
      />
      <StudentSheet
        studentId={filters.view}
        row={students.find((student) => student.id === filters.view)}
        onClose={() => updateFilters({ view: null })}
        onToggleStatus={toggleStatus}
        onDelete={removeStudent}
        pending={update.isPending || remove.isPending}
      />
      <Dialog open={open && !progressOpen} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title_new_student")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={t("field_name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              type="email"
              placeholder={t("field_email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder={t("field_phone")}
              value={form.phone_number}
              onChange={(e) =>
                setForm({ ...form, phone_number: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("btn_cancel")}
            </Button>
            <Button
              disabled={!form.name || !form.email || create.isPending}
              onClick={submit}
            >
              {t("btn_create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AccountCreationProgress
        open={progressOpen}
        role="student"
        status={creationStatus}
        onClose={closeProgress}
      />
      <AdminActionDialog
        open={studentAction !== null}
        title={
          studentAction?.kind === "delete"
            ? t("action_delete_student_title")
            : studentAction?.student.is_active
              ? t("action_deactivate_title")
              : t("action_activate_title")
        }
        description={
          studentAction?.kind === "delete"
            ? t("action_delete_student", {
                name: studentAction?.student.name ?? "",
              })
            : studentAction?.student.is_active
              ? t("action_deactivate_student", {
                  name: studentAction?.student.name ?? "",
                })
              : t("action_activate_student", {
                  name: studentAction?.student.name ?? "",
                })
        }
        confirmLabel={
          studentAction?.kind === "delete"
            ? t("btn_delete")
            : studentAction?.student.is_active
              ? t("btn_deactivate")
              : t("btn_activate")
        }
        cancelLabel={t("btn_cancel")}
        variant={
          studentAction?.kind === "delete" || studentAction?.student.is_active
            ? "destructive"
            : "default"
        }
        pending={remove.isPending || update.isPending}
        onConfirm={confirmStudentAction}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStudentAction(null)
        }}
      />
    </div>
  )
}
