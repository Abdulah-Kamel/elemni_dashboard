"use client"
/* eslint-disable @next/next/no-img-element -- preview renderers use native <img> for object URLs per spec */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  StudentCoursePreviewModel,
  StudentPreviewSection,
  PreviewInteractionMode,
} from "./types"
import {
  ArrowLeft,
  ArrowRight,
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
} from "lucide-react"
import { useCourseBuilderBridge } from "@/features/course-management/course-builder-bridge"
import type { CourseBuilderField } from "@/features/course-management/course-builder-bridge"
import type { CourseBuilderNode } from "./types"
import { cn } from "@/lib/utils"

type CoursePreviewCopy = {
  backToDiscovery: string
  teacherLabel: (subject: string) => string
  fallbackDescription: string
  lessonCount: (count: number) => string
  examCount: (count: number) => string
  durationUnknown: string
  durationMinutes: (count: number) => string
  durationHours: (hours: number, minutes: number) => string
  subscribeCta: (price: string) => string
  sectionCount: (count: number) => string
  navLabel: string
  tabs: readonly string[]
  comingSoon: (tab: string) => string
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
    lessonCount: (count) => `${count} درس`,
    examCount: (count) => `${count} اختبار`,
    durationUnknown: "المدة غير محددة",
    durationMinutes: (count) => `${count} دقيقة`,
    durationHours: (hours, minutes) =>
      minutes ? `${hours} س ${minutes} د` : `${hours} ساعات`,
    subscribeCta: (price) => `اشترك الآن - ${price} ج.م`,
    sectionCount: (count) => `${count} ${count === 1 ? "وحدة" : "وحدات"}`,
    navLabel: "أقسام الكورس",
    tabs: ["المحتوى", "الاختبارات", "الملفات", "المناقشات", "التقدم"],
    comingSoon: (tab) => `${tab} - قريباً`,
    contentTitle: "خطة الكورس",
    contentSummary: (lessons, duration) => `${lessons} درس · ${duration}`,
    contentSummaryEmpty: "سيظهر المحتوى المنشور هنا",
    emptyTitle: "محتوى الكورس غير متاح حالياً",
    emptyBody: "عند نشر المدرس للدروس والمواد التعليمية ستظهر هنا تلقائياً.",
    chapterFallback: "دروس الكورس",
    chapterSummary: (lessons, duration) => `${lessons} دروس · ${duration}`,
    video: "فيديو",
    files: "ملفات",
    exam: "اختبار",
    itemFallback: "محتوى الدرس",
    accessRequired: "يتطلب الاشتراك",
    emptyLesson: "لم تتم إضافة مواد لهذا الدرس بعد.",
    selectItem: "تحديد العنصر للتعديل",
  },
  en: {
    backToDiscovery: "Back to discovery",
    teacherLabel: (subject) => `${subject || "Course"} instructor`,
    fallbackDescription: "Follow the course content and lessons in one place.",
    lessonCount: (count) => `${count} ${count === 1 ? "lesson" : "lessons"}`,
    examCount: (count) => `${count} ${count === 1 ? "exam" : "exams"}`,
    durationUnknown: "Duration not specified",
    durationMinutes: (count) => `${count} min`,
    durationHours: (hours, minutes) =>
      minutes
        ? `${hours}h ${minutes}m`
        : `${hours} ${hours === 1 ? "hour" : "hours"}`,
    subscribeCta: (price) => `Subscribe now - ${price} EGP`,
    sectionCount: (count) => `${count} ${count === 1 ? "section" : "sections"}`,
    navLabel: "Course sections",
    tabs: ["Content", "Quizzes", "Files", "Discussions", "Progress"],
    comingSoon: (tab) => `${tab} - Coming soon`,
    contentTitle: "Course plan",
    contentSummary: (lessons, duration) =>
      `${lessons} ${lessons === 1 ? "lesson" : "lessons"} · ${duration}`,
    contentSummaryEmpty: "Published content will appear here",
    emptyTitle: "Course content is not available yet",
    emptyBody:
      "Once the teacher publishes lessons and learning materials, they will appear here automatically.",
    chapterFallback: "Course lessons",
    chapterSummary: (lessons, duration) =>
      `${lessons} ${lessons === 1 ? "lesson" : "lessons"} · ${duration}`,
    video: "Video",
    files: "Files",
    exam: "Quiz",
    itemFallback: "Lesson content",
    accessRequired: "Subscription required",
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
}

