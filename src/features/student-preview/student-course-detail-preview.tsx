"use client"
/* eslint-disable @next/next/no-img-element -- preview renderers use native <img> for object URLs per spec */

import { useCallback, useEffect, useRef, useState } from "react"
import type {
  StudentCoursePreviewModel,
  StudentPreviewSection,
  PreviewInteractionMode,
} from "./types"
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Clock3,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  FileText,
  LockKeyhole,
  PlayCircle,
  Video,
} from "lucide-react"
import { useCourseBuilderBridge } from "@/features/course-management/course-builder-bridge"
import type { CourseBuilderField } from "@/features/course-management/course-builder-bridge"
import type { CourseBuilderNode } from "./types"
import { cn } from "@/lib/utils"
import { MarkerHighlight } from "./marker-highlight"
import { StudentPreviewCover } from "./student-preview-cover"

type CoursePreviewCopy = {
  backToDiscovery: string
  teacherLabel: (subject: string) => string
  fallbackDescription: string
  lessonCount: (count: number) => string
  examCount: (count: number) => string
  durationUnknown: string
  durationMinutes: (count: number) => string
  durationHours: (hours: number, minutes: number) => string
  fallbackTitle: string
  placeholderDescription: string
  subscribeCta: string
  checkoutPrice: string
  securePayment: string
  couponLabel: string
  couponPlaceholder: string
  couponApply: string
  accessDuration: string
  publishedContent: string
  signInToContinue: string
  currency: string
  lastUpdated: string
  dateUnknown: string
  curriculumDescription: string
  contentTitle: string
  contentSummary: (lessons: number, duration: string) => string
  contentSummaryEmpty: string
  emptyTitle: string
  emptyBody: string
  chapterFallback: string
  chapterSummary: (lessons: number, duration: string) => string
  video: string
  files: string
  exam: string
  itemFallback: string
  accessRequired: string
  emptyLesson: string
  selectItem: string
}

