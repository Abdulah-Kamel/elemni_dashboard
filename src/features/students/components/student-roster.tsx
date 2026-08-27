"use client"

import { useMemo, useState } from "react"
import type { CourseOut } from "@/features/shell/schema"
import { StudentStatsBar } from "@/features/students/components/student-stats-bar"
import { StudentFilters } from "@/features/students/components/student-filters"
import {
  StudentTable,
  type StudentSubscriptionRow,
} from "@/features/students/components/student-table"
import { StudentPagination } from "@/features/students/components/student-pagination"
import type { TeacherSubscription } from "@/features/students/schema"

const ITEMS_PER_PAGE = 10

type Props = {
  subscriptions: TeacherSubscription[]
  courses: CourseOut[]
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "ST"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function StudentRoster({ subscriptions, courses }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [streamFilter, setStreamFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const rows = useMemo<StudentSubscriptionRow[]>(
    () =>
      [...subscriptions]
        .sort(
          (left, right) =>
            new Date(right.purchased_at).getTime() -
            new Date(left.purchased_at).getTime()
        )
        .map((subscription) => ({
          enrollmentId: subscription.enrollment_id,
          studentId: subscription.student_id,
          name: subscription.student_name,
          initials: getInitials(subscription.student_name),
          email: subscription.student_email,
          phone:
            subscription.whatsapp_number ??
            subscription.student_phone ??
            subscription.parent_phone ??
            null,
          courseId: subscription.course.id,
          course: subscription.course.title,
          purchasedAt: subscription.purchased_at,
          expiresAt: subscription.expires_at,
          totalPaid: subscription.total_paid,
          currency: subscription.currency || "EGP",
          status: subscription.payment_status.toLowerCase(),
          grade: subscription.grade_name ?? null,
          stream: subscription.stream_name ?? null,
        })),
    [subscriptions]
  )

  const courseOptions = useMemo(() => {
    const linkedCourses = rows.map((row) => row.course)
    const allCourses = new Set([
      ...courses.map((course) => course.title),
      ...linkedCourses,
    ])
    return [...allCourses].sort()
  }, [courses, rows])

  const gradeOptions = useMemo(
    () =>
      [
        ...new Set(rows.map((row) => row.grade).filter(Boolean) as string[]),
      ].sort(),
    [rows]
  )

  const streamOptions = useMemo(
    () =>
      [
        ...new Set(rows.map((row) => row.stream).filter(Boolean) as string[]),
      ].sort(),
    [rows]
  )

  const statusOptions = useMemo(
    () => [...new Set(rows.map((row) => row.status))].sort(),
    [rows]
  )

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.name.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.course.toLowerCase().includes(term) ||
        row.phone?.toLowerCase().includes(term)

      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter
      const matchesCourse =
        courseFilter === "all" || row.course === courseFilter
      const matchesGrade = gradeFilter === "all" || row.grade === gradeFilter
      const matchesStream =
        streamFilter === "all" || row.stream === streamFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCourse &&
        matchesGrade &&
        matchesStream
      )
    })
  }, [courseFilter, gradeFilter, rows, searchTerm, statusFilter, streamFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  )
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = useMemo(() => {
    const uniqueStudents = new Set(rows.map((row) => row.studentId)).size
    const completed = rows.filter((row) => row.status === "completed").length
    const pending = rows.filter((row) => row.status === "pending").length

    return {
      totalStudents: uniqueStudents,
      completedSubscriptions: completed,
      pendingSubscriptions: pending,
    }
  }, [rows])

  function resetPagination() {
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col gap-xl">
      <div className="animate-slide-up">
        <StudentStatsBar
          totalStudents={stats.totalStudents}
          completedSubscriptions={stats.completedSubscriptions}
          pendingSubscriptions={stats.pendingSubscriptions}
        />
      </div>
      <div className="flex animate-slide-up animate-stagger-1 flex-col gap-md">
        <StudentFilters
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value)
            resetPagination()
          }}
          statusFilter={statusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value)
            resetPagination()
          }}
          statusOptions={statusOptions}
          courseFilter={courseFilter}
          onCourseChange={(value) => {
            setCourseFilter(value)
            resetPagination()
          }}
          courses={courseOptions}
          gradeFilter={gradeFilter}
          onGradeChange={(value) => {
            setGradeFilter(value)
            resetPagination()
          }}
          grades={gradeOptions}
          streamFilter={streamFilter}
          onStreamChange={(value) => {
            setStreamFilter(value)
            resetPagination()
          }}
          streams={streamOptions}
        />
        <StudentTable students={paginatedStudents} />
        <StudentPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={filteredStudents.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
