"use client"

import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { CheckCircle2, PanelRightOpen, Plus, UserRoundX } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardPagination } from "@/components/dashboard-pagination"
import { SortHeader, ariaSort } from "@/components/ui/sort-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { nextSort, sortRows } from "@/lib/sort"
import { TeacherCreateDialog } from "./teacher-create-dialog"
import { AdminActionDialog } from "./admin-action-dialog"
import { TeacherSheet } from "./teacher-sheet"
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
import { useTeacherMutations, useTeachersQuery } from "../hooks/use-teachers-queries"
import { useDebouncedSearch, useUrlFilters } from "../hooks/use-url-filters"
import { formatDate, initials } from "../format"
import {
  parseTeacherFilters,
  serializeTeacherFilters,
  type TeacherFilters,
  type TeacherSortKey,
} from "../url-state"
import type { AdminTeacherListItem } from "../schema"

const PAGE_SIZE = 10
/** The API has no library filter; for that view we load one full page (API max) and filter it here. */
const LIBRARY_SCAN_LIMIT = 100

const accessors: Record<TeacherSortKey, (row: AdminTeacherListItem) => string | number | null> = {
  name: (row) => row.name,
  subjects: (row) => row.subjects[0]?.name ?? null,
  status: (row) => (row.is_active ? 0 : 1),
  library: (row) => (row.has_library ? 0 : 1),
  joined: (row) => new Date(row.created_at).getTime(),
}