const COURSE_PREVIEW_COPY: Record<"ar" | "en", CoursePreviewCopy> = {
  ar: {
    backToDiscovery: "العودة إلى الاستكشاف",
    teacherLabel: (subject) => `مدرس ${subject || "الكورس"}`,
    fallbackDescription: "تابع محتوى الكورس ودروس المدرس من مكان واحد.",
    lessonCount: (count) =>
      count === 0
        ? "لا توجد دروس"
        : count === 1
          ? "درس واحد"
          : count === 2
            ? "درسان"
            : `${count} ${new Intl.PluralRules("ar").select(count) === "few" ? "دروس" : new Intl.PluralRules("ar").select(count) === "many" ? "درساً" : "درس"}`,
    examCount: (count) => `${count} اختبار`,
    durationUnknown: "المدة غير محددة",
    durationMinutes: (count) =>
      count === 1
        ? "دقيقة واحدة"
        : count === 2
          ? "دقيقتان"
          : `${count} ${new Intl.PluralRules("ar").select(count) === "few" ? "دقائق" : "دقيقة"}`,
    durationHours: (hours, minutes) => {
      const duration =
        hours === 1
          ? "ساعة واحدة"
          : hours === 2
            ? "ساعتان"
            : `${hours} ${new Intl.PluralRules("ar").select(hours) === "few" ? "ساعات" : "ساعة"}`
      return minutes
        ? `${duration} ${COURSE_PREVIEW_COPY.ar.durationMinutes(minutes)}`
        : duration
    },
    fallbackTitle: "عنوان الكورس",
    placeholderDescription: "وصف الكورس",
    subscribeCta: "اشترك في الكورس",
    checkoutPrice: "السعر المستحق",
    securePayment: "دفع آمن",
    couponLabel: "كود الخصم",
    couponPlaceholder: "ادخل كود الخصم",
    couponApply: "تطبيق",
    accessDuration: "اشتراك لمدة 30 يوماً",
    publishedContent: "المحتوى المنشور",
    signInToContinue: "سجل الدخول للمتابعة",
    currency: "ج.م",
    lastUpdated: "آخر تحديث",
    dateUnknown: "التاريخ غير محدد",
    curriculumDescription: "راجع الوحدات والدروس قبل أن تبدأ رحلة التعلم.",
    contentTitle: "خطة الكورس",
    contentSummary: (lessons, duration) => `${lessons} درس · ${duration}`,
    contentSummaryEmpty: "سيظهر المحتوى المنشور هنا",
    emptyTitle: "محتوى الكورس غير متاح حالياً",
    emptyBody: "عند نشر المدرس للدروس والمواد التعليمية ستظهر هنا تلقائياً.",
    chapterFallback: "دروس الكورس",
    chapterSummary: (lessons, duration) =>
      `${COURSE_PREVIEW_COPY.ar.lessonCount(lessons)} · ${duration}`,
    video: "فيديو",
    files: "ملف",
    exam: "اختبار",
    itemFallback: "محتوى الدرس",
    accessRequired: "يتطلب الاشتراك",
    emptyLesson: "لم تتم إضافة مواد لهذا الدرس بعد.",
    selectItem: "تحديد العنصر للتعديل",
  },
  en: {
    backToDiscovery: "Back to explore",
    teacherLabel: (subject) => `${subject || "Course"} instructor`,
    fallbackDescription: "Follow the course content and lessons in one place.",
    lessonCount: (count) =>
      count === 0
        ? "No lessons"
        : `${count} ${count === 1 ? "lesson" : "lessons"}`,
    examCount: (count) => `${count} ${count === 1 ? "exam" : "exams"}`,
    durationUnknown: "Duration not specified",
    durationMinutes: (count) =>
      `${count} ${count === 1 ? "minute" : "minutes"}`,
    durationHours: (hours, minutes) =>
      `${hours} ${hours === 1 ? "hour" : "hours"}${minutes ? ` ${minutes} ${minutes === 1 ? "minute" : "minutes"}` : ""}`,
    fallbackTitle: "Course title",
    placeholderDescription: "Course description",
    subscribeCta: "Enroll in this course",
    checkoutPrice: "Amount due",
    securePayment: "Secure payment",
    couponLabel: "Coupon code",
    couponPlaceholder: "Enter coupon code",
    couponApply: "Apply",
    accessDuration: "30-day access",
    publishedContent: "Published content",
    signInToContinue: "Sign in to continue",
    currency: "EGP",
    lastUpdated: "Last updated",
    dateUnknown: "Date not specified",
    curriculumDescription:
      "Review the sections and lessons before you start learning.",
    contentTitle: "Course plan",
    contentSummary: (lessons, duration) =>
      `${lessons} ${lessons === 1 ? "lesson" : "lessons"} · ${duration}`,
    contentSummaryEmpty: "Published content will appear here",
    emptyTitle: "Course content is not available yet",
    emptyBody:
      "Lessons and materials will appear here when the teacher publishes them.",
    chapterFallback: "Course lessons",
    chapterSummary: (lessons, duration) =>
      `${lessons} ${lessons === 1 ? "lesson" : "lessons"} · ${duration}`,
    video: "Video",
    files: "File",
    exam: "Exam",
    itemFallback: "Lesson content",
    accessRequired: "Enrollment required",
    emptyLesson: "No materials have been added to this lesson yet.",
    selectItem: "Select item to edit",
  },
}

function formatDuration(
  minutes: number | null,
  copy: CoursePreviewCopy
): string {
  if (!minutes) return copy.durationUnknown
  if (minutes < 60) return copy.durationMinutes(minutes)
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return copy.durationHours(hours, remainder)
}

function formatPrice(value: string | number, lang: "ar" | "en"): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function chapterDuration(
  lessons: { durationMinutes: number | null }[]
): number | null {
  const total = lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0)
  return total || null
}

function sameNode(
  left: CourseBuilderNode | null,
  right: CourseBuilderNode
): boolean {
  return left?.type === right.type && String(left.id) === String(right.id)
}

