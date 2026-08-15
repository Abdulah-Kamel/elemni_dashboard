"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useTaxonomyMutations } from "@/features/admin/hooks/use-taxonomy-mutations"
import { useTaxonomyQuery } from "@/features/admin/hooks/use-taxonomy-queries"

type Item = { id: number; name: string; slug?: string; level?: string; grades?: { id: number }[]; streams?: { id: number }[] }

type Props = {
  kind: "grades" | "streams" | "subjects"
  fields: { key: string; labelKey: string; required?: boolean }[]
  item: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaxonomyEditDialog({
  kind,
  fields,
  item,
  open,
  onOpenChange,
}: Props) {
  const t = useTranslations("admin")
  const [data, setData] = useState<Record<string, unknown>>(() =>
    item
      ? { ...Object.fromEntries(
          fields.map((field) => [
            field.key,
            String(item[field.key as keyof Item] ?? ""),
          ])
        ), grade_ids: item.grades?.map((grade) => grade.id) ?? [], stream_ids: item.streams?.map((stream) => stream.id) ?? [] }
      : {}
  )
  const { update } = useTaxonomyMutations(kind)
  const grades = useTaxonomyQuery("grades")
  const streams = useTaxonomyQuery("streams")
  const toggle = (key: "grade_ids" | "stream_ids", id: number) => setData((previous) => { const values = (previous[key] as number[] | undefined) ?? []; return { ...previous, [key]: values.includes(id) ? values.filter((value) => value !== id) : [...values, id] } })

  const handleSubmit = async () => {
    if (!item) return
    try {
      const outcome = await update.mutateAsync({ id: item.id, data })
      if (outcome.success) {
        toast.success(t("updated"))
        onOpenChange(false)
      } else {
        toast.error(outcome.error.message)
      }
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Error"
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("dialog_edit_title", { kind: t(`title_${kind}`) })}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          {fields.map((f) => (
            <Input
              key={f.key}
              placeholder={t(f.labelKey)}
              value={String(data[f.key] ?? "")}
              onChange={(e) =>
                setData((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            />
          ))}
          {kind === "subjects" && <><div><p className="mb-2 text-sm font-medium">{t("table_grades")}</p><div className="flex flex-wrap gap-2">{grades.data?.map((grade) => <Button type="button" size="sm" variant={(data.grade_ids as number[] | undefined)?.includes(grade.id) ? "default" : "outline"} key={grade.id} onClick={() => toggle("grade_ids", grade.id)}>{grade.name}</Button>)}</div></div><div><p className="mb-2 text-sm font-medium">{t("title_streams")}</p><div className="flex flex-wrap gap-2">{streams.data?.map((stream) => <Button type="button" size="sm" variant={(data.stream_ids as number[] | undefined)?.includes(stream.id) ? "default" : "outline"} key={stream.id} onClick={() => toggle("stream_ids", stream.id)}>{stream.name}</Button>)}</div></div></>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            {t("btn_cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={update.isPending}
            className="gap-1.5"
          >
            {update.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {t("btn_save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
