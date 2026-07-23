"use client";

import { Lock, LockOpen, Key, Edit } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface Student {
  id: number;
  name: string;
  initials: string;
  course: string;
  enrollmentDate: string;
  progress: number;
  status: "active" | "blocked" | "completed";
}

interface StudentTableProps {
  students: Student[];
  onToggleBlock: (id: number) => void;
  onOpenGrant: (student: Student) => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success-tint text-success",
  blocked: "bg-error-tint text-error",
  completed: "bg-surface-strong text-on-surface-muted",
};

export function StudentTable({
  students,
  onToggleBlock,
  onOpenGrant,
}: StudentTableProps) {
  const t = useTranslations("student");

  if (students.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface shadow-xs">
        <p className="py-8 text-center text-xs text-on-surface-muted">
          {t("no_results")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-muted text-xs font-bold text-on-surface-muted">
            <th className="px-4 py-3 text-start">{t("name")}</th>
            <th className="px-4 py-3 text-start">{t("course")}</th>
            <th className="px-4 py-3 text-start">{t("enrollment_date")}</th>
            <th className="px-4 py-3 text-start">{t("progress")}</th>
            <th className="px-4 py-3 text-start">{t("status")}</th>
            <th className="px-4 py-3 text-start">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className="border-t border-border transition-colors hover:bg-surface-muted"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8 bg-primary-tint text-primary">
                    <AvatarFallback className="text-xs font-semibold">
                      {student.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {student.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-on-surface-muted">
                {student.course}
              </td>
              <td className="px-4 py-3 text-sm text-on-surface-muted">
                {student.enrollmentDate}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-border">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-muted">
                    {student.progress}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[student.status]}`}
                >
                  {t(`status_${student.status}`)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onToggleBlock(student.id)}
                    title={student.status === "blocked" ? t("unblock") : t("block")}
                  >
                    {student.status === "blocked" ? (
                      <LockOpen className="size-3" />
                    ) : (
                      <Lock className="size-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onOpenGrant(student)}
                    title={t("grant_key")}
                  >
                    <Key className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    title={t("edit")}
                  >
                    <Edit className="size-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
