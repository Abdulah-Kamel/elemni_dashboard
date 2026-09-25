"use client"

import { useEffect, useId, useState } from "react"
import { useTranslations } from "next-intl"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { toast } from "sonner"
import { Loader2, Search } from "lucide-react"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { callClient, notifyCourseTestsChanged } from "../hooks"
import type { BankQuestion } from "../types"
import { builderPath, createDraftAndFill } from "./new-test-options"

type Mode = "pick" | "random"

export function BankPickerDialog({ courseId, open, onOpenChange }: { courseId: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("courseTests.bank")
  const tTypes = useTranslations("courseTests.types")
  const tActions = useTranslations("courseTests.row_actions")
  const router = useRouter()
  const id = useId()
  const [listRef] = useAutoAnimate<HTMLUListElement>({ duration: 180 })
  const [mode, setMode] = useState<Mode>("pick")
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [questions, setQuestions] = useState<BankQuestion[] | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [count, setCount] = useState("5")
  const [working, setWorking] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    callClient((client) => client.listBank({ courseId, search: debounced || undefined })).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setLoadError(result.error)
        return
      }
      setLoadError(null)
      setQuestions(result.data)
      if (!debounced) setTotal(result.data.length)
    })
    return () => {
      cancelled = true
    }
  }, [open, courseId, debounced])

  function reset() {
    setMode("pick")
    setSearch("")
    setDebounced("")
    setQuestions(null)
    setTotal(null)
    setSelected(new Set())
    setCount("5")
  }

  function toggle(questionId: number) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  const available = total ?? 0
  const drawCount = Number(count)
  const countValid = Number.isInteger(drawCount) && drawCount >= 1 && drawCount <= available
  const canSubmit = !working && (mode === "pick" ? selected.size > 0 : countValid)

  async function submit() {
    if (!canSubmit) return
    setWorking(true)
    const ids = [...selected]
    const result = await createDraftAndFill(courseId, (testId) =>
      callClient((client) => (mode === "pick" ? client.importFromBank(testId, ids) : client.drawFromBank(testId, drawCount, courseId))),
    )
    setWorking(false)
    if (!result.ok) return void toast.error(result.error)
    toast.success(t("done"))
    notifyCourseTestsChanged()
    onOpenChange(false)
    reset()
    router.push(builderPath(courseId, result.data.id) as never)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (working) return
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-[42rem]">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div role="group" aria-label={t("mode_label")} className="inline-flex w-full rounded-xl bg-surface-muted p-1 sm:w-auto">
          {(["pick", "random"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "min-h-11 flex-1 rounded-lg px-4 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none sm:flex-none",
                mode === value ? "bg-card font-semibold text-foreground shadow-sm" : "text-on-surface-muted hover:text-foreground",
              )}
            >
              {t(value === "pick" ? "mode_pick" : "mode_random")}
            </button>
          ))}
        </div>

        {loadError ? (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {loadError}
          </p>
        ) : questions === null ? (
          <div className="space-y-2" aria-busy="true">
            <span className="sr-only">{t("loading")}</span>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : available === 0 && !debounced ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-on-surface-muted">{t("empty")}</p>
        ) : mode === "pick" ? (
          <div key="pick" className="flex animate-fade-in flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
              <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label={t("search")} placeholder={t("search")} className="h-11 ps-9" />
            </div>
            <ul ref={listRef} className="flex max-h-[45dvh] flex-col gap-2 overflow-y-auto pe-1" aria-label={t("title")}>
              {questions.length === 0 && <li className="p-4 text-center text-sm text-on-surface-muted">{t("no_results")}</li>}
              {questions.map((question) => {
                const checked = selected.has(question.id)
                const inputId = `${id}-q-${question.id}`
                return (
                  <li key={question.id}>
                    <label
                      htmlFor={inputId}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-150",
                        checked ? "border-primary bg-primary-tint/60" : "border-border hover:bg-surface-muted",
                      )}
                    >
                      <input id={inputId} type="checkbox" checked={checked} onChange={() => toggle(question.id)} className="mt-0.5 size-5 shrink-0 accent-primary" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm leading-relaxed font-medium">{question.text}</span>
                        <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-on-surface-muted">
                          <span>{tTypes(question.type)}</span>
                          <span className="tabular-nums">{t("points", { count: question.points })}</span>
                          <span>{t("used", { count: question.used_in_tests })}</span>
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
            <p className="text-sm text-on-surface-muted tabular-nums" aria-live="polite">
              {t("selected", { count: selected.size })}
            </p>
          </div>
        ) : (
          <div key="random" className="flex animate-fade-in flex-col gap-2">
            <Label htmlFor={`${id}-count`}>{t("count_label")}</Label>
            <Input
              id={`${id}-count`}
              type="number"
              inputMode="numeric"
              min={1}
              max={available}
              value={count}
              onChange={(event) => setCount(event.target.value)}
              aria-invalid={!countValid}
              aria-describedby={`${id}-count-hint`}
              className="h-11 w-32 tabular-nums"
            />
            <p id={`${id}-count-hint`} className={cn("text-sm", countValid ? "text-on-surface-muted" : "text-destructive")}>
              {countValid ? t("available", { count: available }) : t("count_invalid", { max: available })}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="h-11 px-4" disabled={working} onClick={() => onOpenChange(false)}>
            {tActions("cancel")}
          </Button>
          <Button className="h-11 gap-2 px-5" disabled={!canSubmit} aria-busy={working} onClick={() => void submit()}>
            {working && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {working ? t("working") : t(mode === "pick" ? "submit_pick" : "submit_random")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
