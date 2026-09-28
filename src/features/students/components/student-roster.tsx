"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale } from "next-intl"
import type { CourseOut } from "@/features/shell/schema"
import { nextSort, sortRows } from "@/lib/sort"
import {
  StudentStatsBar,
  type StatFilter,
} from "@/features/students/components/student-stats-bar"
import {
  StudentFilters,
  type FilterOption,
} from "@/features/students/components/student-filters"
import { StudentTable } from "@/features/students/components/student-table"
import { StudentPagination } from "@/features/students/components/student-pagination"
import { StudentDetailSheet } from "@/features/students/components/student-detail-sheet"
import type { TeacherSubscription } from "@/features/students/schema"
import {
  ACCESS_FILTERS,
  EMPTY_STUDENT_QUERY,
  filterStudentRows,
  getRosterStats,
  serializeStudentQuery,
  studentSortAccessors,
  toStudentRow,
  type AccessFilter,
  type StudentQueryState,
  type StudentSortKey,
} from "@/features/students/roster-model"

const ITEMS_PER_PAGE = 10

type Props = {
  subscriptions: TeacherSubscription[]
  courses: CourseOut[]
  /** Parsed from the URL on the server; see `parseStudentQuery`. */
  initialQuery?: StudentQueryState
  /** Server render time, used for "days left" so SSR and hydration agree. */
  now?: number
}

function uniqueOptions(entries: Array<[number | null, string | null]>): FilterOption[] {
  const map = new Map<number, string>()
  for (const [id, label] of entries) {
    if (id != null && label && !map.has(id)) map.set(id, label)
  }
  return [...map.entries()]
    .map(([id, label]) => ({ value: String(id), label }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function toId(value: string): number | null {
  const parsed = Number(value)
  return value !== "all" && Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function StudentRoster({
  subscriptions,
  courses,
  initialQuery = EMPTY_STUDENT_QUERY,
  now: serverNow,
}: Props) {
  const locale = useLocale()
  const [now] = useState(() => serverNow ?? Date.now())
  const [query, setQuery] = useState<StudentQueryState>(initialQuery)

  // Mirror state into the URL so views can be shared, reloaded and deep-linked.
  const queryString = serializeStudentQuery(query)
  useEffect(() => {
    const url = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", url)
    }
  }, [queryString])

  function update(patch: Partial<StudentQueryState>, resetPage = true) {
    setQuery((current) => ({ ...current, ...patch, ...(resetPage ? { page: 1 } : {}) }))
  }

  const rows = useMemo(() => subscriptions.map(toStudentRow), [subscriptions])

  const courseOptions = useMemo(
    () =>
      uniqueOptions([
        ...courses.map((course): [number, string] => [course.id, course.title]),
        ...rows.map((row): [number, string] => [row.courseId, row.course]),
      ]),
    [courses, rows]
  )
  const gradeOptions = useMemo(
    () => uniqueOptions(rows.map((row) => [row.gradeId, row.grade])),
    [rows]
  )
  const streamOptions = useMemo(
    () => uniqueOptions(rows.map((row) => [row.streamId, row.stream])),
    [rows]
  )
  const statusOptions = useMemo(() => {
    const statuses = new Set(rows.map((row) => row.status))
    if (query.status) statuses.add(query.status)
    return [...statuses].sort()
  }, [rows, query.status])

  const filtered = useMemo(
    () => filterStudentRows(rows, query, now),
    [rows, query, now]
  )
  const sorted = useMemo(
    () => sortRows(filtered, query.sort, studentSortAccessors, locale),
    [filtered, query.sort, locale]
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(query.page, totalPages)
  const pageRows = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = useMemo(() => getRosterStats(rows, now), [rows, now])
  const activeTile: StatFilter | null =
    query.access === "expiring" && !query.status
      ? "expiring"
      : !query.access && (query.status === "completed" || query.status === "pending")
        ? query.status
        : !query.access && !query.status
          ? "all"
          : null

  function handleTile(tile: StatFilter) {
    if (tile === "all" || tile === activeTile) {
      update({ status: null, access: null })
    } else if (tile === "expiring") {
      update({ status: null, access: "expiring" })
    } else {
      update({ status: tile, access: null })
    }
  }

  const selectedSubscriptions = useMemo(
    () => (query.student ? rows.filter((row) => row.studentId === query.student) : []),
    [rows, query.student]
  )

  const hasActiveFilters = Boolean(
    query.q || query.status || query.course || query.grade || query.stream || query.access
  )

  return (
    <div className="flex flex-col gap-5">
      <StudentStatsBar stats={stats} active={activeTile} onSelect={handleTile} />
      <div className="flex flex-col gap-3">
        <StudentFilters
          searchTerm={query.q}
          onSearchChange={(value) => update({ q: value })}
          statusFilter={query.status ?? "all"}
          onStatusChange={(value) => update({ status: value === "all" ? null : value })}
          statusOptions={statusOptions}
          courseFilter={query.course ? String(query.course) : "all"}
          onCourseChange={(value) => update({ course: toId(value) })}
          courses={courseOptions}
          gradeFilter={query.grade ? String(query.grade) : "all"}
          onGradeChange={(value) => update({ grade: toId(value) })}
          grades={gradeOptions}
          streamFilter={query.stream ? String(query.stream) : "all"}
          onStreamChange={(value) => update({ stream: toId(value) })}
          streams={streamOptions}
          accessFilter={query.access ?? "all"}
          onAccessChange={(value) =>
            update({
              access: (ACCESS_FILTERS as readonly string[]).includes(value)
                ? (value as AccessFilter)
                : null,
            })
          }
          hasActiveFilters={hasActiveFilters}
          onClear={() =>
            update({ q: "", status: null, course: null, grade: null, stream: null, access: null })
          }
        />
        <StudentTable
          students={pageRows}
          sort={query.sort}
          onSort={(column: StudentSortKey) =>
            update({ sort: nextSort(query.sort, column) }, false)
          }
          onOpenStudent={(studentId) => update({ student: studentId }, false)}
          selectedStudentId={query.student}
          now={now}
        />
        <StudentPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={sorted.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => update({ page }, false)}
        />
      </div>
      <StudentDetailSheet
        subscriptions={selectedSubscriptions}
        open={query.student != null}
        onOpenChange={(open) => {
          if (!open) update({ student: null }, false)
        }}
        onFilterCourse={(courseId) =>
          update({
            student: null,
            course: courseId,
            q: "",
            status: null,
            grade: null,
            stream: null,
            access: null,
          })
        }
        now={now}
      />
    </div>
  )
}
