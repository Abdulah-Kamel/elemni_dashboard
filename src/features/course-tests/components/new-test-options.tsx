"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Copy, Database, FilePlus2, Loader2, Plus, Upload } from "lucide-react"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { callClient, notifyCourseTestsChanged } from "../hooks"
import type { ActionResult } from "../types"
import { BankPickerDialog } from "./bank-picker-dialog"
import { CopyTestDialog, type CourseOption } from "./copy-test-dialog"
import { ExcelImportDialog } from "./excel-import-dialog"

export const builderPath = (courseId: number, testId: number) => `/courses/${courseId}/tests/${testId}`

/**
 * Creates a draft, then fills it. If filling fails the empty draft is removed
 * again so a failed import doesn't leave clutter behind.
 */
export async function createDraftAndFill<T>(courseId: number, fill?: (testId: number) => Promise<ActionResult<T>>): Promise<ActionResult<{ id: number }>> {
  const created = await callClient((client) => client.createTest(courseId))
  if (!created.ok || !fill) return created
  const filled = await fill(created.data.id)
  if (!filled.ok) {
    await callClient((client) => client.deleteTest(created.data.id))
    return filled
  }
  return created
}

export function useCreateBlankTest(courseId: number) {
  const t = useTranslations("courseTests.new_test")
  const router = useRouter()
  const [pending, setPending] = useState(false)
  async function create() {
    if (pending) return
    setPending(true)
    const result = await createDraftAndFill(courseId)
    if (!result.ok) {
      setPending(false)
      toast.error(result.error)
      return
    }
    toast.success(t("created"))
    notifyCourseTestsChanged()
    router.push(builderPath(courseId, result.data.id) as never)
  }
  return { create, pending }
}

export function NewTestButton({ courseId }: { courseId: number }) {
  const t = useTranslations("courseTests")
  const { create, pending } = useCreateBlankTest(courseId)
  return (
    <Button className="h-12 gap-2 rounded-[14px] px-5 text-[15px] font-semibold" onClick={() => void create()} disabled={pending} aria-busy={pending}>
      {pending ? <Loader2 className="size-4.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Plus className="size-4.5" aria-hidden="true" />}
      {pending ? t("new_test.creating") : t("page.new_test")}
    </Button>
  )
}

type Dialog = "bank" | "copy" | "excel" | null

export function NewTestOptions({ courseId, courses }: { courseId: number; courses: CourseOption[] }) {
  const t = useTranslations("courseTests.new_test")
  const { create, pending } = useCreateBlankTest(courseId)
  const [dialog, setDialog] = useState<Dialog>(null)

  const options = [
    { id: "blank", icon: FilePlus2, title: t("blank"), hint: t("blank_hint"), onClick: () => void create(), primary: true },
    { id: "bank", icon: Database, title: t("bank"), hint: t("bank_hint"), onClick: () => setDialog("bank") },
    { id: "copy", icon: Copy, title: t("copy"), hint: t("copy_hint"), onClick: () => setDialog("copy") },
    { id: "excel", icon: Upload, title: t("excel"), hint: t("excel_hint"), onClick: () => setDialog("excel") },
  ]

  return (
    <section aria-labelledby="new-test-title" className="flex animate-slide-up animate-stagger-4 flex-col gap-3.5 rounded-[20px] border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="new-test-title" className="text-base font-semibold">
          {t("title")}
        </h2>
        <span className="text-xs text-on-surface-muted">{t("hint")}</span>
      </div>
      <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {options.map(({ id, icon: Icon, title, hint, onClick, primary }) => {
          const busy = id === "blank" && pending
          return (
            <li key={id}>
              <button
                type="button"
                onClick={onClick}
                disabled={busy}
                aria-busy={busy}
                className={cn(
                  "group flex h-full min-h-28 w-full flex-col items-start gap-2 rounded-2xl border-2 p-4 text-start transition-[border-color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 disabled:opacity-70",
                  primary ? "border-foreground bg-primary-tint shadow-[3px_3px_0_var(--color-foreground)]" : "border-border hover:border-primary/50 hover:bg-surface-muted",
                )}
              >
                <span className={cn("grid size-9 place-items-center rounded-[10px]", primary ? "bg-primary text-primary-foreground" : "bg-surface-strong text-primary")}>
                  {busy ? <Loader2 className="size-4.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Icon className="size-4.5" aria-hidden="true" />}
                </span>
                <span className="text-sm font-semibold">{busy ? t("creating") : title}</span>
                <span className={cn("text-xs", primary ? "text-foreground/75" : "text-on-surface-muted")}>{hint}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <BankPickerDialog courseId={courseId} open={dialog === "bank"} onOpenChange={(open) => setDialog(open ? "bank" : null)} />
      <CopyTestDialog courseId={courseId} courses={courses} open={dialog === "copy"} onOpenChange={(open) => setDialog(open ? "copy" : null)} />
      <ExcelImportDialog courseId={courseId} open={dialog === "excel"} onOpenChange={(open) => setDialog(open ? "excel" : null)} />
    </section>
  )
}
