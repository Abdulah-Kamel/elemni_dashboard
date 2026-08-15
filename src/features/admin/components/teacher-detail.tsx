"use client"

import { useState } from "react"
import { Loader2, Mail, Save, Video } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createTeacherLibrary, sendSetPasswordEmail, updateTeacherLibrarySettings } from "../actions"
import type { AdminTeacherListItem } from "../schema"
import type { AdminLibrarySettings } from "../schema"
import type { GradeOut, SubjectOut } from "@/features/course-management/schema"
import { useTeacherMutations } from "../hooks/use-teachers-queries"
import { SubscriptionsList } from "./subscriptions-list"
import { AdminActionDialog } from "./admin-action-dialog"

type DetailAction = "save" | "invite" | "create-library" | "save-library"

export function TeacherDetail({ teacher: initialTeacher, subjects, grades, initialLibrarySettings }: { teacher: AdminTeacherListItem; subjects: SubjectOut[]; grades: GradeOut[]; initialLibrarySettings: AdminLibrarySettings | null }) {
  const t = useTranslations("admin")
  const [teacher, setTeacher] = useState(initialTeacher)
  const [form, setForm] = useState({ name: teacher.name, email: teacher.email, phone_number: teacher.phone_number ?? "", location: teacher.location ?? "", experience: teacher.experience ?? 0, description: teacher.description ?? "", subject_ids: teacher.subjects.map((subject) => subject.id), grade_ids: teacher.grades.map((grade) => grade.id) })
  const [librarySettings, setLibrarySettings] = useState<AdminLibrarySettings | null>(initialLibrarySettings)
  const [busy, setBusy] = useState(false)
  const [detailAction, setDetailAction] = useState<DetailAction | null>(null)
  const { update } = useTeacherMutations()
  async function save() { const result = await update.mutateAsync({ id: teacher.id, data: { ...form, phone_number: form.phone_number || null, location: form.location || null, description: form.description || null } }); if (!result.success) { toast.error(result.error.message); return false } toast.success(t("updated")); return true }
  async function invite() { setBusy(true); const result = await sendSetPasswordEmail(teacher.id); setBusy(false); if (!result.success) { toast.error(result.error.message); return false } toast.success(result.data.detail); return true }
  async function createLibrary() { setBusy(true); const result = await createTeacherLibrary(teacher.id); setBusy(false); if (!result.success) { toast.error(result.error.message); return false } setTeacher((previous) => ({ ...previous, has_library: true })); setLibrarySettings({ controls: ["play-large", "play", "rewind", "fast-forward", "progress", "current-time", "mute", "volume", "captions", "settings", "fullscreen"], block_none_referrer: true, enable_content_tagging: false, enable_drm: true }); toast.success(result.data.detail); return true }
  async function saveLibrary() { if (!librarySettings) return false; setBusy(true); const result = await updateTeacherLibrarySettings(teacher.id, librarySettings); setBusy(false); if (!result.success) { toast.error(result.error.message); return false } toast.success(result.data.detail); return true }
  async function confirmDetailAction() {
    if (!detailAction) return
    const succeeded = detailAction === "save" ? await save() : detailAction === "invite" ? await invite() : detailAction === "create-library" ? await createLibrary() : await saveLibrary()
    if (succeeded) setDetailAction(null)
  }
  const actionCopy = detailAction === "save"
    ? { title: t("action_save_teacher_title"), description: t("action_save_teacher", { name: teacher.name }), label: t("btn_save") }
    : detailAction === "invite"
      ? { title: t("action_invite_title"), description: t("action_invite_teacher", { name: teacher.name }), label: t("btn_send_invite") }
      : detailAction === "create-library"
        ? { title: t("action_create_library_title"), description: t("action_create_library", { name: teacher.name }), label: t("create_library") }
        : { title: t("action_save_library_title"), description: t("action_save_library", { name: teacher.name }), label: t("save_secure_settings") }
  const toggleAssignment = (key: "subject_ids" | "grade_ids", id: number) => setForm((previous) => ({ ...previous, [key]: previous[key].includes(id) ? previous[key].filter((value) => value !== id) : [...previous[key], id] }))
  return <div className="flex flex-col gap-xl">
    <header className="animate-slide-up flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><h1 className="text-headline-md font-semibold">{teacher.name}</h1><Badge variant={teacher.is_active ? "default" : "secondary"}>{teacher.is_active ? t("status_active") : t("status_inactive")}</Badge></div><p className="mt-1 text-on-surface-muted">{teacher.email} · /{teacher.slug}</p></div><Button variant="outline" disabled={busy} onClick={() => setDetailAction("invite")}><Mail className="size-4" />{t("btn_send_invite")}</Button></header>
    <div className="grid gap-md xl:grid-cols-3"><Card className="animate-slide-up animate-stagger-1 rounded-2xl border-border p-md shadow-xs xl:col-span-2"><h2 className="text-title-lg font-semibold">{t("section_basic_info")}</h2><div className="grid gap-4 sm:grid-cols-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} /><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} /><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div><p className="mb-2 text-sm font-medium">{t("field_subject_ids")}</p><div className="flex flex-wrap gap-2">{subjects.map((subject) => <Button type="button" size="sm" variant={form.subject_ids.includes(subject.id) ? "default" : "outline"} key={subject.id} onClick={() => toggleAssignment("subject_ids", subject.id)}>{subject.name}</Button>)}</div></div><div><p className="mb-2 text-sm font-medium">{t("field_grade_ids")}</p><div className="flex flex-wrap gap-2">{grades.map((grade) => <Button type="button" size="sm" variant={form.grade_ids.includes(grade.id) ? "default" : "outline"} key={grade.id} onClick={() => toggleAssignment("grade_ids", grade.id)}>{grade.name}</Button>)}</div></div><Button onClick={() => setDetailAction("save")} disabled={update.isPending}><Save className="size-4" />{t("btn_save")}</Button></Card>
      <Card className="animate-slide-up animate-stagger-2 rounded-2xl border-border p-md shadow-xs"><div className="flex size-10 items-center justify-center rounded-xl bg-primary-tint text-primary"><Video className="size-5" /></div><h2 className="text-title-lg font-semibold">{t("video_library")}</h2><p className="text-sm text-on-surface-muted">{teacher.has_library ? t("library_ready") : t("library_missing")}</p>{teacher.has_library && librarySettings ? <><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={librarySettings.enable_drm} onChange={(e) => setLibrarySettings({ ...librarySettings, enable_drm: e.target.checked })} />{t("library_drm")}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={librarySettings.block_none_referrer} onChange={(e) => setLibrarySettings({ ...librarySettings, block_none_referrer: e.target.checked })} />{t("library_block_referrer")}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={librarySettings.enable_content_tagging} onChange={(e) => setLibrarySettings({ ...librarySettings, enable_content_tagging: e.target.checked })} />{t("library_content_tagging")}</label><Button variant="outline" onClick={() => setDetailAction("save-library")} disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}{t("save_secure_settings")}</Button></> : <Button onClick={() => setDetailAction("create-library")} disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}{t("create_library")}</Button>}</Card></div>
    <section className="animate-slide-up animate-stagger-3"><h2 className="mb-4 text-title-lg font-semibold">{t("title_subscriptions")}</h2><SubscriptionsList teacherProfileId={teacher.teacher_profile_id} /></section>
    <AdminActionDialog open={detailAction !== null} title={actionCopy.title} description={actionCopy.description} confirmLabel={actionCopy.label} cancelLabel={t("btn_cancel")} pending={busy || update.isPending} onConfirm={confirmDetailAction} onOpenChange={(nextOpen) => { if (!nextOpen) setDetailAction(null) }} />
  </div>
}
