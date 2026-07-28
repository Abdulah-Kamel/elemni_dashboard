"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { listSubjectsAction, listGradesAction } from "@/features/course-management/actions";
import { useTeacherMutations } from "@/features/admin/hooks/use-teachers-queries";
import { sendSetPasswordEmail } from "@/features/admin/actions";
import type { SubjectOut, GradeOut } from "@/features/course-management/schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeacherCreateDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("admin");
  const [subjects, setSubjects] = useState<SubjectOut[]>([]);
  const [grades, setGrades] = useState<GradeOut[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<Record<string, string | number | boolean | number[]>>({
    name: "", email: "", phone_number: "", location: "", estimated_students: "", experience: "",
    cost_value: "", cost_type: "", current_platform: "", social_media: "", interest_level: "",
    call_status: "", call_date: "", follow_up_date: "", follow_up_count: 0, demo_scheduled: "",
    signed_up: false, next_step: "", closed: false, feedback: "", description: "",
    subject_ids: [] as number[], grade_ids: [] as number[],
  });
  const [result, setResult] = useState<{ id: number; name: string; slug: string; email: string } | null>(null);
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  const { create } = useTeacherMutations();

  const set = useCallback((key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleArray = useCallback((key: string, id: number) => {
    setForm((prev) => {
      const arr = (prev[key] as number[]) ?? [];
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      return { ...prev, [key]: next };
    });
  }, []);

  const handleOpen = useCallback(async () => {
    if (!loaded) {
      const [s, g] = await Promise.all([listSubjectsAction(), listGradesAction()]);
      setSubjects(s);
      setGrades(g);
      setLoaded(true);
    }
  }, [loaded]);

  const handleSubmit = async () => {
    try {
      const payload: Record<string, unknown> = { ...form };
      for (const k of ["estimated_students", "experience", "cost_value", "follow_up_count"]) {
        if (payload[k] === "" || payload[k] === undefined) payload[k] = null;
        else payload[k] = Number(payload[k]);
      }
      for (const k of ["phone_number", "location", "cost_type", "current_platform", "social_media", "interest_level", "call_status", "call_date", "follow_up_date", "demo_scheduled", "next_step", "feedback", "description"]) {
        if (payload[k] === "") payload[k] = null;
      }
      const outcome = await create.mutateAsync(payload);
      if (!outcome.success) {
        toast.error(outcome.error.message);
        return;
      }
      setResult(outcome.data);
      toast.success(t("result_created"));
    } catch (err) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Error";
      toast.error(msg);
    }
  };

  const handleInvite = async () => {
    if (!result) return;
    setInviting(true);
    try {
      await sendSetPasswordEmail(result.id);
      setInvited(true);
      toast.success(t("result_invite_sent"));
    } catch {
      toast.error(t("error_upstream"));
    } finally {
      setInviting(false);
    }
  };

  const labelClass = "block text-sm font-medium text-on-surface-muted mb-1";
  const sectionClass = "space-y-3";

  if (result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[36rem]">
          <DialogHeader>
            <DialogTitle>{t("result_created")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 text-sm">
            <p><span className="text-on-surface-muted">{t("table_name")}:</span> {result.name}</p>
            <p><span className="text-on-surface-muted">{t("table_email")}:</span> {result.email}</p>
            <p><span className="text-on-surface-muted">{t("table_slug")}:</span> {result.slug}</p>
          </div>
          <DialogFooter>
            {!invited && (
              <Button onClick={handleInvite} disabled={inviting} className="gap-1.5">
                {inviting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                {t("btn_send_invite")}
              </Button>
            )}
            <Button variant="outline" onClick={() => { setResult(null); setForm({ ...form, name: "", email: "" }); onOpenChange(false); }}>
              {t("btn_cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) handleOpen(); }}>
      <DialogContent className="sm:max-w-[36rem] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title_new_teacher")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_basic_info")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>{t("field_name")} *</label>
                <Input value={form.name as string} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{t("field_email")} *</label>
                <Input value={form.email as string} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{t("field_phone")}</label>
                <Input value={form.phone_number as string} onChange={(e) => set("phone_number", e.target.value)} />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_assignment")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t("field_subject_ids")}</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <button key={s.id} type="button" onClick={() => toggleArray("subject_ids", s.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${(form.subject_ids as number[]).includes(s.id) ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-on-surface-muted border-border hover:border-primary"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("field_grade_ids")}</label>
                <div className="flex flex-wrap gap-2">
                  {grades.map((g) => (
                    <button key={g.id} type="button" onClick={() => toggleArray("grade_ids", g.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${(form.grade_ids as number[]).includes(g.id) ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-on-surface-muted border-border hover:border-primary"}`}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_crm")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className={labelClass}>{t("field_location")}</label><Input value={form.location as string} onChange={(e) => set("location", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_estimated_students")}</label><Input type="number" value={form.estimated_students as string} onChange={(e) => set("estimated_students", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_experience")}</label><Input type="number" value={form.experience as string} onChange={(e) => set("experience", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_cost_value")}</label><Input type="number" value={form.cost_value as string} onChange={(e) => set("cost_value", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_cost_type")}</label><Input value={form.cost_type as string} onChange={(e) => set("cost_type", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_current_platform")}</label><Input value={form.current_platform as string} onChange={(e) => set("current_platform", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_social_media")}</label><Input value={form.social_media as string} onChange={(e) => set("social_media", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_interest_level")}</label><Input value={form.interest_level as string} onChange={(e) => set("interest_level", e.target.value)} /></div>
            </div>
          </div>

          <hr className="border-border" />

          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_pipeline")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className={labelClass}>{t("field_call_status")}</label><Input value={form.call_status as string} onChange={(e) => set("call_status", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_call_date")}</label><Input type="date" value={form.call_date as string} onChange={(e) => set("call_date", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_follow_up_date")}</label><Input type="date" value={form.follow_up_date as string} onChange={(e) => set("follow_up_date", e.target.value)} /></div>
              <div><label className={labelClass}>{t("field_follow_up_count")}</label><Input type="number" value={form.follow_up_count as number} onChange={(e) => set("follow_up_count", parseInt(e.target.value) || 0)} /></div>
              <div><label className={labelClass}>{t("field_demo_scheduled")}</label><Input type="date" value={form.demo_scheduled as string} onChange={(e) => set("demo_scheduled", e.target.value)} /></div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.signed_up} onChange={(e) => set("signed_up", e.target.checked)} /> {t("field_signed_up")}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.closed} onChange={(e) => set("closed", e.target.checked)} /> {t("field_closed")}</label>
              </div>
              <div><label className={labelClass}>{t("field_next_step")}</label><Input value={form.next_step as string} onChange={(e) => set("next_step", e.target.value)} /></div>
            </div>
          </div>

          <hr className="border-border" />

          <div className={sectionClass}>
            <h3 className="text-title-md font-semibold">{t("section_notes")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className={labelClass}>{t("field_feedback")}</label><textarea value={form.feedback as string} onChange={(e) => set("feedback", e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors resize-none" /></div>
              <div><label className={labelClass}>{t("field_description")}</label><textarea value={form.description as string} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors resize-none" /></div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setResult(null); onOpenChange(false); }}>{t("btn_cancel")}</Button>
          <Button onClick={handleSubmit} disabled={create.isPending || !form.name || !form.email} className="gap-1.5">
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("btn_create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
