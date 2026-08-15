"use client"

import { Lock, LockOpen, Key, Edit } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface Student {
  id: number
  name: string
  initials: string
  course: string
  enrollmentDate: string
  progress: number
  status: "active" | "blocked" | "completed"
}

interface StudentTableProps {
  students: Student[]
  onToggleBlock: (id: number) => void
  onOpenGrant: (student: Student) => void
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success-tint text-success",
  blocked: "bg-error-tint text-error",
  completed: "bg-surface-strong text-on-surface-muted",
}

export function StudentTable({
  students,
  onToggleBlock,
  onOpenGrant,
}: StudentTableProps) {
  const t = useTranslations("student")

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <Table>
        <TableHeader className="bg-surface-muted text-xs font-bold text-on-surface-muted">
          <TableRow>
            <TableHead className="px-4 py-3">{t("name")}</TableHead>
            <TableHead className="px-4 py-3">{t("course")}</TableHead>
            <TableHead className="px-4 py-3">{t("enrollment_date")}</TableHead>
            <TableHead className="px-4 py-3">{t("progress")}</TableHead>
            <TableHead className="px-4 py-3">{t("status")}</TableHead>
            <TableHead className="px-4 py-3">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="px-4 py-8 text-center text-xs text-on-surface-muted"
              >
                {t("no_results")}
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="px-4 py-3">
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
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {student.course}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                  {student.enrollmentDate}
                </TableCell>
                <TableCell className="px-4 py-3">
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
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[student.status]}`}
                  >
                    {t(`status_${student.status}`)}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onToggleBlock(student.id)}
                      title={
                        student.status === "blocked" ? t("unblock") : t("block")
                      }
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
                    <Button variant="ghost" size="icon-xs" title={t("edit")}>
                      <Edit className="size-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
