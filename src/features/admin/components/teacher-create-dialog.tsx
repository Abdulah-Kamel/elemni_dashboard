"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { listGradesAction, listSubjectsAction } from "@/features/course-management/actions"
import type { GradeOut, SubjectOut } from "@/features/course-management/schema"
import { useTeacherMutations } from "../hooks/use-teachers-queries"
import { AccountCreationProgress } from "./account-creation-progress"

const emptyForm = { name: "", email: "", phone_number: "", slug: "", location: "", experience: "", description: "", subject_ids: [] as number[], grade_ids: [] as number[] }

export function TeacherCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("admin")
  const [form, setForm] = useState(emptyForm)
  const [subjects, setSubjects] = useState<SubjectOut[]>([])
  const [grades, setGrades] = useState<GradeOut[]>([])
  const [progressOpen, setProgressOpen] = useState(false)
  const [creationStatus, setCreationStatus] = useState<"pending" | "success" | "warning" | "error">("pending")
  const { create } = useTeacherMutations()
  useEffect(() => { if (open && !subjects.length) Promise.all([listSubjectsAction(), listGradesAction()]).then(([nextSubjects, nextGrades]) => { setSubjects(nextSubjects); setGrades(nextGrades) }) }, [open, subjects.length])
  const toggle = (key: "subject_ids" | "grade_ids", id: number) => setForm((previous) => ({ ...previous, [key]: previous[key].includes(id) ? previous[key].filter((value) => value !== id) : [...previous[key], id] }))
  async function submit() {
    setCreationStatus("pending")
    setProgressOpen(true)
    const outcome = await create.mutateAsync({ ...form, phone_number: form.phone_number || null, slug: form.slug || null, location: form.location || null, experience: form.experience ? Number(form.experience) : null, description: form.description || null })
    if (!outcome.success) {
      setCreationStatus("error")
      toast.error(outcome.error.message)
      return
    }
    setCreationStatus(outcome.data.invitation_sent ? "success" : "warning")
  }
  function close(value: boolean) { onOpenChange(value); if (!value) setForm(emptyForm) }
  function closeProgress() {
    setProgressOpen(false)
    if (creationStatus !== "error") close(false)
  }
  return <><Dialog open={open && !progressOpen} onOpenChange={close}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[42rem]"><DialogHeader><DialogTitle>{t("title_new_teacher")}</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><Input placeholder={`${t("field_name")} *`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input type="email" placeholder={`${t("field_email")} *`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Input placeholder={t("field_phone")} value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} /><Input placeholder={t("table_slug")} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /><Input placeholder={t("field_location")} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /><Input type="number" min="0" placeholder={t("field_experience")} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /><Textarea className="sm:col-span-2" placeholder={t("field_description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div><p className="mb-2 text-sm font-medium">{t("field_subject_ids")}</p><div className="flex flex-wrap gap-2">{subjects.map((subject) => <Button type="button" size="sm" variant={form.subject_ids.includes(subject.id) ? "default" : "outline"} key={subject.id} onClick={() => toggle("subject_ids", subject.id)}>{subject.name}</Button>)}</div></div><div><p className="mb-2 text-sm font-medium">{t("field_grade_ids")}</p><div className="flex flex-wrap gap-2">{grades.map((grade) => <Button type="button" size="sm" variant={form.grade_ids.includes(grade.id) ? "default" : "outline"} key={grade.id} onClick={() => toggle("grade_ids", grade.id)}>{grade.name}</Button>)}</div></div><DialogFooter><Button variant="outline" onClick={() => close(false)}>{t("btn_cancel")}</Button><Button disabled={!form.name || !form.email || create.isPending} onClick={submit}>{t("btn_create")}</Button></DialogFooter></DialogContent></Dialog><AccountCreationProgress open={progressOpen} role="teacher" status={creationStatus} onClose={closeProgress} /></>
}
