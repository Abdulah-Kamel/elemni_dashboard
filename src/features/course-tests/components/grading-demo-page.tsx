"use client";

import { useEffect, useState } from "react";
import { DEMO_TESTS_CHANGED } from "@/features/course-tests/demo-store";
import { getGradingQueue } from "@/features/course-tests/actions";
import { GradingQueue } from "@/features/course-tests/components/grading-queue";
import type { GradingQueueItem } from "@/features/course-tests/types";

export function GradingDemoPage({ testId, status }: { testId?: number; status: string }) {
  const [items, setItems] = useState<GradingQueueItem[]>([]);
  useEffect(() => {
    const update = () => setItems(getGradingQueue(testId, status));
    update();
    window.addEventListener(DEMO_TESTS_CHANGED, update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener(DEMO_TESTS_CHANGED, update); window.removeEventListener("storage", update); };
  }, [status, testId]);
  return <div className="space-y-4"><div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">وضع العرض التجريبي: التصحيح محفوظ محلياً في هذا المتصفح.</div><header><h1 className="text-3xl font-bold">التصحيح</h1><p className="mt-1 text-muted-foreground">راجع إجابات المقال وسجّل الدرجة والملاحظات.</p></header><GradingQueue key={`${testId ?? 0}:${status}`} initialItems={items} /></div>;
}
