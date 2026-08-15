"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLocale } from "next-intl"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

type PaginationLabels = {
  next: string
  previous: string
  page: (page: number, pages: number) => string
  summary?: (from: number, to: number, total: number) => string
}

type DashboardPaginationProps = {
  className?: string
  currentPage: number
  onPageChange: (page: number) => void
  pageSize?: number
  totalItems?: number
  totalPages: number
  labels: PaginationLabels
}

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis-end", totalPages] as const
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis-start",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ] as const
}

export function DashboardPagination({
  className,
  currentPage,
  onPageChange,
  pageSize,
  totalItems,
  totalPages,
  labels,
}: DashboardPaginationProps) {
  const locale = useLocale()
  const isRtl = locale === "ar"
  const hasMultiplePages = totalPages > 1

  if (!hasMultiplePages && totalItems === undefined) {
    return null
  }

  const clampedPage = Math.min(
    Math.max(currentPage, 1),
    Math.max(totalPages, 1)
  )
  const canGoPrevious = clampedPage > 1
  const canGoNext = clampedPage < totalPages
  const pageItems = hasMultiplePages
    ? getPageItems(clampedPage, totalPages)
    : []
  const pageLabel = labels.page(clampedPage, Math.max(totalPages, 1))
  const summary =
    labels.summary && totalItems && totalItems > 0 && pageSize
      ? labels.summary(
          (clampedPage - 1) * pageSize + 1,
          Math.min(clampedPage * pageSize, totalItems),
          totalItems
        )
      : undefined

  if (!hasMultiplePages && !summary) {
    return null
  }

  function goTo(nextPage: number) {
    const clampedNextPage = Math.min(Math.max(nextPage, 1), totalPages)
    if (clampedNextPage !== clampedPage) {
      onPageChange(clampedNextPage)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {summary ? (
        <p className="text-xs text-on-surface-muted">{summary}</p>
      ) : (
        <div className="hidden sm:block" />
      )}

      {hasMultiplePages ? (
        <Pagination className="mx-0 w-full sm:w-auto sm:justify-end">
          <PaginationContent className="w-full justify-between sm:w-auto sm:justify-end">
            <PaginationItem>
              <PaginationPrevious
                aria-label={labels.previous}
                disabled={!canGoPrevious}
                onClick={() => goTo(clampedPage - 1)}
              >
                {isRtl ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronLeft className="size-4" />
                )}
                <span className="hidden sm:inline">{labels.previous}</span>
              </PaginationPrevious>
            </PaginationItem>

            <PaginationItem className="sm:hidden">
              <span className="inline-flex h-7 min-w-24 items-center justify-center rounded-lg border border-border bg-surface-muted px-3 text-xs font-medium text-on-surface-muted">
                {pageLabel}
              </span>
            </PaginationItem>

            {pageItems.map((item) => (
              <PaginationItem
                key={typeof item === "number" ? item : `${item}-${clampedPage}`}
                className="hidden sm:list-item"
              >
                {typeof item === "number" ? (
                  <PaginationLink
                    aria-label={labels.page(item, totalPages)}
                    isActive={item === clampedPage}
                    onClick={() => goTo(item)}
                  >
                    {item}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                aria-label={labels.next}
                disabled={!canGoNext}
                onClick={() => goTo(clampedPage + 1)}
              >
                <span className="hidden sm:inline">{labels.next}</span>
                {isRtl ? (
                  <ChevronLeft className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