function CoursePreviewField({
  field,
  ariaLabel,
  className,
  overlay = true,
  children,
}: {
  field: CourseBuilderField
  ariaLabel: string
  className?: string
  overlay?: boolean
  children: React.ReactNode
}) {
  const { enabled, hoveredField, selectedField, setHoveredField, selectField } =
    useCourseBuilderBridge()
  const active = enabled && (hoveredField === field || selectedField === field)

  return (
    <div
      data-course-preview-field={field}
      data-course-preview-state={
        enabled && selectedField === field
          ? "selected"
          : enabled && hoveredField === field
            ? "hovered"
            : "idle"
      }
      className={cn(
        "relative transition-[box-shadow,background-color] duration-200 outline-none",
        className,
        enabled && "cursor-pointer",
        active &&
          "bg-primary/5 shadow-[0_0_22px_rgb(14_165_233_/_0.2)] ring-2 ring-sky-400/75 ring-offset-2 ring-offset-[var(--page)]"
      )}
      onMouseEnter={() => enabled && setHoveredField(field)}
      onMouseLeave={() => setHoveredField(null)}
      onClick={!overlay && enabled ? () => selectField(field) : undefined}
    >
      {children}
      {enabled && overlay && (
        <button
          type="button"
          aria-label={ariaLabel}
          className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page)]"
          onMouseEnter={() => setHoveredField(field)}
          onMouseLeave={() => setHoveredField(null)}
          onClick={() => selectField(field)}
        />
      )}
    </div>
  )
}

interface StudentCourseDetailPreviewProps {
  model: StudentCoursePreviewModel
  locale: string
  /** @deprecated The preview always represents the public student view. */
  viewer?: "guest" | "subscribed"
  interactionMode: PreviewInteractionMode
  onCurriculumCommitted?: () => void
  selectedNode?: CourseBuilderNode | null
  onSelectNode?: (node: CourseBuilderNode) => void
  showEditAffordance?: boolean
  /** Hides the curriculum content section for pre-creation previews. */
  hideCurriculum?: boolean
}

