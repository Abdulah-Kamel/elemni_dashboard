"use client";
/* eslint-disable @next/next/no-img-element -- preview renderers use native <img> for object URLs per spec */

import { useState, useMemo } from "react";
import type { StudentCoursePreviewModel, StudentPreviewSection, PreviewInteractionMode } from "./types";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Clock3,
  FileText,
  FolderOpen,
  LockKeyhole,
  PlayCircle,
  Video,
} from "lucide-react";

function formatDuration(minutes: number | null): string {
  if (!minutes) return "المدة غير محددة";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} س ${remainder} د` : `${hours} ساعات`;
}

function formatPrice(value: string | number): string {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(Number(value));
}

function chapterDuration(lessons: { durationMinutes: number | null }[]): number | null {
  const total = lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
  return total || null;
}

interface StudentCourseDetailPreviewProps {
  model: StudentCoursePreviewModel;
  locale: string;
  viewer: "guest" | "subscribed";
  interactionMode: PreviewInteractionMode;
  onCurriculumCommitted?: () => void;
}

export function StudentCourseDetailPreview({
  model,
  locale,
  viewer,
  interactionMode,
  onCurriculumCommitted,
}: StudentCourseDetailPreviewProps) {
  const sections = model.sections;
  const sectionsWithLessons = useMemo(() => sections.filter((s) => s.lessons.length), [sections]);
  const hasContent = sectionsWithLessons.length > 0;

  const firstSection = sectionsWithLessons[0];
  const firstLesson = firstSection?.lessons[0];

  const [expandedChapterId, setExpandedChapterId] = useState<string | number | null>(firstSection?.id ?? null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | number | null>(firstLesson?.id ?? null);

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const totalExams = sections.reduce(
    (sum, s) => sum + s.lessons.reduce((lSum, l) => lSum + l.items.filter((i) => i.hasExam).length, 0),
    0,
  );
  const totalDuration = sections.reduce(
    (sum, s) => sum + s.lessons.reduce((lSum, l) => lSum + (l.durationMinutes ?? 0), 0),
    0,
  );

  const toggleChapter = (chapterId: string | number) => {
    setExpandedChapterId((prev) => {
      const isOpening = prev !== chapterId;
      if (isOpening) {
        const section = sectionsWithLessons.find((s) => s.id === chapterId);
        setExpandedLessonId(section?.lessons[0]?.id ?? null);
      }
      return isOpening ? chapterId : null;
    });
  };

  const toggleLesson = (lessonId: string | number) => {
    setExpandedLessonId((prev) => (prev === lessonId ? null : lessonId));
  };

  const enrolled = viewer === "subscribed";

  return (
    <div dir="rtl" className="student-preview bg-[#FCFCFE] text-[#1B1B24]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
        {/* Back link (disabled) */}
        <span className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#777587] cursor-not-allowed opacity-60">
          <ChevronLeft className="size-4 rotate-180" />{enrolled ? "العودة إلى دوراتي" : "العودة"}
        </span>

        {/* Course hero */}
        <section className="rounded-2xl border border-[#E2E0EF] bg-white p-5 sm:p-7">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {model.subject && <span className="rounded-full bg-[#0284C7]/5 px-3 py-1 text-xs font-bold text-[#0369A1]">{model.subject}</span>}
                {(model.grade || model.stream) && <span className="rounded-full bg-[#F0F9FF] px-3 py-1 text-xs font-bold text-[#464555]">{[model.grade, model.stream].filter(Boolean).join(" - ")}</span>}
              </div>
              <h1 className="text-3xl font-black leading-tight text-[#1B1B24] sm:text-4xl line-clamp-2">{model.title}</h1>
              {model.teacher && (
                <div className="mt-5 flex w-fit items-center gap-3 rounded-lg">
                  {model.teacher.avatarUrl ? (
                    <img src={model.teacher.avatarUrl} alt={model.teacher.name} className="size-11 rounded-full border border-[#E2E0EF] object-cover" />
                  ) : (
                    <span className="flex size-11 items-center justify-center rounded-full bg-[#E0F2FE] text-sm font-black text-[#0369A1]">
                      {model.teacher.name.charAt(0)}
                    </span>
                  )}
                  <span><strong className="block text-sm font-black">{model.teacher.name}</strong><span className="text-xs text-[#777587]">مدرس {model.subject || "الكورس"}</span></span>
                </div>
              )}
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#464555] sm:text-base line-clamp-3">{model.description || "تابع محتوى الكورس ودروس المدرس من مكان واحد."}</p>
            </div>

            <div className="w-full lg:w-auto">
              <div className="mb-5 grid grid-cols-3 gap-3 text-center text-xs font-bold text-[#464555] sm:grid-cols-none sm:flex sm:justify-end sm:gap-5">
                <span className="grid justify-items-center gap-1"><PlayCircle className="size-5 text-[#0284C7]" />{totalLessons} درس</span>
                <span className="grid justify-items-center gap-1"><Clock3 className="size-5 text-[#0284C7]" />{formatDuration(totalDuration)}</span>
                <span className="grid justify-items-center gap-1"><ClipboardList className="size-5 text-[#0284C7]" />{totalExams} اختبار</span>
              </div>
              {enrolled ? (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-7 text-sm font-black text-white opacity-60 lg:w-auto"
                >
                  عرض محتوى الكورس
                  <ArrowLeft className="size-4" />
                </button>
              ) : (
                <button
                  disabled
                  aria-disabled="true"
                  className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-7 text-sm font-black text-white opacity-60 lg:w-auto"
                >
                  اشترك الآن - {formatPrice(model.price)} ج.م
                  <ArrowLeft className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#E2E0EF] pt-4 text-xs font-bold text-[#777587]">
            {!!sections.length && (
              <span className="inline-flex items-center gap-2">
                <FolderOpen className="size-4 text-[#0284C7]" />
                {sections.length} {sections.length === 1 ? "وحدة" : "وحدات"}
              </span>
            )}
          </div>
        </section>

        {/* Tabs (disabled except content) */}
        <nav className="mt-8 flex gap-2 overflow-x-auto border-b border-[#E2E0EF]" aria-label="أقسام الكورس">
          {["المحتوى", "الاختبارات", "الملفات", "المناقشات", "التقدم"].map((tab, index) => (
            <button
              key={tab}
              type="button"
              disabled={index !== 0}
              title={index !== 0 ? `${tab} - قريباً` : undefined}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-black ${index === 0 ? "border-[#0284C7] text-[#0369A1]" : "cursor-not-allowed border-transparent text-[#A6A3B5]"}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Content section */}
        <section className="pt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
            <h2 className="text-2xl font-black text-[#1B1B24] sm:text-3xl">{enrolled ? "محتوى الكورس" : "خطة الكورس"}</h2>
            <p className="text-xs font-bold text-[#777587]">
              {totalLessons ? `${totalLessons} درس · ${formatDuration(totalDuration)}` : "سيظهر المحتوى المنشور هنا"}
            </p>
          </div>

          {hasContent ? (
            <div className="space-y-3">
              {sectionsWithLessons.map((section) => (
                <Section
                  key={section.id}
                  section={section}
                  expanded={expandedChapterId === section.id}
                  expandedLessonId={expandedLessonId}
                  onToggleChapter={() => toggleChapter(section.id)}
                  onToggleLesson={toggleLesson}
                  viewer={viewer}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-[#E2E0EF] bg-white px-4 text-center">
              <BookOpen className="mb-4 size-10 text-[#C7C4D8]" />
              <h3 className="text-lg font-black">محتوى الكورس غير متاح حالياً</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#777587]">عند نشر المدرس للدروس والمواد التعليمية ستظهر هنا تلقائياً.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Section({
  section,
  expanded,
  expandedLessonId,
  onToggleChapter,
  onToggleLesson,
  viewer,
}: {
  section: StudentPreviewSection;
  expanded: boolean;
  expandedLessonId: string | number | null;
  onToggleChapter: () => void;
  onToggleLesson: (id: string | number) => void;
  viewer: "guest" | "subscribed";
}) {
  const duration = chapterDuration(section.lessons);

  return (
    <div className="overflow-hidden rounded-xl border border-[#DDD9E8] bg-white">
      <button
        type="button"
        onClick={onToggleChapter}
        aria-expanded={expanded}
        className={`flex min-h-15 w-full cursor-pointer items-center gap-4 px-4 py-4 text-start transition-colors sm:px-5 ${expanded ? "bg-[#F0F9FF]" : "hover:bg-[#FAF9FD]"}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <h3 className={`truncate text-base font-black sm:text-lg ${expanded ? "text-[#0369A1]" : "text-[#292733]"}`}>
            {section.title || "دروس الكورس"}
          </h3>
          <ChevronDown className={`size-4 shrink-0 text-[#777587] transition-transform ${expanded ? "rotate-180" : ""}`} />
        </span>
        <span className="shrink-0 text-xs font-medium text-[#777587]">
          {section.lessons.length} دروس · {formatDuration(duration)}
        </span>
      </button>

      {expanded && (
        <div className="overflow-hidden border-t border-[#DDD9E8]">
          {section.lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              expanded={expandedLessonId === lesson.id}
              onToggle={() => onToggleLesson(lesson.id)}
              viewer={viewer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  expanded,
  onToggle,
  viewer,
}: {
  lesson: { id: string | number; title: string; description: string | null; durationMinutes: number | null; items: { id: string | number; title: string; hasVideo: boolean; hasDocument: boolean; hasExam: boolean }[] };
  expanded: boolean;
  onToggle: () => void;
  viewer: "guest" | "subscribed";
}) {
  const hasVideo = lesson.items.some((i) => i.hasVideo);
  const hasDocument = lesson.items.some((i) => i.hasDocument);

  return (
    <div className="border-b border-[#E8E5F0] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-h-18 w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-[#F0F9FF] sm:px-5"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F0F9FF] text-[#0284C7]">
          {hasVideo ? <PlayCircle className="size-5" /> : hasDocument ? <FileText className="size-5" /> : <BookOpen className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-bold leading-6 text-[#292733] sm:text-base">{lesson.title}</strong>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#777587]">
            <span>{formatDuration(lesson.durationMinutes)}</span>
            {hasVideo && <span>فيديو</span>}
            {hasDocument && <span>ملفات</span>}
            {lesson.items.some((i) => i.hasExam) && <span>اختبار</span>}
          </span>
        </span>
        <ChevronLeft className={`size-4 shrink-0 text-[#A6A3B5] transition-transform ${expanded ? "-rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="space-y-2 overflow-hidden bg-[#FAF9FD] px-4 py-4 sm:ps-16">
          {lesson.description && <p className="pb-2 text-sm leading-6 text-[#777587]">{lesson.description}</p>}
          {lesson.items.length ? (
            lesson.items.map((item) => {
              const ItemIcon = item.hasVideo ? Video : item.hasDocument ? FileText : ClipboardList;
              const itemMeta = [
                item.hasVideo ? "فيديو" : null,
                item.hasDocument ? "ملف" : null,
                item.hasExam ? "اختبار" : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-[#E2E0EF] bg-white px-3 py-3 text-start">
                  <ItemIcon className="size-5 shrink-0 text-[#777587]" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{item.title}</strong>
                    <span className="text-xs text-[#777587]">{itemMeta || "محتوى الدرس"}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#A6A3B5]">
                    {viewer === "guest" && <LockKeyhole className="size-3.5" />}
                    {viewer === "guest" ? "يتطلب الاشتراك" : "غير متاح حالياً"}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm font-medium text-[#777587]">لم تتم إضافة مواد لهذا الدرس بعد.</p>
          )}
        </div>
      )}
    </div>
  );
}
