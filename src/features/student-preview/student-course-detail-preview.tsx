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
import type { CourseBuilderNode } from "./types"

function formatDuration(minutes: number | null): string {
  if (!minutes) return "المدة غير محددة"
  if (minutes < 60) return `${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} س ${remainder} د` : `${hours} ساعات`
}

function formatPrice(value: string | number): string {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(
    Number(value)
  )
}

function chapterDuration(
  lessons: { durationMinutes: number | null }[]
): number | null {
  const total = lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0)
  return total || null
}

interface StudentCourseDetailPreviewProps {
  model: StudentCoursePreviewModel
  locale: string
  viewer: "guest" | "subscribed"
  interactionMode: PreviewInteractionMode
  onCurriculumCommitted?: () => void
  selectedNode?: CourseBuilderNode | null
  onSelectNode?: (node: CourseBuilderNode) => void
  showEditAffordance?: boolean
}

export function StudentCourseDetailPreview({
  model,
  viewer,
  selectedNode: selectedNodeProp,
  onSelectNode: onSelectNodeProp,
  showEditAffordance = false,
}: StudentCourseDetailPreviewProps) {
  const bridge = useCourseBuilderBridge()
  const selectedNode =
    selectedNodeProp === undefined ? bridge.selectedNode : selectedNodeProp
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
      selectedNode.type === "chapter"
        ? sectionsWithLessons.find((section) => section.id === selectedNode.id)
        : sectionsWithLessons.find((section) =>
            section.lessons.some((lesson) =>
              selectedNode.type === "lesson"
                ? lesson.id === selectedNode.id
                : lesson.items.some((item) => item.id === selectedNode.id)
            )
          )

    if (!selectedSection) return

    const selectedLesson =
      selectedNode.type === "chapter"
        ? selectedSection.lessons[0]
        : selectedSection.lessons.find((lesson) =>
            selectedNode.type === "lesson"
              ? lesson.id === selectedNode.id
              : lesson.items.some((item) => item.id === selectedNode.id)
          )

    const timeout = window.setTimeout(() => {
      setExpandedChapterId(selectedSection.id)
      setExpandedLessonId(selectedLesson?.id ?? null)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [sectionsWithLessons, selectedNode])

  const enrolled = viewer === "subscribed"

  return (
    <div dir="rtl" className="student-preview min-h-full bg-[var(--page)] text-[var(--on-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-7 @sm/preview:px-6 @sm/preview:py-8 @lg/preview:px-8">
        {/* The preview keeps this navigation inert, while preserving the student-facing styling. */}
        <span
          aria-disabled="true"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--on-surface-muted)] transition-colors hover:text-[var(--brand-indigo-deep)]"
        >
          <ChevronLeft className="size-4 rotate-180" />
          {enrolled ? "العودة إلى دوراتي" : "العودة إلى الاستكشاف"}
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
              <h1
                id="course-preview-title"
                className="text-3xl leading-tight font-black text-[var(--on-surface)] @sm/preview:text-4xl"
              >
                {model.title}
              </h1>
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
                      مدرس {model.subject || "الكورس"}
                    </span>
                  </span>
                </div>
              )}
              <p className="mt-5 text-sm leading-7 text-[var(--on-surface-body)] @sm/preview:text-base">
                {model.description ||
                  "تابع محتوى الكورس ودروس المدرس من مكان واحد."}
              </p>
            </div>

            <div className="w-full @lg/preview:w-auto">
              <div className="mb-5 grid grid-cols-3 gap-5 text-center text-xs font-bold text-[var(--on-surface-body)] @sm/preview:flex @sm/preview:justify-end">
                <span className="grid justify-items-center gap-1">
                  <PlayCircle className="size-5 text-[var(--brand-indigo)]" />
                  {totalLessons} درس
                </span>
                <span className="grid justify-items-center gap-1">
                  <Clock3 className="size-5 text-[var(--brand-indigo)]" />
                  {formatDuration(totalDuration)}
                </span>
                <span className="grid justify-items-center gap-1">
                  <ClipboardList className="size-5 text-[var(--brand-indigo)]" />
                  {totalExams} اختبار
                </span>
              </div>
              {enrolled ? (
                <button
                  type="button"
                  aria-disabled="true"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-indigo)] px-7 text-sm font-black text-[var(--on-primary)] transition-colors hover:bg-[var(--brand-indigo-deep)] @lg/preview:w-auto"
                >
                  عرض محتوى الكورس
                  <ArrowLeft className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-disabled="true"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-indigo)] px-7 text-sm font-black text-[var(--on-primary)] transition-colors hover:bg-[var(--brand-indigo-deep)] @lg/preview:w-auto"
                >
                  اشترك الآن - {formatPrice(model.price)} ج.م
                  <ArrowLeft className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--border)] pt-4 text-xs font-bold text-[var(--on-surface-muted)]">
            {!!sections.length && (
              <span className="inline-flex items-center gap-2">
                <FolderOpen className="size-4 text-[var(--brand-indigo)]" />
                {sections.length} {sections.length === 1 ? "وحدة" : "وحدات"}
              </span>
            )}
          </div>
        </section>

        {/* Tabs (disabled except content) */}
        <nav
          className="mt-8 flex gap-2 overflow-x-auto border-b border-[var(--border)]"
          aria-label="أقسام الكورس"
        >
          {["المحتوى", "الاختبارات", "الملفات", "المناقشات", "التقدم"].map(
            (tab, index) => (
              <button
                key={tab}
                type="button"
                disabled={index !== 0}
                title={index !== 0 ? `${tab} - قريباً` : undefined}
                className={`shrink-0 border-b-2 px-4 py-3 text-sm font-black ${index === 0 ? "border-[var(--brand-indigo)] text-[var(--brand-indigo-deep)]" : "cursor-not-allowed border-transparent text-[var(--on-surface-subtle)]"}`}
              >
                {tab}
              </button>
            )
          )}
        </nav>

        {/* Content section */}
        <section id="course-preview-content" className="scroll-mt-24 pt-8" aria-labelledby="course-preview-content-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
            <h2 id="course-preview-content-title" className="text-2xl font-black text-[var(--on-surface)] @sm/preview:text-3xl">
              {enrolled ? "محتوى الكورس" : "خطة الكورس"}
            </h2>
            <p className="text-xs font-bold text-[var(--on-surface-muted)]">
              {totalLessons
                ? `${totalLessons} درس · ${formatDuration(totalDuration)}`
                : "سيظهر المحتوى المنشور هنا"}
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
                  viewer={viewer}
                  selectedNode={selectedNode}
                  onSelectNode={selectPreviewNode}
                  showEditAffordance={showEditAffordance}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-center">
              <BookOpen className="mb-4 size-10 text-[var(--brand-indigo-icon)]" />
              <h3 className="text-lg font-black">
                محتوى الكورس غير متاح حالياً
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--on-surface-muted)]">
                عند نشر المدرس للدروس والمواد التعليمية ستظهر هنا تلقائياً.
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
  viewer,
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
  viewer: "guest" | "subscribed"
  selectedNode: CourseBuilderNode | null
  onSelectNode: (node: CourseBuilderNode) => void
  showEditAffordance: boolean
}) {
  const duration = chapterDuration(section.lessons)
  const headingId = `course-preview-chapter-${sectionIndex}`
  const contentId = `${headingId}-content`
  const isSelected =
    selectedNode?.type === "chapter" && selectedNode.id === section.id

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
          onSelectNode({ type: "chapter", id: section.id })
          onToggleChapter()
        }}
        className={`flex min-h-15 w-full cursor-pointer items-center gap-4 px-4 py-4 text-start transition-colors @sm/preview:px-5 ${expanded ? "bg-[var(--surface-muted)]" : "hover:bg-[var(--surface-strong)]"} ${isSelected ? "ring-2 ring-inset ring-[var(--brand-indigo)]" : ""}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <h3
            id={headingId}
            className={`truncate text-base font-black @sm/preview:text-lg ${expanded ? "text-[var(--brand-indigo-deep)]" : "text-[var(--on-surface-strong)]"}`}
          >
            {section.title || "دروس الكورس"}
          </h3>
          <ChevronDown
            className={`size-4 shrink-0 text-[var(--on-surface-muted)] transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
          />
        </span>
        <span className="shrink-0 text-xs font-medium text-[var(--on-surface-muted)]">
          {section.lessons.length} دروس · {formatDuration(duration)}
        </span>
      </button>

      {expanded && (
        <div id={contentId} className="overflow-hidden border-t border-[var(--border-strong)]">
          {section.lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              expanded={expandedLessonId === lesson.id}
              onToggle={() => onToggleLesson(lesson.id)}
              viewer={viewer}
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

function LessonRow({
  lesson,
  expanded,
  onToggle,
  viewer,
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
  expanded: boolean
  onToggle: () => void
  viewer: "guest" | "subscribed"
  selectedNode: CourseBuilderNode | null
  onSelectNode: (node: CourseBuilderNode) => void
  showEditAffordance: boolean
}) {
  const hasVideo = lesson.items.some((i) => i.hasVideo)
  const hasDocument = lesson.items.some((i) => i.hasDocument)
  const hasExam = lesson.items.some((i) => i.hasExam)
  const contentId = `course-preview-lesson-${lesson.id}`
  const isSelected =
    selectedNode?.type === "lesson" && selectedNode.id === lesson.id

  return (
    <div className="border-b border-[var(--border-subtle)] last:border-b-0">
      <button
        type="button"
        onClick={() => {
          onSelectNode({ type: "lesson", id: lesson.id })
          onToggle()
        }}
        aria-expanded={expanded}
        aria-controls={contentId}
        className={`flex min-h-18 w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-[var(--surface-muted)] @sm/preview:px-5 ${isSelected ? "bg-[var(--surface-muted)] ring-2 ring-inset ring-[var(--brand-indigo)]" : ""}`}
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
            <span>{formatDuration(lesson.durationMinutes)}</span>
            {hasVideo && <span>فيديو</span>}
            {hasDocument && <span>ملفات</span>}
            {hasExam && <span>اختبار</span>}
          </span>
        </span>
        <ChevronLeft
          className={`size-4 shrink-0 text-[var(--on-surface-subtle)] transition-transform motion-reduce:transition-none ${expanded ? "-rotate-90" : ""}`}
        />
      </button>

      {expanded && (
        <div id={contentId} className="space-y-2 overflow-hidden bg-[var(--surface-strong)] px-4 py-4 @sm/preview:ps-16">
          {lesson.description && (
            <p className="pb-2 text-sm leading-6 text-[var(--on-surface-muted)]">
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
                item.hasVideo ? "فيديو" : null,
                item.hasDocument ? "ملف" : null,
                item.hasExam ? "اختبار" : null,
              ]
                .filter(Boolean)
                .join(" · ")

              return (
                <div
                  key={item.id}
                  className={`group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-start transition-colors ${showEditAffordance ? "cursor-pointer hover:border-[var(--brand-indigo-border)] hover:bg-[var(--surface-muted)]" : ""} ${selectedNode?.type === "item" && selectedNode.id === item.id ? "ring-2 ring-inset ring-[var(--brand-indigo)]" : ""}`}
                  role={showEditAffordance ? "button" : undefined}
                  tabIndex={showEditAffordance ? 0 : undefined}
                  onClick={
                    showEditAffordance
                      ? () => onSelectNode({ type: "item", id: item.id })
                      : undefined
                  }
                  onKeyDown={
                    showEditAffordance
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            onSelectNode({ type: "item", id: item.id })
                          }
                        }
                      : undefined
                  }
                >
                  <ItemIcon className="size-5 shrink-0 text-[var(--on-surface-muted)]" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">
                      {item.title}
                    </strong>
                    <span className="text-xs text-[var(--on-surface-muted)]">
                      {itemMeta || "محتوى الدرس"}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--on-surface-subtle)]">
                    {viewer === "guest" && <LockKeyhole className="size-3.5" />}
                    {viewer === "guest" ? "يتطلب الاشتراك" : "غير متاح حالياً"}
                  </span>
                  {showEditAffordance && (
                    <span className="sr-only">تحديد العنصر للتعديل</span>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-sm font-medium text-[var(--on-surface-muted)]">
              لم تتم إضافة مواد لهذا الدرس بعد.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
