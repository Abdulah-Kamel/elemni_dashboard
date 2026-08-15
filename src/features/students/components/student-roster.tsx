"use client"

import { useState, useMemo } from "react"
import { StudentStatsBar } from "@/features/students/components/student-stats-bar"
import { StudentFilters } from "@/features/students/components/student-filters"
import { StudentTable } from "@/features/students/components/student-table"
import type { Student } from "@/features/students/components/student-table"
import { StudentPagination } from "@/features/students/components/student-pagination"
import { GrantAccessModal } from "@/features/students/components/grant-access-modal"

const ITEMS_PER_PAGE = 5

const MOCK_STUDENTS: Student[] = [
  {
    id: 1,
    name: "Layla Hassan",
    initials: "LH",
    course: "Algebra I",
    enrollmentDate: "Jan 15, 2026",
    progress: 75,
    status: "active",
  },
  {
    id: 2,
    name: "Omar Farouk",
    initials: "OF",
    course: "Algebra I",
    enrollmentDate: "Feb 1, 2026",
    progress: 45,
    status: "active",
  },
  {
    id: 3,
    name: "Nadia Youssef",
    initials: "NY",
    course: "Geometry",
    enrollmentDate: "Jan 20, 2026",
    progress: 90,
    status: "completed",
  },
  {
    id: 4,
    name: "Khaled Ibrahim",
    initials: "KI",
    course: "Algebra I",
    enrollmentDate: "Mar 5, 2026",
    progress: 20,
    status: "blocked",
  },
  {
    id: 5,
    name: "Mariam Adel",
    initials: "MA",
    course: "Geometry",
    enrollmentDate: "Feb 12, 2026",
    progress: 60,
    status: "active",
  },
  {
    id: 6,
    name: "Youssef Amin",
    initials: "YA",
    course: "Algebra I",
    enrollmentDate: "Jan 8, 2026",
    progress: 85,
    status: "active",
  },
  {
    id: 7,
    name: "Salma Nabil",
    initials: "SN",
    course: "Geometry",
    enrollmentDate: "Apr 1, 2026",
    progress: 10,
    status: "blocked",
  },
  {
    id: 8,
    name: "Ali Mostafa",
    initials: "AM",
    course: "Algebra I",
    enrollmentDate: "Mar 20, 2026",
    progress: 35,
    status: "active",
  },
  {
    id: 9,
    name: "Hana Tamer",
    initials: "HT",
    course: "Geometry",
    enrollmentDate: "Feb 28, 2026",
    progress: 100,
    status: "completed",
  },
  {
    id: 10,
    name: "Tarek Samir",
    initials: "TS",
    course: "Algebra I",
    enrollmentDate: "Jan 5, 2026",
    progress: 55,
    status: "active",
  },
]

export function StudentRoster() {
  const [students, setStudents] = useState(MOCK_STUDENTS)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [grantStudent, setGrantStudent] = useState<Student | null>(null)
  const courseOptions = useMemo(
    () => [...new Set(students.map((student) => student.course))].sort(),
    [students]
  )

  const filteredStudents = useMemo(() => {
    let result = students

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.course.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter)
    }

    if (courseFilter !== "all") {
      result = result.filter((s) => s.course === courseFilter)
    }

    return result
  }, [students, searchTerm, statusFilter, courseFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  )
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = useMemo(
    () => ({
      total: students.length,
      active: students.filter((s) => s.status === "active").length,
      pending: students.filter((s) => s.status === "blocked").length,
    }),
    [students]
  )

  function handleToggleBlock(id: number) {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "blocked" ? "active" : "blocked" }
          : s
      )
    )
  }

  function handleOpenGrant(student: Student) {
    setGrantStudent(student)
  }

  function handleCloseGrant() {
    setGrantStudent(null)
  }

  function handleConfirmGrant(accessType: string) {
    console.log("Grant access:", grantStudent?.name, accessType)
    setGrantStudent(null)
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  function handleCourseChange(value: string) {
    setCourseFilter(value)
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col gap-xl">
      <StudentStatsBar
        totalStudents={stats.total}
        activeStudents={stats.active}
        pendingAccess={stats.pending}
      />
      <div className="flex flex-col gap-md">
        <StudentFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          courseFilter={courseFilter}
          onCourseChange={handleCourseChange}
          courses={courseOptions}
        />
        <StudentTable
          students={paginatedStudents}
          onToggleBlock={handleToggleBlock}
          onOpenGrant={handleOpenGrant}
        />
        <StudentPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={filteredStudents.length}
          filteredCount={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
      <GrantAccessModal
        student={grantStudent}
        onClose={handleCloseGrant}
        onConfirm={handleConfirmGrant}
      />
    </div>
  )
}
