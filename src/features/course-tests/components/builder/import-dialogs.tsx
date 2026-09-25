"use client"

import { useEffect, useId, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCourseTestsClient } from "../../client"
import type { BankQuestion, ExcelImportPreview, TestQuestion } from "../../types"
import { Segmented } from "./controls"
import { CONTROL, ENTER, ERROR_BOX, OUTLINE_BUTTON, PRIMARY_INK_BUTTON, SUCCESS_TEXT } from "./styles"

type ImportProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  testId: number
  courseId: number
  ensureAck: () => Promise<boolean>
  onImported: (questions: TestQuestion[]) => void
}

// ---------------------------------------------------------------------------
// Question bank

export function BankDialog({ open, onOpenChange, testId, courseId, ensureAck, onImported }: ImportProps) {
  const t = useTranslations("courseTests.builder.bank")
  const tb = useTranslations("courseTests.builder")
  const [scope, setScope] = useState<"course" | "all">("course")
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<BankQuestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [listRef] = useAutoAnimate<HTMLUListElement>({ duration: 160 })
  const searchId = useId()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const client = await getCourseTestsClient()
      const result = await client.listBank({ courseId: scope === "course" ? courseId : undefined, search: search.trim() || undefined })
      if (cancelled) return
      if (result.ok) {
        setItems(result.data)
        setError(null)
      } else setError(result.error)
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, scope, search, courseId])

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setSelected(new Set())
      setSearch("")
    }
  }

  const submit = async () => {
    if (selected.size === 0) return
    if (!(await ensureAck())) return
    setBusy(true)
    const client = await getCourseTestsClient()
    const result = await client.importFromBank(testId, [...selected])
    setBusy(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    onImported(result.data)
    toast.success(t("imported", { count: result.data.length }))
    close(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => close(next)}>
      <DialogContent className="gap-4 rounded-3xl p-6 sm:max-w-[42rem]">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-lg font-bold">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor={searchId} className="sr-only">
              {t("search")}
            </label>
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id={searchId} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("search")} className={cn(CONTROL, "ps-9 md:text-sm")} />
          </div>
          <div className="sm:w-64">
            <Segmented label={t("scope")} value={scope} onChange={setScope} options={[{ value: "course", label: t("scope_course") }, { value: "all", label: t("scope_all") }]} />
          </div>
        </div>
        <div className="max-h-[50dvh] min-h-40 overflow-y-auto">
          {error ? <p className={cn("rounded-xl p-3 text-sm", ERROR_BOX)}>{error}</p> : null}
          {!items && !error ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : null}
          {items && items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p> : null}
          <ul ref={listRef} className="flex flex-col gap-2">
            {items?.map((item) => {
              const checked = selected.has(item.id)
              return (
                <li key={item.id}>
                  <label className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors", checked ? "border-primary bg-muted" : "border-border hover:bg-muted/60")}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="size-5 shrink-0 accent-sky-700" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium" dir="auto">
                        {item.text}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tb(`types.${item.type}`)} · {t("points", { count: item.points })} · {t("used_in", { count: item.used_in_tests })}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" onClick={() => void submit()} disabled={selected.size === 0 || busy} className={PRIMARY_INK_BUTTON}>
            {t("add", { count: selected.size })}
          </Button>
          <Button type="button" variant="outline" onClick={() => close(false)} className={OUTLINE_BUTTON}>
            {tb("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Excel import: preview (per-row errors) → import the valid rows

export function ExcelImportDialog({ open, onOpenChange, testId, ensureAck, onImported }: ImportProps) {
  const t = useTranslations("courseTests.builder.excel")
  const tb = useTranslations("courseTests.builder")
  const locale = useLocale()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ExcelImportPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()

  const reset = () => {
    setFile(null)
    setPreview(null)
    setError(null)
  }

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const choose = async (next: File) => {
    setFile(next)
    setPreview(null)
    setError(null)
    setBusy(true)
    const client = await getCourseTestsClient()
    const result = await client.previewExcel(testId, next)
    setBusy(false)
    if (result.ok) setPreview(result.data)
    else setError(result.error)
  }

  const submit = async () => {
    if (!preview || preview.valid.length === 0) return
    if (!(await ensureAck())) return
    setBusy(true)
    const client = await getCourseTestsClient()
    const result = await client.importExcel(testId, preview.valid)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onImported(result.data)
    toast.success(t("imported", { count: result.data.length }))
    close(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => close(next)}>
      <DialogContent className="gap-4 rounded-3xl p-6 sm:max-w-[36rem]">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-lg font-bold">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <label htmlFor={inputId} className="sr-only">
          {t("file_label")}
        </label>
        <FileDropzone inputId={inputId} locale={locale} accept=".xlsx,.xls,.csv" selectedFile={file} onFileSelect={(next) => void choose(next)} onClear={reset} disabled={busy} description={t("accepted")} />
        {busy && !preview ? <Skeleton className="h-16 w-full rounded-xl" /> : null}
        {error ? (
          <p role="alert" className={cn("rounded-xl p-3 text-sm", ERROR_BOX)}>
            {error}
          </p>
        ) : null}
        {preview ? (
          <div className={cn("flex flex-col gap-3", ENTER)}>
            <p className={cn("text-sm font-semibold", SUCCESS_TEXT)}>{t("valid_rows", { count: preview.valid.length })}</p>
            {preview.errors.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-destructive">{t("invalid_rows", { count: preview.errors.length })}</p>
                <ul className="max-h-56 overflow-y-auto rounded-xl border border-border">
                  {preview.errors.map((row) => (
                    <li key={row.row} className="flex gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0">
                      <span className="shrink-0 font-semibold tabular-nums">{t("row", { row: row.row })}</span>
                      <span className="text-muted-foreground">{row.errors.join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" onClick={() => void submit()} disabled={!preview || preview.valid.length === 0 || busy} className={PRIMARY_INK_BUTTON}>
            {t("import", { count: preview?.valid.length ?? 0 })}
          </Button>
          <Button type="button" variant="outline" onClick={() => close(false)} className={OUTLINE_BUTTON}>
            {tb("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
