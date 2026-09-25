"use client"

import { useId, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, Download, Loader2 } from "lucide-react"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { callClient, notifyCourseTestsChanged } from "../hooks"
import { EXCEL_ACCEPT, EXCEL_MAX_BYTES } from "../schema"
import { ERROR_TEXT, SUCCESS_TEXT, toCsv } from "../ui-utils"
import type { ExcelImportPreview } from "../types"
import { builderPath } from "./new-test-options"

const ALLOWED_EXTENSIONS = [".xlsx", ".csv"]

/**
 * Builds the downloadable template. No spreadsheet library is bundled, so the
 * template is a UTF-8 (BOM) CSV that Excel opens directly; the API accepts
 * both .csv and .xlsx uploads with the same columns.
 */
export function buildTemplateCsv(columns: string[], examples: string[][]): string {
  return toCsv([columns, ...examples])
}

type Step = { kind: "upload"; error?: string } | { kind: "checking" } | { kind: "preview"; preview: ExcelImportPreview; fileName: string } | { kind: "importing"; preview: ExcelImportPreview; fileName: string }

export function ExcelImportDialog({ courseId, open, onOpenChange }: { courseId: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("courseTests.excel")
  const tTypes = useTranslations("courseTests.types")
  const tActions = useTranslations("courseTests.row_actions")
  const locale = useLocale()
  const router = useRouter()
  const id = useId()
  const [step, setStep] = useState<Step>({ kind: "upload" })
  const [file, setFile] = useState<File | null>(null)
  // The draft that receives the import; created on first upload, removed if the dialog is abandoned.
  const draftRef = useRef<number | null>(null)
  const busy = step.kind === "checking" || step.kind === "importing"

  function downloadTemplate() {
    const csv = buildTemplateCsv(t.raw("columns") as string[], t.raw("examples") as string[][])
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = t("template_name")
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function check(selected: File) {
    setFile(selected)
    const name = selected.name.toLowerCase()
    if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) return setStep({ kind: "upload", error: t("wrong_type") })
    if (selected.size > EXCEL_MAX_BYTES) return setStep({ kind: "upload", error: t("too_large") })
    setStep({ kind: "checking" })
    if (draftRef.current === null) {
      const created = await callClient((client) => client.createTest(courseId))
      if (!created.ok) return setStep({ kind: "upload", error: created.error })
      draftRef.current = created.data.id
    }
    const testId = draftRef.current
    const result = await callClient((client) => client.previewExcel(testId, selected))
    if (!result.ok) return setStep({ kind: "upload", error: result.error })
    setStep({ kind: "preview", preview: result.data, fileName: selected.name })
  }

  async function runImport() {
    if (step.kind !== "preview" || draftRef.current === null) return
    const testId = draftRef.current
    setStep({ ...step, kind: "importing" })
    const result = await callClient((client) => client.importExcel(testId, step.preview.valid))
    if (!result.ok) {
      toast.error(result.error)
      setStep({ ...step, kind: "preview" })
      return
    }
    toast.success(t("done", { count: result.data.length }))
    draftRef.current = null
    notifyCourseTestsChanged()
    close(false)
    router.push(builderPath(courseId, testId) as never)
  }

  function close(discardDraft: boolean) {
    const draft = draftRef.current
    draftRef.current = null
    if (discardDraft && draft !== null) void callClient((client) => client.deleteTest(draft))
    setStep({ kind: "upload" })
    setFile(null)
    onOpenChange(false)
  }

  const preview = step.kind === "preview" || step.kind === "importing" ? step.preview : null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        if (!next) close(true)
        else onOpenChange(true)
      }}
    >
      <DialogContent className="sm:max-w-[42rem]">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {preview === null ? (
          <div key="upload" className="flex animate-fade-in flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="outline" className="h-11 gap-2 px-4" onClick={downloadTemplate}>
                  <Download className="size-4" aria-hidden="true" />
                  {t("template")}
                </Button>
                <span className="text-xs text-on-surface-muted">{t("template_hint")}</span>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-muted">{t("rules")}</p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-file`} className="text-sm font-medium">
                {t("file_label")}
              </label>
              <FileDropzone
                inputId={`${id}-file`}
                locale={locale}
                accept={EXCEL_ACCEPT}
                selectedFile={file}
                disabled={step.kind === "checking"}
                description={t("file_hint")}
                error={step.kind === "upload" ? step.error : undefined}
                onFileSelect={(selected) => void check(selected)}
                onClear={() => {
                  setFile(null)
                  setStep({ kind: "upload" })
                }}
              />
              {step.kind === "checking" && (
                <p className="flex items-center gap-2 text-sm text-on-surface-muted" role="status">
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  {t("checking")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div key="preview" className="flex animate-fade-in flex-col gap-4">
            <h3 className="text-sm font-semibold">
              {t("preview_title")} · <span className="font-normal text-on-surface-muted">{step.kind !== "upload" && step.kind !== "checking" ? step.fileName : ""}</span>
            </h3>
            <div className="grid grid-cols-2 gap-3" role="status">
              <div className="flex items-center gap-2 rounded-xl bg-success-tint p-3">
                <CheckCircle2 className={cn("size-5", SUCCESS_TEXT)} aria-hidden="true" />
                <span className={cn("text-sm font-semibold tabular-nums", SUCCESS_TEXT)}>{t("valid_count", { count: preview.valid.length })}</span>
              </div>
              <div className={cn("flex items-center gap-2 rounded-xl p-3", preview.errors.length ? "bg-error-tint" : "bg-surface-muted")}>
                <AlertTriangle className={cn("size-5", preview.errors.length ? ERROR_TEXT : "text-on-surface-muted")} aria-hidden="true" />
                <span className={cn("text-sm font-semibold tabular-nums", preview.errors.length ? ERROR_TEXT : "text-on-surface-muted")}>{t("error_count", { count: preview.errors.length })}</span>
              </div>
            </div>

            <div className="flex max-h-[42dvh] flex-col gap-3 overflow-y-auto pe-1">
              {preview.errors.length > 0 && (
                <section aria-label={t("error_count", { count: preview.errors.length })} className="flex flex-col gap-2">
                  <p className="text-xs text-on-surface-muted">{t("errors_note")}</p>
                  <ul className="flex flex-col gap-2">
                    {preview.errors.map((rowError) => (
                      <li key={rowError.row} className="rounded-xl border border-error/30 bg-error-tint/50 p-3">
                        <p className={cn("text-sm font-semibold tabular-nums", ERROR_TEXT)}>{t("row", { row: rowError.row })}</p>
                        <ul className="mt-1 list-disc ps-5 text-sm">
                          {rowError.errors.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {preview.valid.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-on-surface-muted">{t("valid_list")}</h4>
                  <ol className="flex flex-col gap-1.5">
                    {preview.valid.map((question, index) => (
                      <li key={index} className="flex items-start gap-2 rounded-lg border border-border p-2.5 text-sm">
                        <span className="min-w-6 text-on-surface-muted tabular-nums">{index + 1}.</span>
                        <span className="min-w-0 flex-1">{question.text}</span>
                        <span className="shrink-0 rounded-full bg-surface-strong px-2 py-0.5 text-xs text-on-surface-muted">{tTypes(question.type)}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="h-11 px-4" disabled={busy} onClick={() => close(true)}>
            {tActions("cancel")}
          </Button>
          {preview !== null && (
            <>
              <Button
                variant="outline"
                className="h-11 px-4"
                disabled={busy}
                onClick={() => {
                  setFile(null)
                  setStep({ kind: "upload" })
                }}
              >
                {t("choose_other")}
              </Button>
              <Button className="h-11 gap-2 px-5" disabled={busy || preview.valid.length === 0} aria-busy={step.kind === "importing"} onClick={() => void runImport()}>
                {step.kind === "importing" && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {step.kind === "importing" ? t("importing") : t("import", { count: preview.valid.length })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