export function StudentCourseDetailPreview({
  model,
  locale,
  selectedNode: selectedNodeProp,
  onSelectNode: onSelectNodeProp,
  showEditAffordance = false,
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
  const sectionsWithLessons = useMemo(
    () => sections.filter((s) => s.lessons.length),
    [sections]
  )
  const hasContent = sectionsWithLessons.length > 0

  const firstSection = sectionsWithLessons[0]
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
        const section = sectionsWithLessons.find((s) => s.id === chapterId)
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
        ? sectionsWithLessons.find(
            (section) => String(section.id) === String(selectedNode.chapterId)
          )
        : selectedNode.type === "chapter"
          ? sectionsWithLessons.find(
              (section) => String(section.id) === String(selectedNode.id)
            )
          : sectionsWithLessons.find((section) =>
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
  }, [sectionsWithLessons, selectedNode])

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

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="student-preview min-h-full bg-[var(--page)] text-[var(--on-surface)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-7 @sm/preview:px-6 @sm/preview:py-8 @lg/preview:px-8">
        {/* The preview keeps this navigation inert, while preserving the student-facing styling. */}
        <span
          aria-disabled="true"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--on-surface-muted)] transition-colors hover:text-[var(--brand-indigo-deep)]"
        >
          <ChevronLeft
            className={`size-4 ${lang === "ar" ? "rotate-180" : ""}`}
          />
          {copy.backToDiscovery}
        </span>

        {/* Course hero */}
        <section
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 @sm/preview:p-7"
          aria-labelledby="course-preview-title"
        >
          <div className="grid gap-7 @lg/preview:grid-cols-[1fr_auto] @lg/preview:items-end">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {model.subject && (
                  <span className="rounded-full bg-[var(--brand-indigo)]/5 px-3 py-1 text-xs font-bold text-[var(--brand-indigo-deep)]">
                    {model.subject}
                  </span>
                )}
                {(model.grade || model.stream) && (
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--on-surface-body)]">
                    {[model.grade, model.stream].filter(Boolean).join(" - ")}
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
                  className="text-3xl leading-tight font-black text-[var(--on-surface)] @sm/preview:text-4xl"
                >
                  {model.title}
                </h1>
              </CoursePreviewField>
              {model.teacher && (
                <div className="mt-5 flex w-fit items-center gap-3 rounded-lg">
                  {model.teacher.avatarUrl ? (
                    <img
                      src={model.teacher.avatarUrl}
                      alt={model.teacher.name}
                      className="size-11 rounded-full border border-[var(--border)] object-cover"
                    />
                  ) : (
                    <span className="flex size-11 items-center justify-center rounded-full bg-[var(--brand-indigo-tint)] text-sm font-black text-[var(--brand-indigo-deep)]">
                      {model.teacher.name.charAt(0)}
                    </span>
                  )}
                  <span>
                    <strong className="block text-sm font-black">
                      {model.teacher.name}
                    </strong>
                    <span className="text-xs text-[var(--on-surface-muted)]">
                      {copy.teacherLabel(model.subject ?? "")}
                    </span>
                  </span>
                </div>
              )}
              <CoursePreviewField
                field="description"
                ariaLabel={fieldEditLabels.description}
                className="mt-5 rounded-lg"
              >
                <p className="text-sm leading-7 text-[var(--on-surface-body)] @sm/preview:text-base">
                  {model.description || copy.fallbackDescription}
                </p>
              </CoursePreviewField>
            </div>

            <div className="w-full @lg/preview:w-auto">
              <div className="mb-5 grid grid-cols-3 gap-5 text-center text-xs font-bold text-[var(--on-surface-body)] @sm/preview:flex @sm/preview:justify-end">
                <span className="grid justify-items-center gap-1">
                  <PlayCircle className="size-5 text-[var(--brand-indigo)]" />
                  {copy.lessonCount(totalLessons)}
                </span>
                <span className="grid justify-items-center gap-1">
                  <Clock3 className="size-5 text-[var(--brand-indigo)]" />
                  {formatDuration(totalDuration, copy)}
                </span>
                <span className="grid justify-items-center gap-1">
                  <ClipboardList className="size-5 text-[var(--brand-indigo)]" />
                  {copy.examCount(totalExams)}
                </span>
              </div>
              <CoursePreviewField
                field="price"
                ariaLabel={fieldEditLabels.price}
                overlay={false}
                className="rounded-xl"
              >
                <button
                  type="button"
                  aria-disabled="true"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-indigo)] px-7 text-sm font-black text-[var(--on-primary)] transition-colors hover:bg-[var(--brand-indigo-deep)] @lg/preview:w-auto"
                >
                  {copy.subscribeCta(formatPrice(model.price, lang))}
                  {lang === "ar" ? (
                    <ArrowLeft className="size-4" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                </button>
              </CoursePreviewField>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--border)] pt-4 text-xs font-bold text-[var(--on-surface-muted)]">
            {!!sections.length && (
              <span className="inline-flex items-center gap-2">
                <FolderOpen className="size-4 text-[var(--brand-indigo)]" />
                {copy.sectionCount(sections.length)}
              </span>
            )}
          </div>
        </section>

        {/* Tabs (disabled except content) */}
        <nav
          className="mt-8 flex gap-2 overflow-x-auto border-b border-[var(--border)]"
          aria-label={copy.navLabel}
        >
          {copy.tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              disabled={index !== 0}
              title={index !== 0 ? copy.comingSoon(tab) : undefined}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-black ${index === 0 ? "border-[var(--brand-indigo)] text-[var(--brand-indigo-deep)]" : "cursor-not-allowed border-transparent text-[var(--on-surface-subtle)]"}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Content section */}
        <section
          id="course-preview-content"
          className="scroll-mt-24 pt-8"
          aria-labelledby="course-preview-content-title"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
            <h2
              id="course-preview-content-title"
              className="text-2xl font-black text-[var(--on-surface)] @sm/preview:text-3xl"
            >
              {copy.contentTitle}
            </h2>
            <p className="text-xs font-bold text-[var(--on-surface-muted)]">
              {totalLessons
                ? copy.contentSummary(
                    totalLessons,
                    formatDuration(totalDuration, copy)
                  )
                : copy.contentSummaryEmpty}
            </p>
          </div>

          {hasContent ? (
            <div className="space-y-3">
              {sectionsWithLessons.map((section, sectionIndex) => (
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
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-center">
              <BookOpen className="mb-4 size-10 text-[var(--brand-indigo-icon)]" />
              <h3 className="text-lg font-black">{copy.emptyTitle}</h3>
              <p className="mt-2 w-full text-sm leading-6 text-[var(--on-surface-muted)]">
                {copy.emptyBody}
              </p>
            </div>
          )}
        </section>
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
      className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface)]"
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
        className={`flex min-h-15 w-full cursor-pointer items-center gap-4 px-4 py-4 text-start transition-colors @sm/preview:px-5 ${expanded ? "bg-[var(--surface-muted)]" : "hover:bg-[var(--surface-strong)]"} ${isHovered ? "ring-2 ring-sky-400/70 ring-inset" : ""} ${isSelected ? "ring-2 ring-[var(--brand-indigo)] ring-inset" : ""}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <h3
            id={headingId}
            className={`truncate text-base font-black @sm/preview:text-lg ${expanded ? "text-[var(--brand-indigo-deep)]" : "text-[var(--on-surface-strong)]"}`}
          >
            {section.title || copy.chapterFallback}
          </h3>
          <ChevronDown
            className={`size-4 shrink-0 text-[var(--on-surface-muted)] transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
          />
        </span>
        <span className="shrink-0 text-xs font-medium text-[var(--on-surface-muted)]">
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
        className={`flex min-h-18 w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-[var(--surface-muted)] @sm/preview:px-5 ${isHovered ? "ring-2 ring-sky-400/70 ring-inset" : ""} ${isSelected ? "bg-[var(--surface-muted)] ring-2 ring-[var(--brand-indigo)] ring-inset" : ""}`}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--brand-indigo)]">
          {hasVideo ? (
            <PlayCircle className="size-5" />
          ) : hasDocument ? (
            <FileText className="size-5" />
          ) : (
            <BookOpen className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm leading-6 font-bold text-[var(--on-surface-strong)] @sm/preview:text-base">
            {lesson.title}
          </strong>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[var(--on-surface-muted)]">
            <span>{formatDuration(lesson.durationMinutes, copy)}</span>
            {hasVideo && <span>{copy.video}</span>}
            {hasDocument && <span>{copy.files}</span>}
            {hasExam && <span>{copy.exam}</span>}
          </span>
        </span>
        <ChevronLeft
          className={`size-4 shrink-0 text-[var(--on-surface-subtle)] transition-transform motion-reduce:transition-none ${expanded ? "-rotate-90" : ""}`}
        />
      </button>

      {expanded && (
        <div
          id={contentId}
          className="space-y-2 overflow-hidden bg-[var(--surface-strong)] px-4 py-4 @sm/preview:ps-16"
        >
          {lesson.description && (
            <p
              className="pb-2 text-sm leading-6 text-[var(--on-surface-muted)]"
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
                  <ItemIcon className="size-5 shrink-0 text-[var(--on-surface-muted)]" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">
                      {item.title}
                    </strong>
                    <span className="text-xs text-[var(--on-surface-muted)]">
                      {itemMeta || copy.itemFallback}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--on-surface-subtle)]">
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
            <p className="text-sm font-medium text-[var(--on-surface-muted)]">
              {copy.emptyLesson}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
