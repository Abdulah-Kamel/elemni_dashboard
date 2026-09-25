"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { gradeEssay } from "../actions";
import type { GradingQueueItem } from "../types";

export function GradingQueue({ initialItems }: { initialItems: GradingQueueItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [points, setPoints] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [busy, startTransition] = useTransition();
  const current = items[currentIndex] ?? null;
  const maxPoints = current?.question.points ?? 0;
  const attemptMax = current?.max_score ?? 0;
  const subtotal = current?.score_auto ?? 0;
  const totalAfter = subtotal + (points ?? 0);

  async function saveAndNext(skip = false) {
    if (!current) return;
    if (!skip && points === null) { toast.error("اختر درجة الإجابة أولاً."); return; }
    startTransition(async () => {
      try {
        if (!skip) await gradeEssay(current.answer_id, points!, feedback);
        const next = items.filter((item) => item.answer_id !== current.answer_id);
        setItems(next);
        setCurrentIndex(Math.min(currentIndex, next.length - 1));
        setPoints(null);
        setFeedback("");
        toast.success(skip ? "تم تخطي الإجابة." : "حُفظ التصحيح.");
      } catch { toast.error("تعذر حفظ التصحيح."); }
    });
  }

  if (!current) return <div className="grid min-h-80 place-items-center rounded-xl border bg-card p-8 text-center"><div><h2 className="text-xl font-bold">لا توجد إجابات بانتظار التصحيح</h2><p className="mt-2 text-sm text-muted-foreground">ستظهر إجابات المقال هنا بعد تسليم الطلاب للاختبار.</p></div></div>;

  const model = String(current.question.answer_key.model_answer ?? "لم يضف المدرّس إجابة نموذجية.");
  const rubric = current.question.answer_key.rubric;
  return <div dir="rtl" className="grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
    <aside className="rounded-xl border bg-card p-4"><h2 className="font-bold">قائمة التصحيح ({items.length})</h2><label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />إخفاء أسماء الطلاب أثناء التصحيح</label><ol className="mt-3 max-h-[60vh] space-y-2 overflow-auto">{items.map((item, index) => <li key={item.answer_id}><button onClick={() => { setCurrentIndex(index); setPoints(null); setFeedback(""); }} aria-current={index === currentIndex ? "true" : undefined} className={`w-full rounded-lg border p-3 text-start ${index === currentIndex ? "border-primary bg-primary/5" : "border-border"}`}><span className="block font-semibold">{anonymous ? `طالب ${index + 1}` : item.student.name}</span><span className="mt-1 block text-xs text-muted-foreground">المحاولة {item.attempt_number} · {item.submitted_at ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(item.submitted_at)) : "تم التسليم"}</span><span className="mt-1 block truncate text-xs">{item.test.title}</span></button></li>)}</ol></aside>
    <section className="space-y-5 rounded-xl border bg-card p-5"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-bold">{current.test.title} · المحاولة {current.attempt_number}</h1><p className="mt-1 text-sm text-muted-foreground">{anonymous ? "اسم الطالب مخفي" : current.student.name}</p></div><p className="text-sm">الأسئلة الآلية: <strong>{subtotal} / {attemptMax}</strong></p></header>
      <article className="rounded-xl bg-muted/50 p-4"><p className="text-sm font-semibold text-muted-foreground">السؤال · {maxPoints} نقاط</p><h2 className="mt-2 font-bold leading-7">{current.question.text}</h2><div className="mt-4 rounded-lg border bg-background p-4"><p className="text-xs font-semibold text-muted-foreground">إجابة الطالب</p><p className="mt-2 whitespace-pre-wrap leading-7">{current.response || "لم يكتب إجابة."}</p><p className="mt-2 text-xs text-muted-foreground">{(current.response ?? "").trim().split(/\s+/).filter(Boolean).length} كلمة</p></div></article>
      <div className="grid gap-4 md:grid-cols-2"><section className="rounded-xl border p-4"><h3 className="font-semibold">الإجابة النموذجية</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{model}</p></section><section className="rounded-xl border p-4"><h3 className="font-semibold">معايير التقييم</h3><div className="mt-2 text-sm leading-6">{Array.isArray(rubric) ? <ul className="list-inside list-disc">{rubric.map((row, index) => <li key={index}>{String((row as { criterion?: unknown }).criterion)} · {String((row as { points?: unknown }).points)} نقاط</li>)}</ul> : <p>{String(rubric ?? "استخدم الإجابة النموذجية لتقييم وضوح الفكرة ودقتها.")}</p>}</div></section></div>
      <fieldset><legend className="mb-2 font-semibold">الدرجة</legend><div className="flex flex-wrap gap-2">{Array.from({ length: maxPoints + 1 }, (_, score) => <button key={score} type="button" aria-pressed={points === score} onClick={() => setPoints(score)} className={`min-h-11 min-w-11 rounded-lg border px-3 font-bold tabular-nums ${points === score ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>{score}</button>)}</div></fieldset>
      <div className="rounded-lg bg-muted p-4 text-sm">المجموع بعد التصحيح: <strong>{points === null ? subtotal : totalAfter} / {attemptMax}</strong>{points !== null && <span> · {attemptMax ? Math.round(totalAfter / attemptMax * 100) : 0}% · {attemptMax && totalAfter / attemptMax * 100 >= 60 ? "ناجح" : "لم يجتز"}</span>}</div>
      <label className="block space-y-1"><span className="text-sm font-semibold">ملاحظة للطالب (اختياري)</span><Textarea rows={3} value={feedback} onChange={(event) => setFeedback(event.target.value)} /></label>
      <footer className="flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={() => void saveAndNext(true)} disabled={busy}>تخطٍّ</Button><Button onClick={() => void saveAndNext()} disabled={busy || points === null}>{busy ? "جارٍ الحفظ…" : "حفظ والانتقال للتالي"}</Button></footer>
    </section>
  </div>;
}
