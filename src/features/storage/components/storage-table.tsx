"use client"

import { useState, useMemo } from "react"
import { Search, BookOpen } from "lucide-react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CourseStorageRow {
  id: number
  name: string
  videos: number
  storageSize: string
  bandwidth: string
  status: "published" | "draft"
}

const MOCK_COURSES: CourseStorageRow[] = [
  {
    id: 1,
    name: "Algebra I",
    videos: 24,
    storageSize: "156.2 GB",
    bandwidth: "2.1 TB",
    status: "published",
  },
  {
    id: 2,
    name: "Geometry",
    videos: 18,
    storageSize: "98.5 GB",
    bandwidth: "1.4 TB",
    status: "published",
  },
  {
    id: 3,
    name: "Calculus",
    videos: 30,
    storageSize: "210.8 GB",
    bandwidth: "3.2 TB",
    status: "draft",
  },
  {
    id: 4,
    name: "Trigonometry",
    videos: 12,
    storageSize: "67.3 GB",
    bandwidth: "0.9 TB",
    status: "published",
  },
  {
    id: 5,
    name: "Statistics",
    videos: 20,
    storageSize: "110.1 GB",
    bandwidth: "1.8 TB",
    status: "draft",
  },
]

const STATUS_STYLES: Record<string, string> = {
  published: "bg-success-tint text-success",
  draft: "bg-surface-strong text-on-surface-muted",
}

export function StorageTable() {
  const t = useTranslations("storage")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | CourseStorageRow["status"]
  >("all")
  const statusItems = [
    { value: "all", label: t("all_statuses") },
    { value: "published", label: t("published") },
    { value: "draft", label: t("draft") },
  ]

  const filtered = useMemo(() => {
    return MOCK_COURSES.filter((course) => {
      const matchesSearch =
        !searchTerm ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || course.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter])

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-xs">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
          <Input
            placeholder={t("search_courses")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-border bg-surface ps-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "all" | CourseStorageRow["status"])
          }
          items={statusItems}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t("all_statuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {statusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-surface-muted text-xs font-bold text-on-surface-muted">
            <TableRow>
              <TableHead className="px-4 py-3">{t("course_name")}</TableHead>
              <TableHead className="px-4 py-3">{t("videos")}</TableHead>
              <TableHead className="px-4 py-3">{t("storage")}</TableHead>
              <TableHead className="px-4 py-3">{t("bandwidth")}</TableHead>
              <TableHead className="px-4 py-3">{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-4 py-8 text-center text-xs text-on-surface-muted"
                >
                  {t("no_results")}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary-tint text-primary">
                        <BookOpen className="size-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {course.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                    {course.videos}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                    {course.storageSize}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-on-surface-muted">
                    {course.bandwidth}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[course.status]}`}
                    >
                      {t(course.status)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