export function TeachersList() {
  const t = useTranslations("admin")
  const c = useTranslations("adminConsole")
  const locale = useLocale()
  const [filters, update] = useUrlFilters(parseTeacherFilters, serializeTeacherFilters)
  const commitSearch = useCallback((q: string) => update({ q, page: 1 }), [update])
  const [search, setSearch] = useDebouncedSearch(filters.q, commitSearch)
  const [createOpen, setCreateOpen] = useState(false)
  // `?create=1` (command palette quick action) opens the create dialog on load.
  const createFromUrl = useSearchParams()?.get("create") === "1"
  const [statusAction, setStatusAction] = useState<AdminTeacherListItem | null>(null)
  const [rowsRef] = useAutoAnimate({ duration: 160 })
  const [cardsRef] = useAutoAnimate({ duration: 160 })

  const scanLibrary = filters.library !== "all"
  const query = useTeachersQuery({
    page: scanLibrary ? 1 : filters.page,
    limit: scanLibrary ? LIBRARY_SCAN_LIMIT : PAGE_SIZE,
    search: filters.q || undefined,
    isActive: filters.status === "all" ? undefined : filters.status === "active",
  })
  const { update: mutate } = useTeacherMutations()

  const loaded = query.data?.items ?? []
  const matching = scanLibrary
    ? loaded.filter((teacher) => teacher.has_library === (filters.library === "ready"))
    : loaded
  const sorted = sortRows(matching, filters.sort, accessors, locale)
  const rows = scanLibrary ? sorted.slice((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE) : sorted
  const totalItems = scanLibrary ? matching.length : (query.data?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const scanTruncated = scanLibrary && !!query.data && query.data.total > loaded.length
  const activeFilterCount = [filters.q, filters.status !== "all", filters.library !== "all"].filter(Boolean).length
  const selected = filters.view === null ? undefined : loaded.find((teacher) => teacher.id === filters.view)

  const clearFilters = () => update({ q: "", status: "all", library: "all", page: 1 })
  const open = (id: number) => update({ view: id })
  const sortBy = (key: TeacherSortKey) => update({ sort: nextSort(filters.sort, key) })

  async function confirmStatusChange() {
    if (!statusAction) return
    const outcome = await mutate.mutateAsync({ id: statusAction.id, data: { is_active: !statusAction.is_active } })
    if (!outcome.success) {
      toast.error(outcome.error.message)
      return
    }
    toast.success(t("updated"))
    setStatusAction(null)
  }

  const head = (key: TeacherSortKey, label: string) => (
    <TableHead className="px-4 py-2.5" aria-sort={ariaSort(filters.sort, key)}>
      <SortHeader label={label} column={key} sort={filters.sort} onSort={sortBy} />
    </TableHead>
  )

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex animate-slide-up flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-headline-md font-semibold text-foreground">{t("title_teachers")}</h1>
          <p className="mt-1 text-body-md text-on-surface-muted" aria-live="polite">
            {t("teachers_count", { count: totalItems })}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <Plus className="size-4" /> {t("btn_new_teacher")}
        </Button>
      </header>

      <FilterBar activeCount={activeFilterCount} onClear={clearFilters}>
        <SearchField value={search} onChange={setSearch} placeholder={t("search_placeholder")} />
        <Segmented<TeacherFilters["status"]>
          label={t("table_status")}
          value={filters.status}
          onChange={(status) => update({ status, page: 1 })}
          options={[
            { value: "all", label: t("status_all") },
            { value: "active", label: t("status_active") },
            { value: "inactive", label: t("status_inactive") },
          ]}
        />
        <Segmented<TeacherFilters["library"]>
          label={t("table_library")}
          value={filters.library}
          onChange={(library) => update({ library, page: 1 })}
          options={[
            { value: "all", label: c("filters.library_all") },
            { value: "ready", label: t("library_ready") },
            { value: "missing", label: t("library_missing") },
          ]}
        />
      </FilterBar>

      {scanTruncated && <p className="text-xs text-warning">{c("filters.library_scan_truncated", { count: LIBRARY_SCAN_LIMIT })}</p>}

      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ListError onRetry={() => query.refetch()} />
      ) : rows.length === 0 ? (
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
              <TableHeader className="bg-surface-muted text-on-surface-muted">
                <TableRow className="hover:bg-transparent">
                  {head("name", t("table_name"))}
                  {head("subjects", t("table_subjects"))}
                  {head("status", t("table_status"))}
                  {head("library", t("table_library"))}
                  {head("joined", c("fields.joined"))}
                  <TableHead className="px-4 py-2.5 text-end">{t("table_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody ref={rowsRef}>
                {rows.map((teacher) => (
                  <TableRow key={teacher.id} {...rowOpenProps(() => open(teacher.id), filters.view === teacher.id)}>
                    <TableCell className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 bg-primary-tint text-primary">
                          <AvatarFallback className="text-xs">{initials(teacher.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => open(teacher.id)}
                            className="rounded-sm text-start font-semibold hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                          >
                            {teacher.name}
                          </button>
                          <p className="max-w-[18rem] truncate text-xs text-on-surface-muted">
                            {teacher.email}
                            {teacher.phone_number ? ` · ${teacher.phone_number}` : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="flex max-w-[16rem] flex-wrap gap-1">
                        {teacher.subjects.slice(0, 3).map((subject) => (
                          <Badge key={subject.id} variant="outline">{subject.name}</Badge>
                        ))}
                        {teacher.subjects.length > 3 && (
                          <Badge variant="ghost" className="text-on-surface-muted"><span dir="ltr">+{teacher.subjects.length - 3}</span></Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <Badge variant={teacher.is_active ? "default" : "secondary"}>
                        {teacher.is_active ? t("status_active") : t("status_inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      {teacher.has_library ? (
                        <span className="text-on-surface-muted">{t("library_ready")}</span>
                      ) : (
                        <span className="rounded-full bg-warning-tint px-2 py-0.5 text-xs font-medium text-warning">{t("library_missing")}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 whitespace-nowrap text-on-surface-muted">
                      {formatDate(locale, teacher.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-end">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => open(teacher.id)}>
                          <PanelRightOpen className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                          {c("actions.view")}
                        </Button>
                        <Button variant="ghost" size="sm" disabled={mutate.isPending} onClick={() => setStatusAction(teacher)}>
                          {teacher.is_active ? <UserRoundX className="size-4" /> : <CheckCircle2 className="size-4" />}
                          {teacher.is_active ? t("btn_deactivate") : t("btn_activate")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PageSortNote show={!scanLibrary && !!filters.sort && totalPages > 1} />
          </div>

          <ul ref={cardsRef} className="divide-y divide-border md:hidden">
            {rows.map((teacher) => (
              <li key={teacher.id} className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  onClick={() => open(teacher.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-start focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <Avatar className="size-9 bg-primary-tint text-primary">
                    <AvatarFallback className="text-xs">{initials(teacher.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{teacher.name}</span>
                    <span className="block truncate text-xs text-on-surface-muted">{teacher.email}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <Badge variant={teacher.is_active ? "default" : "secondary"}>
                        {teacher.is_active ? t("status_active") : t("status_inactive")}
                      </Badge>
                      {!teacher.has_library && (
                        <span className="rounded-full bg-warning-tint px-2 py-0.5 text-xs font-medium text-warning">{t("library_missing")}</span>
                      )}
                    </span>
                  </span>
                </button>
                <Button variant="outline" size="sm" disabled={mutate.isPending} onClick={() => setStatusAction(teacher)}>
                  {teacher.is_active ? t("btn_deactivate") : t("btn_activate")}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DashboardPagination
        currentPage={Math.min(filters.page, totalPages)}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => update({ page })}
        labels={{
          previous: t("previous"),
          next: t("next"),
          page: (current, pages) => t("pagination", { page: current, pages }),
          summary: (from, to, total) => t("showing", { from, to, total }),
        }}
      />

      <TeacherSheet teacherId={filters.view} row={selected} onClose={() => update({ view: null })} />
      <TeacherCreateDialog
        open={createOpen || createFromUrl}
        onOpenChange={(nextOpen) => {
          setCreateOpen(nextOpen)
          // Re-serialising the filters drops the one-shot `create` param.
          if (!nextOpen && createFromUrl) update({})
        }}
      />
      <AdminActionDialog
        open={statusAction !== null}
        title={statusAction?.is_active ? t("action_deactivate_title") : t("action_activate_title")}
        description={
          statusAction?.is_active
            ? t("action_deactivate_teacher", { name: statusAction?.name ?? "" })
            : t("action_activate_teacher", { name: statusAction?.name ?? "" })
        }
        confirmLabel={statusAction?.is_active ? t("btn_deactivate") : t("btn_activate")}
        cancelLabel={t("btn_cancel")}
        variant={statusAction?.is_active ? "destructive" : "default"}
        pending={mutate.isPending}
        onConfirm={confirmStatusChange}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStatusAction(null)
        }}
      />
    </div>
  )
}
