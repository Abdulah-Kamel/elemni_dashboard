"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface StudentPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filteredCount: number;
  onPageChange: (page: number) => void;
}

export function StudentPagination({
  currentPage,
  totalPages,
  totalCount,
  filteredCount,
  onPageChange,
}: StudentPaginationProps) {
  const t = useTranslations("student");

  const from = (currentPage - 1) * filteredCount + 1;
  const to = Math.min(currentPage * filteredCount, totalCount);

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-xs text-on-surface-muted">
        {t("showing", { from, to, total: totalCount })}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex size-8 items-center justify-center rounded-lg text-on-surface-muted transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40"
          aria-label={t("prev_page")}
        >
          <ChevronLeft className="size-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
              page === currentPage
                ? "bg-primary text-primary-foreground"
                : "text-on-surface-muted hover:bg-surface-muted"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex size-8 items-center justify-center rounded-lg text-on-surface-muted transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40"
          aria-label={t("next_page")}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
