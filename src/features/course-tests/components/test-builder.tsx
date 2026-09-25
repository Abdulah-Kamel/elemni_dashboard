"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { addTestQuestion, deleteTestQuestion, publishCourseTest, reorderTestQuestions, updateCourseTest, updateTestQuestion } from "../actions";
import type { CourseTest, TestQuestion } from "../types";

const types = ["single", "multi", "true_false", "short_answer", "essay", "ordering", "matching"] as const;
const typeName: Record<(typeof types)[number], string> = { single: "اختيار واحد", multi: "اختيار متعدد", true_false: "صح أو خطأ", short_answer: "إجابة قصيرة", essay: "مقالي", ordering: "ترتيب", matching: "توصيل" };
const baseOptions = [{ id: "a", text: "الاختيار الأول" }, { id: "b", text: "الاختيار الثاني" }, { id: "c", text: "الاختيار الثالث" }, { id: "d", text: "الاختيار الرابع" }];

function makeQuestion(testId: number, type: string, position: number): Omit<TestQuestion, "id"> & { save_to_bank: boolean } {
  return { position, type, text: "", code_snippet: null, image_url: null, points: 1, options: type === "essay" || type === "short_answer" ? [] : baseOptions.slice(0, type === "true_false" ? 2 : 4), answer_key: {}, explanation: null, shuffle_options: false, topic_ref: null, save_to_bank: false };
}

function validate(question: TestQuestion) {
  if (!question.text.trim()) return "اكتب نص السؤال.";
  if (question.type === "single" && !question.answer_key.option_id) return "لم تُحدَّد الإجابة الصحيحة.";
  if (question.type === "true_false" && !question.answer_key.option_id) return "حدّد الإجابة الصحيحة.";
  if (question.type === "multi" && !(question.answer_key.option_ids as string[] | undefined)?.length) return "اختر إجابة صحيحة واحدة على الأقل.";
  if (question.type === "short_answer" && !(question.answer_key.accepted as string[] | undefined)?.length) return "أضف إجابة مقبولة.";
  if (question.type === "ordering" && !(question.answer_key.option_ids as string[] | undefined)?.length) return "حدّد الترتيب الصحيح.";
  if (question.type === "matching" && !question.answer_key.matches) return "أكمل أزواج التوصيل الصحيحة.";
  return null;
}

function settingsPayload(test: CourseTest) {
  return {
    lesson_id: test.lesson_id, position: test.position, placement: test.placement, parent_item_id: test.parent_item_id,
    title: test.title, description: test.description, time_limit_minutes: test.time_limit_minutes, max_attempts: test.max_attempts,
    grading_policy: test.grading_policy, cooldown_minutes: test.cooldown_minutes, pass_percent: test.pass_percent,
    complete_item_on_pass_only: test.complete_item_on_pass_only, notify_teacher_on_attempts_exhausted: test.notify_teacher_on_attempts_exhausted,
    prerequisite: test.prerequisite, prerequisite_ids: test.prerequisite_ids, opens_at: test.opens_at, closes_at: test.closes_at,
    shuffle_questions: test.shuffle_questions, allow_back_navigation: test.allow_back_navigation, random_pool_size: test.random_pool_size,
    show_correct_answers: test.show_correct_answers, show_score_immediately: test.show_score_immediately,
  };
}

