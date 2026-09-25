"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Clock3, Flag, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCourseTestSnapshot, subscribeDemoCourseTests } from "@/features/course-tests/demo-store";
import type { CourseTest, TestQuestion } from "@/features/course-tests/types";

type ResponseValue = string | string[] | Record<string, string>;

function displayType(type: string) {
  return ({ single: "اختيار واحد", multi: "اختيارات متعددة", true_false: "صح أم خطأ", short_answer: "إجابة قصيرة", essay: "سؤال مقالي", ordering: "ترتيب", matching: "توصيل" } as Record<string, string>)[type] ?? "سؤال";
}

export function TestPreviewDemoPage({ courseId, testId }: { courseId: number; testId: number }) {
  const snapshot = useSyncTestSnapshot(testId);
  const test = useMemo(() => {
    if (!snapshot || snapshot === "null") return null;
    try {
      const stored = JSON.parse(snapshot) as CourseTest;
      return stored.course_id === courseId || stored.course_id === 12 ? { ...stored, course_id: courseId } : null;
    } catch { return null; }
  }, [snapshot, courseId]);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<Record<number, ResponseValue>>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timedOut = started && secondsLeft === 0;
  const questions = test?.questions ?? [];
  const question = questions[current];
  const answeredCount = questions.filter((item) => hasAnswer(responses[item.id])).length;

  useEffect(() => {
    if (!started || submitted || timedOut || secondsLeft === null) return;
    const timer = window.setInterval(() => setSecondsLeft((remaining) => remaining === null ? null : Math.max(remaining - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [started, submitted, timedOut, secondsLeft]);

  if (!snapshot) return <main className="w-full py-16 text-center text-muted-foreground">جارٍ تحميل معاينة الاختبار التجريبي…</main>;
  if (!test) return <main className="w-full py-16 text-center text-muted-foreground">الاختبار غير موجود في بيانات العرض التجريبي.</main>;

  const setResponse = (value: ResponseValue) => setResponses((previous) => ({ ...previous, [question.id]: value }));
  const move = (next: number) => setCurrent(Math.min(Math.max(next, 0), questions.length - 1));
  const toggleFlag = () => setFlagged((previous) => previous.includes(question.id) ? previous.filter((id) => id !== question.id) : [...previous, question.id]);
  const begin = () => {
    setStarted(true);
    setSecondsLeft(test.time_limit_minutes ? test.time_limit_minutes * 60 : null);
    setCurrent(0);
  };
  const timeLabel = secondsLeft === null ? "بلا حد زمني" : `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return <main dir="rtl" className="block w-full min-w-0 py-5 sm:py-8">
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
        <div><p className="text-sm text-muted-foreground">معاينة للمدرّس · لن تُحفظ أي محاولة</p><h1 className="mt-1 text-lg font-bold">{test.title}</h1></div>
        {started && !submitted && !timedOut && <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-mono tabular-nums" aria-live="polite"><Clock3 className="size-4" aria-hidden="true" />{timeLabel}</div>}
      </div>

      {!started ? <section className="rounded-xl border bg-card p-6 sm:p-8">
        <p className="text-sm font-medium text-primary">اختبار تجريبي</p>
        <h2 className="mt-2 text-2xl font-bold">{test.title}</h2>
        {test.description && <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{test.description}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="الأسئلة" value={String(questions.length)} />
          <Stat label="المدة" value={test.time_limit_minutes ? `${test.time_limit_minutes} دقيقة` : "بلا حد زمني"} />
          <Stat label="درجة النجاح" value={`${test.pass_percent}%`} />
        </div>
        <p className="mt-5 text-sm text-muted-foreground">هذه معاينة تفاعلية. يمكنك تجربة الإجابات والتنقل والتسليم، ولن تُسجّل محاولة أو تُرسل إجابات.</p>
        <Button className="mt-6 min-h-11" onClick={begin} disabled={!questions.length}>ابدأ المعاينة</Button>
        {!questions.length && <p className="mt-3 text-sm text-destructive">أضف سؤالاً واحداً على الأقل لمعاينة الاختبار.</p>}
      </section> : submitted || timedOut ? <section className="rounded-xl border bg-card p-6 text-center sm:p-10">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-6" aria-hidden="true" /></div>
        <h2 className="mt-4 text-2xl font-bold">انتهت معاينة الاختبار</h2>
        <p className="mt-2 text-muted-foreground">أجبت على {answeredCount} من {questions.length} سؤالاً. لم تُحفظ هذه الإجابات.</p>
        <Button className="mt-6" variant="outline" onClick={() => { setSubmitted(false); setStarted(false); setConfirmSubmit(false); setResponses({}); setFlagged([]); }}>ابدأ المعاينة من جديد</Button>
      </section> : <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="min-w-0 space-y-4">
          {secondsLeft !== null && secondsLeft > 0 && secondsLeft < 120 && <div role="status" className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">تبقّت أقل من دقيقتين على انتهاء الوقت.</div>}
          <article className="min-w-0 rounded-xl border bg-card p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>السؤال {current + 1} من {questions.length} · {displayType(question.type)}</span><span>{question.points} {question.points === 1 ? "نقطة" : "نقاط"}</span></div>
            <h2 className="mt-4 break-words text-lg font-semibold leading-8">{question.text}</h2>
            {question.code_snippet && <pre dir="ltr" className="mt-4 max-w-full overflow-x-auto rounded-lg bg-muted p-4 text-start"><code>{question.code_snippet}</code></pre>}
            {question.image_url && <img src={question.image_url} alt="صورة توضيحية للسؤال" className="mt-4 max-h-72 max-w-full rounded-lg object-contain" />}
            <div className="mt-5">{renderAnswerInput(question, responses[question.id], setResponse)}</div>
            <Button className="mt-5 min-h-11" variant={flagged.includes(question.id) ? "secondary" : "outline"} onClick={toggleFlag} aria-pressed={flagged.includes(question.id)}><Flag className="me-2 size-4" aria-hidden="true" />{flagged.includes(question.id) ? "إزالة علامة المراجعة" : "علّم للمراجعة"}</Button>
          </article>
          <div className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3">
            <Button variant="outline" className="min-h-11" disabled={current === 0 || !test.allow_back_navigation} onClick={() => move(current - 1)}><ChevronRight className="me-1 size-4" aria-hidden="true" />السابق</Button>
            <span className="text-sm text-muted-foreground">أُجيب عن {answeredCount} من {questions.length}</span>
            {current < questions.length - 1 ? <Button className="min-h-11" onClick={() => move(current + 1)}>التالي<ChevronLeft className="ms-1 size-4" aria-hidden="true" /></Button> : <Button className="min-h-11" onClick={() => setConfirmSubmit(true)}><Send className="me-2 size-4" aria-hidden="true" />مراجعة وتسليم</Button>}
          </div>
        </section>
        <aside className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">التنقل بين الأسئلة</h2>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-4">{questions.map((item, index) => <button type="button" key={item.id} onClick={() => move(index)} aria-label={`الانتقال إلى السؤال ${index + 1}${hasAnswer(responses[item.id]) ? "، تمت الإجابة" : "، بلا إجابة"}${flagged.includes(item.id) ? "، معلّم للمراجعة" : ""}`} aria-current={current === index ? "step" : undefined} className={`relative min-h-11 rounded-lg border text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${current === index ? "border-primary bg-primary text-primary-foreground" : hasAnswer(responses[item.id]) ? "bg-primary/10" : "bg-background"}`}>{index + 1}{flagged.includes(item.id) && <Flag className="absolute -start-1 -top-1 size-3 fill-amber-500 text-amber-600" aria-hidden="true" />}</button>)}</div>
          <div className="mt-4 space-y-2 text-xs text-muted-foreground"><p>● تمت الإجابة</p><p>○ بلا إجابة</p><p><Flag className="inline size-3 text-amber-600" aria-hidden="true" /> معلّم للمراجعة</p></div>
          <Button className="mt-5 min-h-11 w-full" variant="outline" onClick={() => setConfirmSubmit(true)}>مراجعة وتسليم</Button>
        </aside>
      </div>}

      {confirmSubmit && !submitted && !timedOut && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmSubmit(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="preview-submit-title" className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h2 id="preview-submit-title" className="text-xl font-bold">تأكيد تسليم المعاينة</h2><p className="mt-1 text-sm text-muted-foreground">هذه خطوة تجريبية ولن تُسجّل النتيجة.</p></div><button type="button" onClick={() => setConfirmSubmit(false)} aria-label="إغلاق نافذة التسليم" className="flex size-11 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="size-5" aria-hidden="true" /></button></div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center"><Stat label="تمت الإجابة" value={String(answeredCount)} /><Stat label="بلا إجابة" value={String(questions.length - answeredCount)} /><Stat label="للمراجعة" value={String(flagged.length)} /></div>
          <div className="mt-5 flex justify-end gap-2"><Button variant="outline" className="min-h-11" onClick={() => setConfirmSubmit(false)}>العودة للاختبار</Button><Button className="min-h-11" onClick={() => { setConfirmSubmit(false); setSubmitted(true); }}>تسليم المعاينة</Button></div>
        </section>
      </div>}
    </div>
  </main>;
}

function useSyncTestSnapshot(testId: number) {
  return useSyncExternalStore(subscribeDemoCourseTests, () => getCourseTestSnapshot(testId), () => "");
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/60 px-3 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular-nums">{value}</p></div>;
}

function hasAnswer(value: ResponseValue | undefined) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.values(value).some(Boolean);
  return typeof value === "string" && value.trim().length > 0;
}

function renderAnswerInput(question: TestQuestion, response: ResponseValue | undefined, setResponse: (value: ResponseValue) => void) {
  const options = question.options ?? [];
  const fieldClass = "min-h-11 w-full rounded-lg border bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  if (question.type === "single" || question.type === "true_false") return <fieldset className="space-y-2"><legend className="mb-2 text-sm text-muted-foreground">اختر إجابة واحدة</legend>{options.map((option, index) => <label key={option.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/50"><input type="radio" name={`preview-${question.id}`} checked={response === option.id} onChange={() => setResponse(option.id)} className="size-4 accent-primary" /><span className="text-sm font-medium">{["أ", "ب", "ج", "د"][index] ?? index + 1}.</span><span>{option.text}</span></label>)}</fieldset>;
  if (question.type === "multi") { const selected = Array.isArray(response) ? response : []; return <fieldset className="space-y-2"><legend className="mb-2 text-sm text-muted-foreground">اختر كل الإجابات الصحيحة</legend>{options.map((option) => <label key={option.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/50"><input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => setResponse(event.target.checked ? [...selected, option.id] : selected.filter((id) => id !== option.id))} className="size-4 accent-primary" /><span>{option.text}</span></label>)}</fieldset>; }
  if (question.type === "short_answer") return <label className="block space-y-2"><span className="text-sm text-muted-foreground">اكتب إجابتك</span><input className={fieldClass} value={typeof response === "string" ? response : ""} onChange={(event) => setResponse(event.target.value)} /></label>;
  if (question.type === "essay") { const value = typeof response === "string" ? response : ""; const limit = typeof question.answer_key.word_limit === "number" ? question.answer_key.word_limit : null; const count = value.trim() ? value.trim().split(/\s+/).length : 0; return <label className="block space-y-2"><span className="text-sm text-muted-foreground">اكتب إجابتك</span><textarea className={`${fieldClass} min-h-40 resize-y leading-7`} value={value} onChange={(event) => setResponse(event.target.value)} /><span className="block text-xs text-muted-foreground">{count}{limit ? ` / ${limit}` : ""} كلمة · عدّاد الكلمات يتحدّث أثناء الكتابة</span></label>; }
  if (question.type === "ordering") { const ids = Array.isArray(response) ? response : options.map((option) => option.id); const arranged = ids.map((id) => options.find((option) => option.id === id)).filter((option): option is (typeof options)[number] => Boolean(option)); return <ol className="space-y-2">{arranged.map((option, index) => <li key={option.id} className="flex min-h-12 items-center gap-2 rounded-lg border p-2"><span className="min-w-6 text-center text-sm text-muted-foreground">{index + 1}</span><span className="min-w-0 flex-1">{option.text}</span><button type="button" className="flex size-11 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`تحريك ${option.text} لأعلى`} disabled={index === 0} onClick={() => { const next = [...ids]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setResponse(next); }}><ArrowUp className="size-4" aria-hidden="true" /></button><button type="button" className="flex size-11 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`تحريك ${option.text} لأسفل`} disabled={index === arranged.length - 1} onClick={() => { const next = [...ids]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; setResponse(next); }}><ArrowDown className="size-4" aria-hidden="true" /></button></li>)}</ol>; }
  if (question.type === "matching") { const matches = response && !Array.isArray(response) && typeof response === "object" ? response : {}; const rightOptions = Array.isArray(question.answer_key.right_options) ? question.answer_key.right_options as { id: string; text: string }[] : options; return <div className="space-y-3">{options.map((option) => <label key={option.id} className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><span>{option.text}</span><select className={fieldClass} value={matches[option.id] ?? ""} onChange={(event) => setResponse({ ...matches, [option.id]: event.target.value })}><option value="">اختر المطابقة</option>{rightOptions.map((right) => <option key={right.id} value={right.id}>{right.text}</option>)}</select></label>)}</div>; }
  return <p className="text-sm text-muted-foreground">لا يتوفر محرر لهذا النوع من الأسئلة.</p>;
}
