"use client"
/* eslint-disable @next/next/no-img-element -- preview renderers use native <img> for object URLs per spec */

import { useState } from "react"
import type {
  StudentTeacherPreviewModel,
  PreviewInteractionMode,
} from "./types"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  Award,
  Share2,
  MapPin,
  ChevronDown,
  PlayCircle,
  FileText,
  ClipboardList,
} from "lucide-react"
import { getSubjectArt } from "./subject-art"
import { StudentPreviewCover } from "./student-preview-cover"
import { cn } from "@/lib/utils"
import {
  type ProfilePreviewField,
  useProfilePreviewBridge,
} from "./profile-preview-bridge"

type ProfilePreviewCopy = {
  fallbackName: string
  fallbackBio: string
  backToTeachers: string
  share: string
  experience: (years: number) => string
  availableCourses: (count: number) => string
  online: string
  coursesTitle: string
  courseFallbackTitle: string
  courseFallbackDescription: string
  sessions: (count: number) => string
  monthlyPrice: string
  courseContent: string
  subscribe: string
  emptyCourseContent: string
  courseSubjectFallback: string
  experiencePlaceholder: string
  emptyCourses: string
  hideContent: string
  gradesLabel: string
  includesExams: string
  includesDocuments: string
  durationUnknown: string
  free: string
}

const PROFILE_PREVIEW_COPY: Record<"ar" | "en", ProfilePreviewCopy> = {
  ar: {
    fallbackName: "اسم المدرس",
    fallbackBio: "نبذة عن المدرس",
    backToTeachers: "كل المدرسين",
    share: "مشاركة",
    experience: (years) =>
      years === 1
        ? "سنة خبرة"
        : years === 2
          ? "سنتان خبرة"
          : `${years} ${new Intl.PluralRules("ar").select(years) === "few" ? "سنوات" : "سنة"} خبرة`,
    availableCourses: (count) =>
      count === 0
        ? "لا كورسات منشورة"
        : count === 1
          ? "كورس واحد"
          : count === 2
            ? "كورسان"
            : `${count} ${new Intl.PluralRules("ar").select(count) === "few" ? "كورسات" : new Intl.PluralRules("ar").select(count) === "many" ? "كورساً" : "كورس"}`,
    online: "أونلاين",
    coursesTitle: "الكورسات",
    courseFallbackTitle: "عنوان الكورس",
    courseFallbackDescription: "وصف الكورس",
    sessions: (count) =>
      count === 0
        ? "بدون دروس بعد"
        : count === 1
          ? "درس واحد"
          : count === 2
            ? "درسان"
            : `${count} ${new Intl.PluralRules("ar").select(count) === "few" ? "دروس" : new Intl.PluralRules("ar").select(count) === "many" ? "درساً" : "درس"}`,
    monthlyPrice: "ج.م / الشهر",
    courseContent: "محتوى الكورس",
    subscribe: "اشترك الآن",
    emptyCourseContent: "لم يضف المدرس محتوى للكورس بعد.",
    courseSubjectFallback: "الكورس",
    experiencePlaceholder: "سنوات الخبرة",
    emptyCourses: "لم ينشر المدرس كورسات بعد.",
    hideContent: "إخفاء المحتوى",
    gradesLabel: "الصفوف الدراسية",
    includesExams: "اختبارات",
    includesDocuments: "ملفات",
    durationUnknown: "المدة غير محددة",
    free: "مجاني",
  },
  en: {
    fallbackName: "Teacher name",
    fallbackBio: "Teacher bio",
    backToTeachers: "All teachers",
    share: "Share",
    experience: (years) =>
      `${years} ${years === 1 ? "year" : "years"} of experience`,
    availableCourses: (count) =>
      count === 0
        ? "No published courses"
        : `${count} ${count === 1 ? "course" : "courses"}`,
    online: "Online",
    coursesTitle: "Courses",
    courseFallbackTitle: "Course title",
    courseFallbackDescription: "Course description",
    sessions: (count) =>
      count === 0
        ? "No lessons yet"
        : `${count} ${count === 1 ? "lesson" : "lessons"}`,
    monthlyPrice: "EGP / month",
    courseContent: "Course content",
    subscribe: "Subscribe",
    emptyCourseContent: "No content added yet.",
    courseSubjectFallback: "Course",
    experiencePlaceholder: "Years of experience",
    emptyCourses: "No published courses yet.",
    hideContent: "Hide content",
    gradesLabel: "Grades",
    includesExams: "Exams",
    includesDocuments: "Files",
    durationUnknown: "Duration not set",
    free: "Free",
  },
}

interface StudentTeacherProfilePreviewProps {
  model: StudentTeacherPreviewModel
  locale: string
  interactionMode: PreviewInteractionMode
}