export function StudentCourseDetailPreview({
  model,
  locale,
  selectedNode: selectedNodeProp,
  onSelectNode: onSelectNodeProp,
  showEditAffordance = false,
  hideCurriculum = false,
}: StudentCourseDetailPreviewProps) {
  const lang = locale.toLowerCase().startsWith("ar") ? "ar" : "en"
  const copy = COURSE_PREVIEW_COPY[lang]
  const bridge = useCourseBuilderBridge()
  const selectedNode =
    selectedNodeProp === undefined
      ? bridge.enabled
        ? bridge.selectedNode
        : null
      : selectedNodeProp
  const onSelectNode = onSelectNodeProp ?? bridge.selectNode
  const previewSelectionRef = useRef(false)
  const sections = model.sections
  const hasContent = sections.length > 0

  const firstSection = sections[0]
  const firstLesson = firstSection?.lessons[0]

  const [expandedChapterId, setExpandedChapterId] = useState<
    string | number | null
  >(firstSection?.id ?? null)
  const [expandedLessonId, setExpandedLessonId] = useState<
    string | number | null
  >(firstLesson?.id ?? null)

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0)
  const totalExams = sections.reduce(
    (sum, s) =>
      sum +
      s.lessons.reduce(
        (lSum, l) => lSum + l.items.filter((i) => i.hasExam).length,
        0
      ),
    0
  )
  const totalDuration = sections.reduce(
    (sum, s) =>
      sum + s.lessons.reduce((lSum, l) => lSum + (l.durationMinutes ?? 0), 0),
    0
  )

  const toggleChapter = (chapterId: string | number) => {
    setExpandedChapterId((prev) => {
      const isOpening = prev !== chapterId
      if (isOpening) {
        const section = sections.find((s) => s.id === chapterId)
        setExpandedLessonId(section?.lessons[0]?.id ?? null)
      }
      return isOpening ? chapterId : null
    })
  }

  const toggleLesson = (lessonId: string | number) => {
    setExpandedLessonId((prev) => (prev === lessonId ? null : lessonId))
  }

  const selectPreviewNode = useCallback(
    (node: CourseBuilderNode) => {
      previewSelectionRef.current = true
      onSelectNode(node)
    },
    [onSelectNode]
  )

  useEffect(() => {
    if (!selectedNode) return

    // Preview clicks already control their own expand/collapse behavior.
    // Only selections originating in the curriculum editor should open the
    // corresponding preview location automatically.
    if (previewSelectionRef.current) {
      previewSelectionRef.current = false
      return
    }

    const selectedSection =
      selectedNode.chapterId !== undefined
        ? sections.find(
            (section) => String(section.id) === String(selectedNode.chapterId)
          )
        : selectedNode.type === "chapter"
          ? sections.find(
              (section) => String(section.id) === String(selectedNode.id)
            )
          : sections.find((section) =>
              section.lessons.some((lesson) =>
                selectedNode.type === "lesson"
                  ? String(lesson.id) === String(selectedNode.id)
                  : lesson.items.some(
                      (item) => String(item.id) === String(selectedNode.id)
                    )
              )
            )

    if (!selectedSection) return

    const selectedLesson =
      selectedNode.type === "chapter"
        ? selectedSection.lessons[0]
        : selectedNode.lessonId !== undefined
          ? selectedSection.lessons.find(
              (lesson) => String(lesson.id) === String(selectedNode.lessonId)
            )
          : selectedSection.lessons.find((lesson) =>
              selectedNode.type === "lesson"
                ? String(lesson.id) === String(selectedNode.id)
                : lesson.items.some(
                    (item) => String(item.id) === String(selectedNode.id)
                  )
            )

    const timeout = window.setTimeout(() => {
      setExpandedChapterId(selectedSection.id)
      setExpandedLessonId(selectedLesson?.id ?? null)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [sections, selectedNode])

  const fieldEditLabels: Record<CourseBuilderField, string> =
    lang === "ar"
      ? {
          title: "تعديل عنوان الكورس",
          description: "تعديل وصف الكورس",
          price: "تعديل سعر الكورس",
        }
      : {
          title: "Edit course title",
          description: "Edit course description",
          price: "Edit course price",
        }

  const titleIsPlaceholder = !model.title || model.title === copy.fallbackTitle
  const descriptionIsPlaceholder =
    !model.description || model.description === copy.placeholderDescription
  const date = model.createdAt ? new Date(model.createdAt) : null
  const displayDate =
    date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(date)
      : copy.dateUnknown

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="student-preview min-h-full bg-[var(--color-page)] text-[var(--color-ink)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-7 @sm/preview:px-6 @sm/preview:py-8 @5xl/preview:px-8">
        <span
          aria-disabled="true"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {copy.backToDiscovery}
        </span>

        <div className="grid items-start gap-8 @5xl/preview:grid-cols-[minmax(19rem,24rem)_minmax(0,1fr)]">
          {/* Contents on phones places checkout between hero and curriculum, as on the student page. */}
          <div className="contents @5xl/preview:order-2 @5xl/preview:block @5xl/preview:min-w-0 @5xl/preview:space-y-8">
            <section
              className="preview-hero order-1 min-w-0 overflow-hidden"
              aria-labelledby="course-preview-title"
            >
              <div className="grid @5xl/preview:grid-cols-[minmax(0,1fr)_minmax(0,36%)]">
                <div className="order-2 flex min-w-0 flex-col justify-between p-6 @sm/preview:p-9 @5xl/preview:order-1 @5xl/preview:p-10">
                  <div>
                    <div className="mb-5 flex flex-wrap gap-2 text-xs font-black">
                      {model.subject && (
                        <span className="sticker-badge -rotate-1 bg-amber-300 px-3 py-1.5 text-slate-950">
                          {model.subject}
                        </span>
                      )}
                      {(model.grade || model.stream) && (
                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[#D6E5F2]">
                          {[model.grade, model.stream]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </div>
                    <CoursePreviewField
                      field="title"
                      ariaLabel={fieldEditLabels.title}
                      className="rounded-lg"
                    >
                      <h1
                        id="course-preview-title"
                        className={cn(
                          "text-3xl leading-[1.12] font-black tracking-[-0.025em] text-balance break-words @sm/preview:text-4xl @5xl/preview:text-[2.9rem]",
                          titleIsPlaceholder &&
                            "text-[var(--preview-hero-muted)]"
                        )}
                      >
                        <MarkerHighlight>
                          {model.title || copy.fallbackTitle}
                        </MarkerHighlight>
                      </h1>
                    </CoursePreviewField>
                    <CoursePreviewField
                      field="description"
                      ariaLabel={fieldEditLabels.description}
                      className="mt-5 rounded-lg"
                    >
                      <p
                        className={cn(
                          "text-sm leading-7 whitespace-pre-line text-[var(--preview-hero-muted)] @sm/preview:text-base",
                          descriptionIsPlaceholder && "italic"
                        )}
                      >
                        {model.description || copy.placeholderDescription}
                      </p>
                    </CoursePreviewField>
                    {model.teacher && (
                      <div className="mt-7 inline-flex w-fit items-center gap-3 rounded-xl">
                        {model.teacher.avatarUrl ? (
                          <img
                            src={model.teacher.avatarUrl}
                            alt={model.teacher.name}
                            className="size-12 rounded-full border border-white/20 object-cover"
                          />
                        ) : (
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#BFE8FF] text-lg font-semibold text-[#075985]">
                            {model.teacher.name.charAt(0)}
                          </span>
                        )}
                        <span>
                          <strong className="block text-sm font-black text-white">
                            {model.teacher.name}
                          </strong>
                          <span className="mt-0.5 block text-xs text-[#A9C0D2]">
                            {copy.teacherLabel(model.subject ?? "")}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-xs font-bold text-[var(--preview-hero-muted)] @sm/preview:flex @sm/preview:flex-wrap @sm/preview:gap-x-7">
                    <span className="inline-flex items-center gap-2">
                      <PlayCircle
                        className="size-4 shrink-0 text-sky-300"
                        aria-hidden="true"
                      />
                      {copy.lessonCount(totalLessons)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock3
                        className="size-4 shrink-0 text-sky-300"
                        aria-hidden="true"
                      />
                      {formatDuration(totalDuration, copy)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <BookOpen
                        className="size-4 shrink-0 text-sky-300"
                        aria-hidden="true"
                      />
                      {copy.examCount(totalExams)}
                    </span>
                    <span
                      className="inline-flex items-center gap-2"
                      title={copy.lastUpdated}
                    >
                      <CalendarDays
                        className="size-4 shrink-0 text-sky-300"
                        aria-hidden="true"
                      />
                      {displayDate}
                    </span>
                  </div>
                </div>
                <div className="relative order-1 aspect-[16/10] min-h-56 overflow-hidden bg-[var(--preview-hero-cover)] @5xl/preview:order-2 @5xl/preview:aspect-auto @5xl/preview:min-h-[25rem]">
                  <StudentPreviewCover
                    src={model.coverUrl}
                    subject={model.subject}
                    alt={model.title || copy.fallbackTitle}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[#07131F]/20" />
                </div>
              </div>
            </section>

            {!hideCurriculum && (
              <section
                id="course-preview-content"
                className="order-3 min-w-0 scroll-mt-24"
                aria-labelledby="course-preview-content-title"
              >
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2
                      id="course-preview-content-title"
                      className="text-3xl font-black tracking-tight @sm/preview:text-4xl"
                    >
                      <MarkerHighlight color="sky">
                        {copy.contentTitle}
                      </MarkerHighlight>
                    </h2>
                    <p className="mt-2 max-w-[65ch] text-sm font-medium text-[var(--color-muted)]">
                      {copy.curriculumDescription}
                    </p>
                  </div>
                  <p className="sticker-badge bg-[var(--color-surface)] px-3 py-1 text-xs font-black text-[var(--color-muted)]">
                    {totalLessons
                      ? copy.lessonCount(totalLessons)
                      : copy.contentSummaryEmpty}
                  </p>
                </div>
                {hasContent ? (
                  <div className="space-y-3">
                    {sections.map((section, sectionIndex) => (
                      <Section
                        key={`${section.id}-${sectionIndex}`}
                        section={section}
                        sectionIndex={sectionIndex}
                        expanded={expandedChapterId === section.id}
                        expandedLessonId={expandedLessonId}
                        onToggleChapter={() => toggleChapter(section.id)}
                        onToggleLesson={toggleLesson}
                        copy={copy}
                        selectedNode={selectedNode}
                        onSelectNode={selectPreviewNode}
                        showEditAffordance={showEditAffordance}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="sticker-tile flex min-h-64 flex-col items-center justify-center px-5 text-center">
                    <BookOpen
                      className="mb-4 size-10 text-[var(--color-muted)]"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-black">
                      <MarkerHighlight color="pink">
                        {copy.emptyTitle}
                      </MarkerHighlight>
                    </h3>
                    <p className="mt-2 w-full text-sm leading-6 text-[var(--color-muted)]">
                      {copy.emptyBody}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="order-2 min-w-0 @5xl/preview:sticky @5xl/preview:top-6 @5xl/preview:order-1">
            <section
              className="sticker-tile p-5 @sm/preview:p-6"
              aria-label={copy.checkoutPrice}
            >
              <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[var(--color-ink)]/10 pb-5">
                <CoursePreviewField
                  field="price"
                  ariaLabel={fieldEditLabels.price}
                  className="min-w-0 rounded-lg"
                >
                  <p className="text-xs font-black text-[var(--color-muted)]">
                    {copy.checkoutPrice}
                  </p>
                  <p className="sticker-numeral mt-1 text-4xl font-black tracking-tight">
                    {formatPrice(model.price, lang)}{" "}
                    <span className="text-lg">{copy.currency}</span>
                  </p>
                </CoursePreviewField>
                <span className="sticker-badge inline-flex -rotate-1 items-center gap-1.5 bg-[var(--brand-indigo-tint)] px-3 py-1.5 text-xs font-black text-[var(--on-primary-tint)]">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {copy.securePayment}
                </span>
              </div>
              <div className="flex gap-2 border-b-2 border-[var(--color-ink)]/10 py-4">
                <input
                  disabled
                  aria-label={copy.couponLabel}
                  placeholder={copy.couponPlaceholder}
                  className="h-11 min-w-0 flex-1 rounded-xl border-2 border-dashed border-[var(--color-ink)]/25 bg-[var(--color-surface)] px-3 text-sm font-bold placeholder:text-[var(--color-muted)] disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled
                  className="sticker-btn-outline h-11 shrink-0 px-4 text-sm font-black disabled:opacity-50"
                >
                  {copy.couponApply}
                </button>
              </div>
              <div className="space-y-3 py-5 text-sm font-medium text-[var(--color-muted)]">
                <p className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-[var(--brand-indigo)]"
                    aria-hidden="true"
                  />
                  {copy.accessDuration}
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-[var(--brand-indigo)]"
                    aria-hidden="true"
                  />
                  {copy.publishedContent}
                </p>
              </div>
              <button
                type="button"
                aria-disabled="true"
                className="sticker-btn flex min-h-13 w-full items-center justify-center px-5 py-3.5 text-sm font-black"
              >
                {copy.subscribeCta}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-bold text-[var(--color-muted)]">
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                {copy.signInToContinue}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Section({
  section,
  sectionIndex,
  expanded,
  expandedLessonId,
  onToggleChapter,
  onToggleLesson,
  copy,
  selectedNode,
  onSelectNode,
  showEditAffordance,
}: {
  section: StudentPreviewSection
  sectionIndex: number
  expanded: boolean
  expandedLessonId: string | number | null
  onToggleChapter: () => void
  onToggleLesson: (id: string | number) => void
  copy: CoursePreviewCopy
  selectedNode: CourseBuilderNode | null
  onSelectNode: (node: CourseBuilderNode) => void
  showEditAffordance: boolean
}) {
  const duration = chapterDuration(section.lessons)
  const headingId = `course-preview-chapter-${sectionIndex}`
  const contentId = `${headingId}-content`
  const { enabled, hoveredNode, setHoveredNode } = useCourseBuilderBridge()
  const node: CourseBuilderNode = { type: "chapter", id: section.id }
  const isSelected = sameNode(selectedNode, node)
  const isHovered = sameNode(hoveredNode, node)

  return (
    <section
      className="sticker-tile overflow-hidden"
      aria-labelledby={headingId}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => {
          onSelectNode(node)
          onToggleChapter()
        }}
        data-course-preview-node-type="chapter"
        data-course-preview-node-id={section.id}
        onMouseEnter={() => enabled && setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
        className={`flex min-h-16 w-full cursor-pointer items-center gap-4 px-4 py-4 text-start transition-colors @sm/preview:px-5 ${expanded ? "bg-[var(--brand-indigo-tint)]" : "hover:bg-[var(--surface-muted)]"} ${isHovered ? "ring-2 ring-sky-400/70 ring-inset" : ""} ${isSelected ? "ring-2 ring-[var(--brand-indigo)] ring-inset" : ""}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <h3
            id={headingId}
            className={`truncate text-base font-black @sm/preview:text-lg ${expanded ? "text-[var(--brand-indigo-deep)]" : "text-[var(--color-ink)]"}`}
          >
            {section.title || copy.chapterFallback}
          </h3>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-transform motion-reduce:transition-none",
              expanded
                ? "rotate-180 border-[var(--color-line)] bg-slate-900 text-white dark:bg-sky-600"
                : "border-[var(--color-ink)]/20 text-[var(--color-muted)]"
            )}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </span>
        </span>
        <span className="sticker-numeral max-w-[45%] shrink-0 text-xs font-black text-[var(--color-muted)]">
          {copy.chapterSummary(
            section.lessons.length,
            formatDuration(duration, copy)
          )}
        </span>
      </button>

      {expanded && (
        <div
          id={contentId}
          className="overflow-hidden border-t border-[var(--border-strong)]"
        >
          {section.lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              chapterId={section.id}
              expanded={expandedLessonId === lesson.id}
              onToggle={() => onToggleLesson(lesson.id)}
              copy={copy}
              selectedNode={selectedNode}
              onSelectNode={onSelectNode}
              showEditAffordance={showEditAffordance}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ItemPreviewRow({
  item,
  chapterId,
  lessonId,
  showEditAffordance,
  selectedNode,
  onSelectNode,
  children,
}: {
  item: {
    id: string | number
    title: string
    hasVideo: boolean
    hasDocument: boolean
    hasExam: boolean
  }
  chapterId: string | number
  lessonId: string | number
  showEditAffordance: boolean
  selectedNode: CourseBuilderNode | null
  onSelectNode: (node: CourseBuilderNode) => void
  children: React.ReactNode
}) {
  const { enabled, hoveredNode, setHoveredNode } = useCourseBuilderBridge()
  const node: CourseBuilderNode = {
    type: "item",
    id: item.id,
    chapterId,
    lessonId,
  }
  const interactive = showEditAffordance && enabled
  const isSelected = sameNode(selectedNode, node)
  const isHovered = sameNode(hoveredNode, node)

  return (
    <div
      data-course-preview-node-type="item"
      data-course-preview-node-id={item.id}
      className={`group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-start transition-colors ${interactive ? "cursor-pointer hover:border-[var(--brand-indigo-border)] hover:bg-[var(--surface-muted)]" : ""} ${isHovered ? "ring-2 ring-sky-400/70 ring-inset" : ""} ${isSelected ? "ring-2 ring-[var(--brand-indigo)] ring-inset" : ""}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onMouseEnter={() => interactive && setHoveredNode(node)}
      onMouseLeave={() => setHoveredNode(null)}
      onClick={interactive ? () => onSelectNode(node) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onSelectNode(node)
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}

function LessonRow({
  lesson,
  chapterId,
  expanded,
  onToggle,
  copy,
  selectedNode,
  onSelectNode,
  showEditAffordance,
}: {
  lesson: {
    id: string | number
    title: string
    description: string | null
    durationMinutes: number | null
    items: {
      id: string | number
      title: string
      hasVideo: boolean
      hasDocument: boolean
      hasExam: boolean
    }[]
  }
  chapterId: string | number
  expanded: boolean
  onToggle: () => void
  copy: CoursePreviewCopy
  selectedNode: CourseBuilderNode | null
  onSelectNode: (node: CourseBuilderNode) => void
  showEditAffordance: boolean
}) {
  const { enabled, hoveredNode, setHoveredNode } = useCourseBuilderBridge()
  const node: CourseBuilderNode = {
    type: "lesson",
    id: lesson.id,
    chapterId,
  }
  const hasVideo = lesson.items.some((i) => i.hasVideo)
  const hasDocument = lesson.items.some((i) => i.hasDocument)
  const hasExam = lesson.items.some((i) => i.hasExam)
  const contentId = `course-preview-lesson-${lesson.id}`
  const isSelected = sameNode(selectedNode, node)
  const isHovered = sameNode(hoveredNode, node)

  return (
    <div className="border-b border-[var(--border-subtle)] last:border-b-0">
      <button
        type="button"
        onClick={() => {
          onSelectNode(node)
          onToggle()
        }}
        aria-expanded={expanded}
        aria-controls={contentId}
        data-course-preview-node-type="lesson"
        data-course-preview-node-id={lesson.id}
        onMouseEnter={() => enabled && setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
        className={`flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-[var(--surface-muted)] @sm/preview:px-5 ${isHovered ? "ring-2 ring-sky-400/70 ring-inset" : ""} ${isSelected ? "bg-[var(--surface-muted)] ring-2 ring-[var(--brand-indigo)] ring-inset" : ""}`}
      >
        <span className="sticker-badge flex size-9 shrink-0 items-center justify-center bg-[var(--brand-indigo-tint)] text-[var(--on-primary-tint)]">
          {hasVideo ? (
            <PlayCircle className="size-5" />
          ) : hasDocument ? (
            <FileText className="size-5" />
          ) : (
            <BookOpen className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm leading-6 font-bold text-[var(--color-ink)] @sm/preview:text-base">
            {lesson.title}
          </strong>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[var(--color-muted)]">
            <span>{formatDuration(lesson.durationMinutes, copy)}</span>
            {hasVideo && <span>{copy.video}</span>}
            {hasDocument && <span>{copy.files}</span>}
            {hasExam && <span>{copy.exam}</span>}
          </span>
        </span>
        <ChevronLeft
          className={`size-4 shrink-0 text-[var(--color-muted)] transition-transform motion-reduce:transition-none ${expanded ? "-rotate-90" : "ltr:rotate-180"}`}
        />
      </button>

      {expanded && (
        <div
          id={contentId}
          className="space-y-2 overflow-hidden bg-[var(--color-surface-muted)] px-4 py-4 @sm/preview:ps-16"
        >
          {lesson.description && (
            <p
              className="pb-2 text-sm leading-6 text-[var(--color-muted)]"
              data-course-preview-node-type="lesson"
              data-course-preview-node-id={lesson.id}
              onMouseEnter={() => enabled && setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {lesson.description}
            </p>
          )}
          {lesson.items.length ? (
            lesson.items.map((item) => {
              const ItemIcon = item.hasVideo
                ? Video
                : item.hasDocument
                  ? FileText
                  : ClipboardList
              const itemMeta = [
                item.hasVideo ? copy.video : null,
                item.hasDocument ? copy.files : null,
                item.hasExam ? copy.exam : null,
              ]
                .filter(Boolean)
                .join(" · ")

              return (
                <ItemPreviewRow
                  key={item.id}
                  item={item}
                  chapterId={chapterId}
                  lessonId={lesson.id}
                  showEditAffordance={showEditAffordance}
                  selectedNode={selectedNode}
                  onSelectNode={onSelectNode}
                >
                  <ItemIcon className="size-5 shrink-0 text-[var(--color-muted)]" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">
                      {item.title}
                    </strong>
                    <span className="text-xs text-[var(--color-muted)]">
                      {itemMeta || copy.itemFallback}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--color-muted)]">
                    <LockKeyhole className="size-3.5" />
                    {copy.accessRequired}
                  </span>
                  {showEditAffordance && (
                    <span className="sr-only">{copy.selectItem}</span>
                  )}
                </ItemPreviewRow>
              )
            })
          ) : (
            <p className="text-sm font-medium text-[var(--color-muted)]">
              {copy.emptyLesson}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
