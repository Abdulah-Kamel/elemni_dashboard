"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Placeholder } from "@/features/shell/components/placeholder";
import { useTeachersQuery } from "@/features/admin/hooks/use-teachers-queries";
import { TeacherCreateDialog } from "@/features/admin/components/teacher-create-dialog";
import { TeacherDeleteDialog } from "@/features/admin/components/teacher-delete-dialog";

const ITEMS_PER_PAGE = 10;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const CALL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  done: { label: "Done", color: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600" },
};

const INTEREST_MAP: Record<string, { label: string; color: string }> = {
  high: { label: "مرتب", color: "bg-primary-tint text-primary" },
  medium: { label: "موزّط", color: "bg-amber-100 text-amber-700" },
  low: { label: "مخصّص", color: "bg-gray-100 text-gray-600" },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  signed_up: { label: "Signed Up", color: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600" },
};

export function TeachersList() {
  const t = useTranslations("admin");
  const { data, isLoading, isError } = useTeachersQuery();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTeacher, setDeleteTeacher] = useState<{ id: number; name: string } | null>(null);

  const teachers = data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.toLowerCase();
    return teachers.filter(
      (tchr) =>
        tchr.name.toLowerCase().includes(q) ||
        tchr.email.toLowerCase().includes(q) ||
        tchr.subjects?.some((s) => s.name.toLowerCase().includes(q)),
    );
  }, [teachers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const paginated = filtered.slice((pageSafe - 1) * ITEMS_PER_PAGE, pageSafe * ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return <Placeholder state="error" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md text-headline-md--line-height font-semibold text-foreground">
            {t("title_teachers")}
          </h1>
          <p className="mt-1 text-body-md text-body-md--line-height text-on-surface-muted">
            {filtered.length} {filtered.length === 1 ? "teacher" : "teachers"}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          {t("btn_new_teacher")}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("search_placeholder")}
            className="h-10 pe-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-start text-label-sm text-label-sm--line-height font-semibold text-on-surface-muted">
              <th className="px-4 py-3">{t("table_name")}</th>
              <th className="px-4 py-3">{t("table_email")}</th>
              <th className="px-4 py-3">{t("table_subjects")}</th>
              <th className="px-4 py-3">{t("field_call_status")}</th>
              <th className="px-4 py-3">{t("field_interest_level")}</th>
              <th className="px-4 py-3">{t("table_level")}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((tchr) => {
              const callBadge = CALL_STATUS_MAP[tchr.call_status ?? ""];
              const interestBadge = INTEREST_MAP[tchr.interest_level ?? ""];
              const statusBadge = STATUS_MAP[tchr.status ?? ""];

              return (
                <tr key={tchr.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 bg-primary-tint text-primary">
                        <AvatarFallback className="text-label-sm font-semibold">
                          {initials(tchr.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{tchr.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-foreground">{tchr.email}</p>
                      {tchr.phone && (
                        <p className="text-label-sm text-on-surface-muted">{tchr.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tchr.subjects?.map((s) => (
                        <Badge key={s.id} variant="outline" className="text-xs">
                          {s.name}
                        </Badge>
                      ))}
                      {tchr.grades?.map((g) => (
                        <Badge key={g.id} variant="secondary" className="text-xs">
                          {g.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {callBadge ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${callBadge.color}`}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {callBadge.label}
                      </span>
                    ) : (
                      <span className="text-on-surface-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {interestBadge ? (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${interestBadge.color}`}>
                        {interestBadge.label}
                      </span>
                    ) : (
                      <span className="text-on-surface-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {statusBadge ? (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    ) : (
                      <span className="text-on-surface-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-label-sm text-on-surface-muted">
            {(pageSafe - 1) * ITEMS_PER_PAGE + 1}–{Math.min(pageSafe * ITEMS_PER_PAGE, filtered.length)} / {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1}>
              <ChevronRight className="size-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === pageSafe ? "default" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}>
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <TeacherCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TeacherDeleteDialog teacher={deleteTeacher} open={!!deleteTeacher} onOpenChange={() => setDeleteTeacher(null)} />
    </div>
  );
}
