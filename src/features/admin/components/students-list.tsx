"use client"

import { useDeferredValue, useEffect, useState } from "react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import type { AdminStudent } from "../schema"

const PAGE_SIZE = 10

export function StudentsList() {
  const t = useTranslations("admin")
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [gradeId, setGradeId] = useState("all")
  const [streamId, setStreamId] = useState("all")
  const [page, setPage] = useState(1)
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
  const deferredSearch = useDeferredValue(search)
  const params = {
    page,
    limit: PAGE_SIZE,
    search: deferredSearch || undefined,
    isActive: status === "all" ? undefined : status === "active",
    gradeId: gradeId === "all" ? undefined : Number(gradeId),
    streamId: streamId === "all" ? undefined : Number(streamId),
  }
  const query = useQuery({
    queryKey: adminKeys.students(params),
    queryFn: () => listStudentsAction(params),
  })
  const [desktopRowsRef] = useAutoAnimate({ duration: 180 })
  const [mobileRowsRef] = useAutoAnimate({ duration: 180 })
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
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE))
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

  async function confirmStudentAction() {
    if (!studentAction) return
    if (studentAction.kind === "delete") {
      const outcome = await remove.mutateAsync(studentAction.student.id)
      if (!outcome.success) {
        toast.error(outcome.error.message)
        return
      }
      toast.success(t("deleted"))
    } else {
      const outcome = await update.mutateAsync({
        id: studentAction.student.id,
        data: { is_active: !studentAction.student.is_active },
      })
      if (!outcome.success) {
        toast.error(outcome.error.message)
        return
      }
      toast.success(t("updated"))
    }
    setStudentAction(null)
  }

  const students = query.data?.items ?? []

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex animate-slide-up items-end justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-headline-md font-semibold">
            {t("title_students")}
          </h1>
          <p className="mt-1 text-on-surface-muted">
            {t("students_count", { count: query.data?.total ?? 0 })}
          </p>
        </div>
        <Button size="lg" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          {t("btn_new_student")}
        </Button>
      </header>
      <div className="relative animate-slide-up rounded-2xl border border-border bg-surface p-md shadow-xs animate-stagger-1">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
            <Input
              className="ps-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder={t("search_students")}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as typeof status)
              setPage(1)
            }}
            items={[
              { value: "all", label: t("status_all") },
              { value: "active", label: t("status_active") },
              { value: "inactive", label: t("status_inactive") },
            ]}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t("status_all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t("status_all")}</SelectItem>
                <SelectItem value="active">{t("status_active")}</SelectItem>
                <SelectItem value="inactive">{t("status_inactive")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={gradeId}
            onValueChange={(value) => {
              setGradeId(value ?? "all")
              setPage(1)
            }}
            items={gradeItems}
          >
            <SelectTrigger className="w-full sm:w-44">
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
            value={streamId}
            onValueChange={(value) => {
              setStreamId(value ?? "all")
              setPage(1)
            }}
            items={streamItems}
          >
            <SelectTrigger className="w-full sm:w-44">
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
        </div>
      </div>
      {query.isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <section className="animate-slide-up overflow-hidden rounded-2xl border border-border bg-surface shadow-xs animate-stagger-2">
          <div className="hidden overflow-x-auto md:block">
            <Table className="text-sm">
              <TableHeader className="border-b border-border bg-surface-muted text-start text-on-surface-muted">
                <TableRow>
                  <TableHead className="px-4 py-3">
                    {t("table_student")}
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    {t("table_level")}
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    {t("table_status")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-end">
                    {t("table_actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody ref={desktopRowsRef}>
                {students.length ? (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="px-4 py-3">
                        <div className="max-w-sm min-w-0">
                          <p className="font-semibold">{student.name}</p>
                          <p className="truncate text-sm text-on-surface-muted">
                            {student.email}
                            {student.phone_number
                              ? ` · ${student.phone_number}`
                              : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                        {[student.grade_name, student.stream_name]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant={student.is_active ? "default" : "secondary"}
                        >
                          {student.is_active
                            ? t("status_active")
                            : t("status_inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-2">
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
          <div ref={mobileRowsRef} className="divide-y divide-border md:hidden">
            {students.length ? (
              students.map((student) => (
                <article
                  key={student.id}
                  className="flex flex-col gap-3 p-md sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{student.name}</p>
                    <p className="truncate text-sm text-on-surface-muted">
                      {student.email}
                      {student.phone_number ? ` · ${student.phone_number}` : ""}
                    </p>
                    <p className="text-xs text-on-surface-muted">
                      {[student.grade_name, student.stream_name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Badge variant={student.is_active ? "default" : "secondary"}>
                    {student.is_active
                      ? t("status_active")
                      : t("status_inactive")}
                  </Badge>
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
                </article>
              ))
            ) : (
              <div className="p-md text-center text-xs text-on-surface-muted">
                {t("no_results")}
              </div>
            )}
          </div>
        </section>
      )}
      <DashboardPagination
        currentPage={page}
        totalPages={pages}
        totalItems={query.data?.total ?? 0}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        labels={{
          previous: t("previous"),
          next: t("next"),
          page: (current, totalPages) =>
            t("pagination", { page: current, pages: totalPages }),
          summary: (from, to, total) => t("showing", { from, to, total }),
        }}
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
