"use client"

import { useTranslations } from "next-intl"
import { DashboardPagination } from "@/components/dashboard-pagination"

interface StudentPaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  filteredCount: number
  onPageChange: (page: number) => void
}

export function StudentPagination({
  currentPage,
  totalPages,
  totalCount,
  filteredCount,
  onPageChange,
}: StudentPaginationProps) {
  const t = useTranslations("student")

  return (
    <DashboardPagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalCount}
      pageSize={filteredCount}
      onPageChange={onPageChange}
      labels={{
        previous: t("prev_page"),
        next: t("next_page"),
        page: (page, pages) => t("pagination", { page, pages }),
        summary: (from, to, total) => t("showing", { from, to, total }),
      }}
    />
  )
}