export function TestBuilder({ initialTest }: { initialTest: CourseTest }) {
  const router = useRouter();
  const [test, setTest] = useState(initialTest);
  const [selectedId, setSelectedId] = useState<number | null>(initialTest.questions[0]?.id ?? null);
  const [step, setStep] = useState<"questions" | "settings" | "review">("questions");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, startSaving] = useTransition();
  const selected = test.questions.find((question) => question.id === selectedId) ?? null;
  const questionErrors = useMemo(() => test.questions.map((question, index) => ({ index: index + 1, message: validate(question) })).filter((item) => item.message), [test.questions]);
  const autoQuestions = test.questions.filter((question) => question.type !== "essay");
  const autoPoints = autoQuestions.reduce((sum, question) => sum + question.points, 0);
  const manualQuestions = test.questions.filter((question) => question.type === "essay");
  const totalPoints = test.questions.reduce((sum, question) => sum + question.points, 0);
  const allErrors = [...errors, ...(test.questions.length ? [] : ["أضف سؤالاً واحداً على الأقل."]), ...questionErrors.map((item) => `السؤال ${item.index}: ${item.message}`), ...(test.pass_percent < 1 || test.pass_percent > 100 ? ["نسبة النجاح يجب أن تكون بين 1 و100."] : []), ...(test.opens_at && test.closes_at && new Date(test.closes_at) <= new Date(test.opens_at) ? ["موعد الإغلاق يجب أن يأتي بعد الفتح."] : []), ...(test.random_pool_size && test.random_pool_size > test.questions.length ? ["حجم السحب العشوائي أكبر من عدد الأسئلة."] : [])];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void updateCourseTest(test.id, settingsPayload(test));
      for (const question of test.questions) void updateTestQuestion(question.id, question);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [test]);

  function patchQuestion(id: number, patch: Partial<TestQuestion>) {
    setTest((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...patch } : question) }));
  }

  async function saveQuestion() {
    if (!selected) return;
    const message = validate(selected);
    if (message) { setErrors([message]); return; }
    setErrors([]);
    try {
      const saved = await updateTestQuestion(selected.id, { ...selected, save_to_bank: false });
      setTest((current) => ({ ...current, questions: current.questions.map((question) => question.id === saved.id ? saved : question) }));
      toast.success("حُفظ السؤال.");
    } catch { toast.error("تعذر حفظ السؤال."); }
  }

  async function addQuestion(type: string) {
    const payload = makeQuestion(test.id, type, test.questions.length);
    try {
      const saved = await addTestQuestion(test.id, payload);
      setTest((current) => ({ ...current, questions: [...current.questions, saved] }));
      setSelectedId(saved.id);
      setErrors([]);
    } catch { toast.error("تعذر إضافة السؤال."); }
  }

  async function moveQuestion(direction: -1 | 1) {
    if (!selected) return;
    const index = test.questions.findIndex((question) => question.id === selected.id);
    const target = index + direction;
    if (target < 0 || target >= test.questions.length) return;
    const ordered = [...test.questions];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setTest((current) => ({ ...current, questions: ordered.map((question, position) => ({ ...question, position })) }));
    try { await reorderTestQuestions(test.id, ordered.map((question) => question.id)); } catch { toast.error("تعذر تغيير ترتيب السؤال."); }
  }

  async function removeQuestion(questionId: number) {
    try {
      await deleteTestQuestion(questionId);
      const questions = test.questions.filter((question) => question.id !== questionId);
      setTest((current) => ({ ...current, questions }));
      setSelectedId(questions[0]?.id ?? null);
    } catch { toast.error("تعذر حذف السؤال."); }
  }

  function saveSettings() {
    startSaving(async () => {
      try { await updateCourseTest(test.id, settingsPayload(test)); toast.success("حُفظت إعدادات الاختبار."); }
      catch { toast.error("تعذر حفظ الإعدادات."); }
    });
  }

  function publish() {
    startSaving(async () => {
      try { await updateCourseTest(test.id, settingsPayload(test)); await publishCourseTest(test.id); toast.success("نُشر الاختبار."); router.push(`/courses/${test.course_id}/tests`); }
      catch (error) { const message = error instanceof Error ? error.message : "تعذر نشر الاختبار."; setErrors([message]); toast.error(message); }
    });
  }

  return <div dir="rtl" className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{test.title}</h1><p className="text-sm text-muted-foreground">{test.status === "published" ? "تعديل الاختبار المنشور ينطبق على المحاولات الجديدة فقط." : "تُحفظ التغييرات عند الضغط على حفظ."}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" render={<Link href={`/courses/${test.course_id}/tests/${test.id}/preview`} target="_blank" />}><Eye className="me-2 size-4" />معاينة كطالب</Button><Button variant="outline" onClick={saveSettings} disabled={saving}><Save className="me-2 size-4" />حفظ التغييرات</Button><Button onClick={publish} disabled={saving || allErrors.length > 0}>نشر الاختبار</Button></div></header>
    <nav aria-label="خطوات إعداد الاختبار" className="flex gap-2 border-b">{[["questions", "1 · الأسئلة"], ["settings", "2 · الإعدادات والتوفر"], ["review", "3 · المراجعة والنشر"]].map(([id, label]) => <button key={id} onClick={() => setStep(id as typeof step)} aria-current={step === id ? "step" : undefined} className={`min-h-12 border-b-2 px-4 text-sm font-semibold ${step === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{label}</button>)}</nav>
    {step === "questions" && <div className="grid gap-5 xl:grid-cols-[17rem_minmax(0,1fr)_17rem]">
      <section className="rounded-xl border bg-card p-4"><div className="flex items-center justify-between"><h2 className="font-semibold">الأسئلة ({test.questions.length})</h2><span className="text-xs text-muted-foreground">حُفظ تلقائياً</span></div><ol className="mt-3 space-y-2">{test.questions.map((question, index) => <li key={question.id}><button onClick={() => setSelectedId(question.id)} aria-current={selectedId === question.id ? "true" : undefined} className={`w-full rounded-lg border p-3 text-start ${selectedId === question.id ? "border-primary bg-primary/5" : "border-border"}`}><span className="flex items-center justify-between"><strong>سؤال {index + 1}</strong><span className="text-xs">{question.points} نقطة</span></span><span className="mt-1 block truncate text-sm text-muted-foreground">{question.text || "سؤال جديد"}</span>{question.type === "essay" && <span className="mt-1 inline-flex rounded bg-muted px-2 py-0.5 text-xs">يدوي</span>}{validate(question) && <span className="mt-1 block text-xs text-destructive">{validate(question)}</span>}</button></li>)}</ol><div className="mt-4 flex flex-wrap gap-2">{types.map((type) => <Button key={type} variant="outline" size="sm" onClick={() => addQuestion(type)}><Plus className="me-1 size-3" />{typeName[type]}</Button>)}</div><p className="mt-3 text-xs text-muted-foreground">إضافة من بنك الأسئلة والملف: استخدم بنك الأسئلة أو قالب Excel من صفحة الاختبارات.</p></section>
      <section className="min-w-0 rounded-xl border bg-card p-5">{selected ? <div className="space-y-5"><div className="flex items-center justify-between"><div><Label>نوع السؤال · السؤال {test.questions.findIndex((question) => question.id === selected.id) + 1} من {test.questions.length}</Label><select aria-label="نوع السؤال" value={selected.type} onChange={(event) => patchQuestion(selected.id, { type: event.target.value, options: event.target.value === "essay" || event.target.value === "short_answer" ? [] : baseOptions.slice(0, event.target.value === "true_false" ? 2 : 4), answer_key: {} })} className="mt-1 block min-h-10 rounded-lg border bg-background px-3">{types.map((type) => <option key={type} value={type}>{typeName[type]}</option>)}</select></div><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="تحريك لأعلى" onClick={() => moveQuestion(-1)}><ArrowUp /></Button><Button variant="ghost" size="icon" aria-label="تحريك لأسفل" onClick={() => moveQuestion(1)}><ArrowDown /></Button><Button variant="ghost" size="icon" aria-label="حذف السؤال" onClick={() => removeQuestion(selected.id)}><Trash2 /></Button></div></div>
        <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]"><label className="space-y-1"><span className="text-sm font-medium">النقاط</span><Input type="number" min={1} value={selected.points} onChange={(event) => patchQuestion(selected.id, { points: Math.max(1, Number(event.target.value)) })} /></label><label className="space-y-1"><span className="text-sm font-medium">نص السؤال</span><Textarea rows={3} value={selected.text} onChange={(event) => patchQuestion(selected.id, { text: event.target.value })} /></label></div>
        {selected.type === "single" || selected.type === "multi" || selected.type === "true_false" || selected.type === "ordering" || selected.type === "matching" ? <fieldset className="space-y-2"><legend className="mb-2 font-semibold">الاختيارات وتحديد الإجابة الصحيحة</legend>{selected.options.map((option, index) => <div key={option.id} className="flex items-center gap-2"><input aria-label={`الإجابة الصحيحة ${index + 1}`} type={selected.type === "multi" ? "checkbox" : "radio"} name={`correct-${selected.id}`} checked={selected.type === "multi" ? ((selected.answer_key.option_ids as string[] | undefined) ?? []).includes(option.id) : selected.answer_key.option_id === option.id} onChange={(event) => patchQuestion(selected.id, { answer_key: selected.type === "multi" ? { ...selected.answer_key, option_ids: event.target.checked ? [...((selected.answer_key.option_ids as string[] | undefined) ?? []), option.id] : ((selected.answer_key.option_ids as string[] | undefined) ?? []).filter((id) => id !== option.id) } : { ...selected.answer_key, option_id: option.id } })} /><Input value={option.text} aria-label={`نص الاختيار ${index + 1}`} onChange={(event) => patchQuestion(selected.id, { options: selected.options.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item) })} /></div>)}</fieldset> : null}
        {selected.type === "short_answer" && <label className="block space-y-1"><span className="text-sm font-medium">الإجابات المقبولة، كل إجابة في سطر</span><Textarea rows={3} value={((selected.answer_key.accepted as string[] | undefined) ?? []).join("\n")} onChange={(event) => patchQuestion(selected.id, { answer_key: { ...selected.answer_key, accepted: event.target.value.split("\n").filter(Boolean), case_sensitive: false } })} /></label>}
        {selected.type === "essay" && <label className="block space-y-1"><span className="text-sm font-medium">الإجابة النموذجية ومعايير التقييم</span><Textarea rows={4} value={String(selected.answer_key.model_answer ?? "")} onChange={(event) => patchQuestion(selected.id, { answer_key: { ...selected.answer_key, model_answer: event.target.value } })} /></label>}
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1"><span className="text-sm font-medium">التوضيح بعد الإجابة</span><Textarea rows={2} value={selected.explanation ?? ""} onChange={(event) => patchQuestion(selected.id, { explanation: event.target.value })} /></label><label className="space-y-1"><span className="text-sm font-medium">رابط صورة السؤال</span><Input value={selected.image_url ?? ""} onChange={(event) => patchQuestion(selected.id, { image_url: event.target.value || null })} /></label></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={selected.shuffle_options} onChange={(event) => patchQuestion(selected.id, { shuffle_options: event.target.checked })} />خلط الاختيارات</label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={Boolean((selected as TestQuestion & { save_to_bank?: boolean }).save_to_bank)} onChange={(event) => patchQuestion(selected.id, { save_to_bank: event.target.checked } as Partial<TestQuestion>)} />حفظ في بنك الأسئلة</label><Button onClick={saveQuestion}>حفظ السؤال</Button></div>
      </div> : <p className="py-20 text-center text-muted-foreground">اختر سؤالاً أو أضف سؤالاً جديداً.</p>}</section>
      <aside className="h-fit rounded-xl border bg-card p-4"><h2 className="font-semibold">ملخص الاختبار</h2><dl className="mt-3 space-y-3 text-sm"><div className="flex justify-between"><dt>إجمالي النقاط</dt><dd className="font-bold tabular-nums">{totalPoints}</dd></div><div className="flex justify-between"><dt>أسئلة آلية</dt><dd>{autoQuestions.length} · {autoPoints} نقطة</dd></div><div className="flex justify-between"><dt>أسئلة يدوية</dt><dd>{manualQuestions.length} · {manualQuestions.reduce((sum, question) => sum + question.points, 0)} نقطة</dd></div></dl>{manualQuestions.length > 0 && <p className="mt-4 rounded-lg bg-muted p-3 text-xs leading-5">يتطلب هذا الاختبار تصحيحاً يدوياً قبل ظهور النتيجة النهائية.</p>}{questionErrors.length > 0 && <ul className="mt-4 space-y-2 text-xs text-destructive">{questionErrors.map((error) => <li key={error.index}>السؤال {error.index}: {error.message}</li>)}</ul>}</aside>
    </div>}
    {step === "settings" && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><section className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">{<label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium">عنوان الاختبار</span><Input value={test.title} onChange={(event) => setTest({ ...test, title: event.target.value })} /></label>}<label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium">الوصف</span><Textarea value={test.description ?? ""} onChange={(event) => setTest({ ...test, description: event.target.value })} /></label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={test.time_limit_minutes !== null} onChange={(event) => setTest({ ...test, time_limit_minutes: event.target.checked ? 15 : null })} />تحديد مدة زمنية</label><Input type="number" min={1} disabled={test.time_limit_minutes === null} value={test.time_limit_minutes ?? ""} onChange={(event) => setTest({ ...test, time_limit_minutes: Number(event.target.value) || 1 })} aria-label="المدة بالدقائق" /><label className="space-y-1"><span className="text-sm font-medium">الحد الأقصى للمحاولات</span><Input type="number" min={1} value={test.max_attempts ?? ""} onChange={(event) => setTest({ ...test, max_attempts: event.target.value ? Number(event.target.value) : null })} /></label><label className="space-y-1"><span className="text-sm font-medium">فترة الانتظار بالدقائق</span><Input type="number" min={0} value={test.cooldown_minutes} onChange={(event) => setTest({ ...test, cooldown_minutes: Number(event.target.value) })} /></label><label className="space-y-1"><span className="text-sm font-medium">طريقة احتساب الدرجة</span><select value={test.grading_policy} onChange={(event) => setTest({ ...test, grading_policy: event.target.value as CourseTest["grading_policy"] })} className="min-h-10 w-full rounded-lg border bg-background px-3"><option value="highest">أعلى درجة</option><option value="last">آخر درجة</option><option value="average">متوسط الدرجات</option></select></label><label className="space-y-1"><span className="text-sm font-medium">نسبة النجاح</span><Input type="number" min={1} max={100} value={test.pass_percent} onChange={(event) => setTest({ ...test, pass_percent: Number(event.target.value) })} /></label><label className="space-y-1"><span className="text-sm font-medium">تاريخ الفتح</span><Input type="datetime-local" value={test.opens_at?.slice(0, 16) ?? ""} onChange={(event) => setTest({ ...test, opens_at: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label><label className="space-y-1"><span className="text-sm font-medium">تاريخ الإغلاق</span><Input type="datetime-local" value={test.closes_at?.slice(0, 16) ?? ""} onChange={(event) => setTest({ ...test, closes_at: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label><label className="space-y-1"><span className="text-sm font-medium">موضع الاختبار</span><select value={test.placement} onChange={(event) => setTest({ ...test, placement: event.target.value as CourseTest["placement"] })} className="min-h-10 w-full rounded-lg border bg-background px-3"><option value="standalone_item">عنصر مستقل</option><option value="inside_item">داخل عنصر محتوى</option></select></label><label className="space-y-1"><span className="text-sm font-medium">المتطلب السابق</span><select value={test.prerequisite} onChange={(event) => setTest({ ...test, prerequisite: event.target.value })} className="min-h-10 w-full rounded-lg border bg-background px-3"><option value="none">بلا متطلب</option><option value="previous_item">إكمال العنصر السابق</option><option value="pass_tests">اجتياز اختبار محدد</option></select></label>{test.prerequisite === "pass_tests" && <label className="space-y-1"><span className="text-sm font-medium">معرّفات الاختبارات المطلوبة</span><Input value={test.prerequisite_ids.join(",")} onChange={(event) => setTest({ ...test, prerequisite_ids: event.target.value.split(",").map(Number).filter(Number.isInteger) })} /></label>}<label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={test.shuffle_questions} onChange={(event) => setTest({ ...test, shuffle_questions: event.target.checked })} />خلط الأسئلة</label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={test.allow_back_navigation} onChange={(event) => setTest({ ...test, allow_back_navigation: event.target.checked })} />السماح بالرجوع للأسئلة</label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={test.complete_item_on_pass_only} onChange={(event) => setTest({ ...test, complete_item_on_pass_only: event.target.checked })} />الإكمال عند الاجتياز فقط</label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={test.show_score_immediately} onChange={(event) => setTest({ ...test, show_score_immediately: event.target.checked })} />إظهار الدرجة فوراً</label></section><aside className="space-y-4"><section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">معاينة ما سيراه الطالب</h2><p className="mt-3 text-lg font-bold">{test.title || "عنوان الاختبار"}</p><p className="mt-1 text-sm text-muted-foreground">{test.questions.length} سؤال · {test.time_limit_minutes ? `${test.time_limit_minutes} دقيقة` : "بلا حد زمني"} · النجاح {test.pass_percent}%</p><Button className="mt-4 w-full" disabled>ابدأ الاختبار</Button></section><section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">جاهزية النشر</h2><p className="mt-3 text-sm">{test.questions.length ? "✓ أُضيف سؤال" : "○ أضف سؤالاً"}</p><p className="mt-2 text-sm">{questionErrors.length ? "○ أكمل الإجابات الصحيحة" : "✓ مفاتيح الإجابة مكتملة"}</p><p className="mt-2 text-sm">{test.closes_at && test.opens_at && new Date(test.closes_at) <= new Date(test.opens_at) ? "○ تحقق من نافذة التوفر" : "✓ نافذة التوفر"}</p></section></aside></div>}
    {step === "review" && <section className="max-w-3xl space-y-4 rounded-xl border bg-card p-5"><h2 className="text-xl font-bold">مراجعة الاختبار</h2><p>{test.questions.length} سؤال · {totalPoints} نقطة · نسبة النجاح {test.pass_percent}%</p>{allErrors.length ? <ul className="space-y-2 rounded-lg bg-destructive/5 p-4 text-sm text-destructive">{allErrors.map((error) => <li key={error}>{error}</li>)}</ul> : <p className="rounded-lg bg-emerald-50 p-4 text-emerald-800">الاختبار جاهز للنشر.</p>}<Button onClick={publish} disabled={saving || allErrors.length > 0}>نشر الاختبار</Button></section>}
  </div>;
}
