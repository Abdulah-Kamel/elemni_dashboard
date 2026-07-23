"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface StudentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

const FILTERS = ["all", "active", "blocked", "completed"] as const;

export function StudentFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: StudentFiltersProps) {
  const t = useTranslations("student");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted"
          aria-hidden="true"
        />
        <Input
          placeholder={t("search_placeholder")}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-border bg-surface ps-8"
        />
      </div>
      <div className="flex gap-1.5" role="group" aria-label={t("filter_all")}>
        {FILTERS.map((filter) => {
          const isActive = statusFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => onStatusChange(filter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-border text-on-surface-muted hover:bg-surface-strong"
              }`}
            >
              {t(`filter_${filter}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
