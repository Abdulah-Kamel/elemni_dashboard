"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Plus, Pencil, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Placeholder } from "@/features/shell/components/placeholder"
import { useTaxonomyQuery } from "@/features/admin/hooks/use-taxonomy-queries"
import { TaxonomyCreateDialog } from "@/features/admin/components/taxonomy-create-dialog"
import { TaxonomyEditDialog } from "@/features/admin/components/taxonomy-edit-dialog"
import { TaxonomyDeleteDialog } from "@/features/admin/components/taxonomy-delete-dialog"
import type { GradeOut, StreamOut } from "@/features/course-management/schema"

type Item = {
  id: number
  name: string
  slug?: string
  level?: string
  grades?: GradeOut[]
  streams?: StreamOut[]
}

type Props = {
  kind: "grades" | "streams" | "subjects"
  titleKey: string
  fields: { key: string; labelKey: string; required?: boolean }[]
}

function getScalarCellValue(item: Item, key: string) {
  const value = item[key as keyof Item]

  if (typeof value === "string" || typeof value === "number") {
    return value
  }

  return "—"
}

export function TaxonomyManager({ kind, titleKey, fields }: Props) {
  const t = useTranslations("admin")
  const { data, isLoading, isError } = useTaxonomyQuery(kind)
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [deleteItem, setDeleteItem] = useState<Item | null>(null)
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [streamFilter, setStreamFilter] = useState("all")
  const items = useMemo(() => (data ?? []) as Item[], [data])
  const levelItems = useMemo(
    () => [
      { value: "all", label: t("all_levels") },
      ...[...new Set(items.map((item) => item.level).filter(Boolean))].map(
        (level) => ({ value: level as string, label: level as string })
      ),
    ],
    [items, t]
  )
  const subjectGradeItems = useMemo(
    () => [
      { value: "all", label: t("all_grades") },
      ...Array.from(
        new Map(
          items
            .flatMap((item) => item.grades ?? [])
            .map((grade) => [grade.id, grade] as const)
        ).values()
      ).map((grade) => ({ value: String(grade.id), label: grade.name })),
    ],
    [items, t]
  )
  const subjectStreamItems = useMemo(
    () => [
      { value: "all", label: t("all_streams") },
      ...Array.from(
        new Map(
          items
            .flatMap((item) => item.streams ?? [])
            .map((stream) => [stream.id, stream] as const)
        ).values()
      ).map((stream) => ({ value: String(stream.id), label: stream.name })),
    ],
    [items, t]
  )
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()

    return items.filter((item) => {
      const searchPool = [
        ...fields.map((field) => String(item[field.key as keyof Item] ?? "")),
        ...(item.grades?.map((grade) => grade.name) ?? []),
        ...(item.streams?.map((stream) => stream.name) ?? []),
      ]
      const matchesSearch =
        !term || searchPool.some((value) => value.toLowerCase().includes(term))
      const matchesLevel =
        kind !== "grades" || levelFilter === "all" || item.level === levelFilter
      const matchesGrade =
        kind !== "subjects" ||
        gradeFilter === "all" ||
        item.grades?.some((grade) => String(grade.id) === gradeFilter)
      const matchesStream =
        kind !== "subjects" ||
        streamFilter === "all" ||
        item.streams?.some((stream) => String(stream.id) === streamFilter)

      return matchesSearch && matchesLevel && matchesGrade && matchesStream
    })
  }, [fields, gradeFilter, items, kind, levelFilter, search, streamFilter])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError) {
    return <Placeholder state="error" />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-md text-headline-md--line-height font-semibold text-foreground">
          {t(titleKey)}
        </h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          {t("btn_new")}
        </Button>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-md shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
            <Input
              className="ps-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("search_taxonomy")}
            />
          </div>

          {kind === "grades" ? (
            <Select
              value={levelFilter}
              onValueChange={(value) => setLevelFilter(value ?? "all")}
              items={levelItems}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t("all_levels")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {levelItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : null}

          {kind === "subjects" ? (
            <>
              <Select
                value={gradeFilter}
                onValueChange={(value) => setGradeFilter(value ?? "all")}
                items={subjectGradeItems}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder={t("all_grades")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {subjectGradeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={streamFilter}
                onValueChange={(value) => setStreamFilter(value ?? "all")}
                items={subjectStreamItems}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder={t("all_streams")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {subjectStreamItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </>
          ) : null}
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <Table className="text-sm">
          <TableHeader className="border-b border-border bg-surface-muted text-start text-label-sm text-label-sm--line-height font-semibold text-on-surface-muted">
            <TableRow>
              {fields.map((f) => (
                <TableHead key={f.key} className="px-4 py-3">
                  {t(f.labelKey)}
                </TableHead>
              ))}
              <TableHead className="px-4 py-3 text-end">
                {t("table_actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={fields.length + 1}
                  className="px-4 py-8 text-center text-xs text-on-surface-muted"
                >
                  {t("no_results")}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  {fields.map((f) => (
                    <TableCell
                      key={f.key}
                      className="px-4 py-3 text-foreground"
                    >
                      {getScalarCellValue(item, f.key)}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setEditItem(item)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TaxonomyCreateDialog
        kind={kind}
        fields={fields}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <TaxonomyEditDialog
        key={editItem?.id ?? "closed"}
        kind={kind}
        fields={fields}
        item={editItem}
        open={!!editItem}
        onOpenChange={() => setEditItem(null)}
      />
      <TaxonomyDeleteDialog
        kind={kind}
        item={deleteItem}
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
      />
    </div>
  )
}