interface ProfilePreviewFieldProps {
  field: ProfilePreviewField
  ariaLabel: string
  className?: string
  insetRing?: boolean
  children: React.ReactNode
}

function ProfilePreviewField({
  field,
  ariaLabel,
  className,
  insetRing = false,
  children,
}: ProfilePreviewFieldProps) {
  const { enabled, hoveredField, selectedField, setHoveredField, selectField } =
    useProfilePreviewBridge()
  const active = enabled && (hoveredField === field || selectedField === field)

  return (
    <div
      data-profile-preview-field={field}
      data-profile-preview-state={
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
        hoveredField === field && (insetRing ? "bg-white/10" : "bg-white/5"),
        active &&
          (insetRing
            ? "bg-white/10 shadow-[inset_0_0_22px_rgb(125_211_252_/_0.25)] ring-2 ring-sky-300/90 ring-inset"
            : "shadow-[0_0_24px_rgb(125_211_252_/_0.3)] ring-2 ring-sky-300/90 ring-offset-2 ring-offset-[var(--color-surface)]")
      )}
      onMouseEnter={() => enabled && setHoveredField(field)}
      onMouseLeave={() => setHoveredField(null)}
    >
      {children}
      {enabled && (
        <button
          type="button"
          aria-label={ariaLabel}
          className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          onMouseEnter={() => setHoveredField(field)}
          onMouseLeave={() => setHoveredField(null)}
          onClick={() => selectField(field)}
        />
      )}
    </div>
  )
}

export function StudentTeacherProfilePreview({
  model,
  locale,
}: StudentTeacherProfilePreviewProps) {
  const [expandedCourses, setExpandedCourses] = useState<
    Record<string | number, boolean>
  >({})

  const lang = locale.toLowerCase().startsWith("ar") ? "ar" : "en"
  const copy = PROFILE_PREVIEW_COPY[lang]
  const displayName = model.name || copy.fallbackName
  const displayBio = model.bio || copy.fallbackBio
  const fieldEditLabels: Record<ProfilePreviewField, string> =
    lang === "ar"
      ? {
          name: "تعديل الاسم",
          bio: "تعديل النبذة",
          location: "تعديل الموقع",
          experience: "تعديل سنوات الخبرة",
          avatar: "تعديل الصورة",
        }
      : {
          name: "Edit name",
          bio: "Edit bio",
          location: "Edit location",
          experience: "Edit years of experience",
          avatar: "Edit profile image",
        }
  const toggleExpand = (courseId: string | number) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }))
  }

  const nameIsPlaceholder = !model.name || model.name === copy.fallbackName
  const bioIsPlaceholder = !model.bio || model.bio === copy.fallbackBio
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
  const subjects = model.subjects.length ? model.subjects : [model.subject]
  const doodles = [
    [6, 18, 56, -14],
    [24, 58, 40, 10],
    [44, 14, 48, 6],
    [62, 52, 60, -8],
    [80, 20, 44, 16],
    [93, 62, 36, -20],
  ]

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="student-preview min-h-full bg-[var(--color-page)] pb-16 text-[var(--color-ink)]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 @sm/preview:px-6 @sm/preview:pt-8 @5xl/preview:px-8">
        <header className="sticker-tile overflow-hidden">
          <div className="preview-profile-banner relative h-40 overflow-hidden border-b-2 border-[var(--color-line)] @sm/preview:h-52">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px] opacity-25"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 text-white/35"
            >
              {doodles.map(([start, top, size, rotation], index) => {
                const { Icon } = getSubjectArt(
                  subjects[index % subjects.length]
                )
                return (
                  <span
                    key={index}
                    className="absolute"
                    style={{
                      insetInlineStart: `${start}%`,
                      top: `${top}%`,
                      transform: `rotate(${rotation}deg)`,
                    }}
                  >
                    <Icon
                      style={{ width: size, height: size }}
                      strokeWidth={1.5}
                    />
                  </span>
                )
              })}
            </div>
            <div className="relative flex items-start justify-between gap-3 p-4 @sm/preview:p-5">
              <span
                aria-disabled="true"
                className="sticker-btn-outline inline-flex min-h-11 items-center gap-2 px-4 text-sm font-black"
              >
                {lang === "ar" ? (
                  <ArrowRight className="size-4" aria-hidden="true" />
                ) : (
                  <ArrowLeft className="size-4" aria-hidden="true" />
                )}
                {copy.backToTeachers}
              </span>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="sticker-btn-outline inline-flex min-h-11 items-center gap-2 px-4 text-sm font-black"
              >
                <Share2 className="size-4" aria-hidden="true" />
                {copy.share}
              </button>
            </div>
          </div>

          <div className="relative px-5 pb-5 @sm/preview:px-8 @sm/preview:pb-6">
            <div className="relative z-10 -mt-16 flex justify-center @sm/preview:-mt-20 @3xl/preview:absolute @3xl/preview:start-8 @3xl/preview:top-0 @3xl/preview:mt-0 @3xl/preview:-translate-y-1/2">
              <ProfilePreviewField
                field="avatar"
                ariaLabel={fieldEditLabels.avatar}
                className="shrink-0 -rotate-3 rounded-[1.75rem]"
              >
                <div className="sticker-shadow size-32 overflow-hidden rounded-[1.75rem] border-2 border-[var(--color-line)] bg-[var(--brand-indigo-tint)] @sm/preview:size-40">
                  {model.avatarUrl ? (
                    <img
                      src={model.avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl font-black text-[var(--on-primary-tint)] @sm/preview:text-6xl">
                      {initials}
                    </div>
                  )}
                </div>
              </ProfilePreviewField>
            </div>
            <div className="mt-4 text-center @3xl/preview:mt-0 @3xl/preview:ps-52 @3xl/preview:pt-5 @3xl/preview:text-start">
              <ProfilePreviewField
                field="name"
                ariaLabel={fieldEditLabels.name}
                className="rounded-xl"
              >
                <h1
                  className={cn(
                    "text-3xl font-black tracking-tight text-balance break-words @sm/preview:text-4xl @5xl/preview:text-5xl",
                    nameIsPlaceholder && "text-[var(--color-muted)]"
                  )}
                >
                  {displayName}
                </h1>
              </ProfilePreviewField>
              {model.subjects.length > 0 && (
                <ul className="mt-3 flex flex-wrap justify-center gap-2 @3xl/preview:justify-start">
                  {model.subjects.map((subject, index) => (
                    <li
                      key={`${subject}-${index}`}
                      className="sticker-badge bg-[var(--brand-indigo-tint)] px-3 py-1 text-xs font-black text-[var(--on-primary-tint)]"
                    >
                      {subject}
                    </li>
                  ))}
                </ul>
              )}
              <ProfilePreviewField
                field="bio"
                ariaLabel={fieldEditLabels.bio}
                className="mx-auto mt-4 max-w-[65ch] rounded-xl @3xl/preview:mx-0"
              >
                <p
                  className={cn(
                    "text-sm leading-7 font-medium whitespace-pre-line @sm/preview:text-base",
                    bioIsPlaceholder
                      ? "text-[var(--color-muted)] italic"
                      : "text-[var(--color-ink)]/75"
                  )}
                >
                  {displayBio}
                </p>
              </ProfilePreviewField>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t-2 border-dashed border-[var(--color-ink)]/10 pt-4 text-sm font-bold text-[var(--color-ink)]/80 @3xl/preview:justify-start">
              <span className="inline-flex items-center gap-2 tabular-nums">
                <BookOpen
                  className="size-4 text-[var(--brand-indigo)]"
                  aria-hidden="true"
                />
                {copy.availableCourses(model.courses.length)}
              </span>
              {model.grades.length > 0 && (
                <span className="inline-flex items-center gap-2">
                  <GraduationCap
                    className="size-4 shrink-0 text-[var(--brand-indigo)]"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{copy.gradesLabel}: </span>
                  <span dir="auto">{model.grades.join(" · ")}</span>
                </span>
              )}
              <ProfilePreviewField
                field="experience"
                ariaLabel={fieldEditLabels.experience}
                className="rounded-lg"
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-2 tabular-nums",
                    model.experienceYears <= 0 &&
                      "text-[var(--color-muted)] italic"
                  )}
                >
                  <Award
                    className="size-4 text-[var(--brand-indigo)]"
                    aria-hidden="true"
                  />
                  {model.experienceYears > 0
                    ? copy.experience(model.experienceYears)
                    : copy.experiencePlaceholder}
                </span>
              </ProfilePreviewField>
              <ProfilePreviewField
                field="location"
                ariaLabel={fieldEditLabels.location}
                className="rounded-lg"
              >
                <span className="inline-flex items-center gap-2">
                  <MapPin
                    className="size-4 shrink-0 text-[var(--brand-amber)]"
                    aria-hidden="true"
                  />
                  <span dir="auto">{model.location || copy.online}</span>
                </span>
              </ProfilePreviewField>
            </div>
          </div>
        </header>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[1400px] px-4 @sm/preview:px-6 @5xl/preview:px-8">
        <section aria-labelledby="teacher-preview-courses-title">
          <div className="mb-5 flex items-center gap-3">
            <h2
              id="teacher-preview-courses-title"
              className="text-2xl font-black tracking-tight @sm/preview:text-3xl"
            >
              {copy.coursesTitle}
            </h2>
            <span className="rounded-full bg-[var(--color-brand-600)] px-2.5 py-0.5 text-sm font-black text-white tabular-nums">
              {model.courses.length}
            </span>
          </div>
          {model.courses.length === 0 ? (
            <div className="sticker-tile flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
              <BookOpen
                className="size-9 text-[var(--brand-indigo)]"
                aria-hidden="true"
              />
              <p className="text-sm font-bold text-[var(--color-muted)]">
                {copy.emptyCourses}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-6 @xl/preview:grid-cols-2 @5xl/preview:grid-cols-3">
              {model.courses.map((course) => {
                const isExpanded = expandedCourses[course.id]
                const items = course.sections.flatMap((section) =>
                  section.lessons.flatMap((lesson) => lesson.items)
                )
                return (
                  <article
                    key={course.id}
                    className="sticker-tile group flex h-full min-w-0 flex-col overflow-hidden"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden border-b-2 border-[var(--color-line)]">
                      <StudentPreviewCover
                        src={course.coverUrl}
                        subject={model.subject}
                        alt={course.title || copy.courseFallbackTitle}
                      />
                      <span className="absolute end-3 bottom-3 inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-slate-950/75 px-2.5 py-1 text-[11px] font-bold text-white">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {course.duration || copy.durationUnknown}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h3 className="line-clamp-2 text-lg leading-snug font-black">
                        {course.title || copy.courseFallbackTitle}
                      </h3>
                      <p className="line-clamp-2 text-[13px] leading-6 font-medium text-[var(--color-muted)]">
                        {course.description || copy.courseFallbackDescription}
                      </p>
                      <ul className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-[var(--color-muted)]">
                        <li className="inline-flex items-center gap-1.5 tabular-nums">
                          <BookOpen
                            className="size-3.5 text-[var(--brand-indigo)]"
                            aria-hidden="true"
                          />
                          {copy.sessions(course.sessionsCount)}
                        </li>
                        {items.some((item) => item.hasExam) && (
                          <li className="inline-flex items-center gap-1.5">
                            <ClipboardList
                              className="size-3.5 text-amber-600"
                              aria-hidden="true"
                            />
                            {copy.includesExams}
                          </li>
                        )}
                        {items.some((item) => item.hasDocument) && (
                          <li className="inline-flex items-center gap-1.5">
                            <FileText
                              className="size-3.5 text-emerald-600"
                              aria-hidden="true"
                            />
                            {copy.includesDocuments}
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-[var(--color-ink)]/10 px-5 py-4">
                      <p className="min-w-0 whitespace-nowrap">
                        {Number(course.price) > 0 ? (
                          <>
                            <span className="text-2xl font-black tabular-nums">
                              {course.price}
                            </span>
                            <span className="ms-1 text-xs font-bold text-[var(--color-muted)]">
                              {copy.monthlyPrice}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                            {copy.free}
                          </span>
                        )}
                      </p>
                      {course.isSubscribed ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(course.id)}
                          aria-expanded={!!isExpanded}
                          className="sticker-btn-outline inline-flex min-h-11 shrink-0 items-center gap-2 px-5 text-sm font-black"
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform motion-reduce:transition-none",
                              isExpanded && "rotate-180"
                            )}
                            aria-hidden="true"
                          />
                          <span>
                            {isExpanded ? copy.hideContent : copy.courseContent}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          aria-disabled="true"
                          className="sticker-btn inline-flex min-h-11 shrink-0 items-center gap-2 px-5 text-sm font-black"
                        >
                          {copy.subscribe}
                        </button>
                      )}
                    </div>
                    {course.isSubscribed && isExpanded && (
                      <div className="border-t-2 border-[var(--color-ink)]/10 bg-[var(--color-surface-muted)] px-5 py-4 dark:border-border dark:bg-surface-muted">
                        {course.sections.length ? (
                          <div className="space-y-4">
                            {course.sections.map((section) => (
                              <div key={section.id}>
                                {section.title && (
                                  <h4 className="mb-2 text-sm font-black text-[var(--color-ink)]">
                                    {section.title}
                                  </h4>
                                )}
                                <div className="space-y-2">
                                  {section.lessons.map((lesson) => (
                                    <div
                                      key={lesson.id}
                                      className="border-b border-[var(--border-subtle)] pb-2 last:border-0"
                                    >
                                      <p className="text-xs font-extrabold text-[var(--color-ink)]">
                                        {lesson.title}
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {lesson.items.map((item) => (
                                          <span
                                            key={item.id}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-muted)]"
                                          >
                                            {item.hasVideo ? (
                                              <PlayCircle className="size-3.5 text-[var(--brand-indigo)]" />
                                            ) : item.hasDocument ? (
                                              <FileText className="size-3.5 text-emerald-600" />
                                            ) : (
                                              <ClipboardList className="size-3.5 text-amber-600" />
                                            )}
                                            {item.title}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-[var(--color-muted)]">
                            {copy.emptyCourseContent}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
