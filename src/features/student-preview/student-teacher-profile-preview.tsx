"use client"
/* eslint-disable @next/next/no-img-element -- preview renderers use native <img> for object URLs per spec */

import { useState } from "react"
import type {
  StudentTeacherPreviewModel,
  PreviewInteractionMode,
} from "./types"
import {
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  Award,
  Sparkles,
  Share2,
  MapPin,
  ChevronDown,
  PlayCircle,
  FileText,
  ClipboardList,
} from "lucide-react"
import profileBackground from "@/assets/student-preview/profile-background.webp"
import lessonCalculus from "@/assets/student-preview/lesson-calculus.webp"
import lessonMechanics from "@/assets/student-preview/lesson-mechanics.webp"
import lessonStudySkills from "@/assets/student-preview/lesson-study-skills.webp"
import lessonArabic from "@/assets/student-preview/lesson-arabic.webp"

const courseThumbnails = [
  lessonCalculus,
  lessonMechanics,
  lessonStudySkills,
  lessonArabic,
]

interface StudentTeacherProfilePreviewProps {
  model: StudentTeacherPreviewModel
  locale: string
  interactionMode: PreviewInteractionMode
}

export function StudentTeacherProfilePreview({
  model,
}: StudentTeacherProfilePreviewProps) {
  const [expandedCourses, setExpandedCourses] = useState<
    Record<string | number, boolean>
  >({})

  const displayName = model.name || "اسم المدرس"
  const displayBio = model.bio || "نبذة عن المدرس"
  const displayTitle = model.title || "مدرس"

  const toggleExpand = (courseId: string | number) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }))
  }

  return (
    <div
      dir="rtl"
      className="student-preview bg-[var(--page)] pb-16 text-[var(--on-surface)]"
    >
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-slate-950 pt-24 text-white shadow-xl">
        <img
          src={profileBackground.src}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-25 mix-blend-overlay"
        />
        <div className="pointer-events-none absolute inset-0 bg-slate-950/80" />

        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 pt-6 @sm/preview:px-6 @lg/preview:px-8">
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold text-white backdrop-blur-md @sm/preview:text-sm">
            <ArrowRight className="h-4 w-4" />
            <span>كل المدرسين</span>
          </span>

          <button
            disabled
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/20 px-4 py-2 text-xs font-extrabold text-sky-200 opacity-60 backdrop-blur-md @sm/preview:text-sm"
          >
            <Share2 className="h-4 w-4" />
            <span>مشاركة</span>
          </button>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-16 @sm/preview:px-6 @sm/preview:pb-20 @lg/preview:px-8">
          <div className="flex flex-col items-center gap-6 text-center @sm/preview:gap-8 @md/preview:flex-row @md/preview:items-end @md/preview:text-start">
            <div className="relative shrink-0">
              <div className="h-52 w-44 rounded-3xl bg-gradient-to-tr from-amber-400/80 via-sky-400/80 to-[var(--brand-indigo)]/80 p-1.5 shadow-2xl @sm/preview:h-64 @sm/preview:w-56 @md/preview:h-72 @md/preview:w-64">
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                  {model.avatarUrl ? (
                    <img
                      src={model.avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--brand-indigo-tint)] text-2xl font-black text-[var(--brand-indigo-deep)]">
                      {displayName.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute end-3 bottom-3 flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-emerald-500 px-2.5 py-1 shadow-lg">
                    <CheckCircle2 className="h-4 w-4 stroke-[3] text-white" />
                    <span className="text-xs font-black text-white">
                      معلم موثوق
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-2 @md/preview:justify-start">
                <span className="flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>معلم معتمد</span>
                </span>
                {model.subjects.map((sub, idx) => (
                  <span
                    key={idx}
                    className="rounded-full border border-sky-400/40 bg-sky-500/20 px-3 py-1 text-xs font-extrabold text-sky-200 backdrop-blur-md"
                  >
                    {sub}
                  </span>
                ))}
              </div>

              <h1 className="line-clamp-2 text-3xl font-black tracking-tight text-white @sm/preview:text-4xl @lg/preview:line-clamp-1 @lg/preview:text-5xl">
                {displayName}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-bold text-slate-200 @sm/preview:text-sm @md/preview:justify-start">
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-md">
                  <Award className="h-4 w-4 text-sky-400" />
                  <span>{model.experienceYears} سنة خبرة</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-md">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  <span>{model.courses.length} كورسات متاحة</span>
                </div>
              </div>
              <div className="mx-auto grid max-w-7xl gap-8 @lg/preview:grid-cols-[1.4fr_1fr] ">
                <div>
                  <p className="mb-2 text-xs font-extrabold text-sky-300">
                    عن المدرس
                  </p>
                  <h2 className="text-2xl font-black text-white">
                    خبرة تساعدك تفهم، مش تحفظ
                  </h2>
                  <p className="mt-3 line-clamp-4 text-sm leading-7 font-medium text-slate-300">
                    {displayBio}
                  </p>
                </div>
                <div className="grid h-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/15 bg-white/10 backdrop-blur-md">
                  <div className="bg-white/5 p-4">
                    <BookOpen className="mb-3 size-5 text-sky-300" />
                    <strong className="block text-xl font-black text-white">
                      {model.courses.length}
                    </strong>
                    <span className="text-xs text-slate-300">
                      كورسات منشورة
                    </span>
                  </div>
                  <div className="bg-white/5 p-4">
                    <MapPin className="mb-3 size-5 text-amber-300" />
                    <strong className="block truncate text-sm leading-6 font-black text-white">
                      {model.location ?? "أونلاين"}
                    </strong>
                    <span className="text-xs text-slate-300">
                      مكان التدريس
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About section */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)] py-10"></section>

      {/* Courses section */}
      <div className="mx-auto max-w-7xl px-4 py-10 @sm/preview:px-6 @sm/preview:py-14 @lg/preview:px-8">
        <section className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--border)] pb-2 @sm/preview:flex-row @sm/preview:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--brand-indigo-tint)] px-3.5 py-1 text-xs font-extrabold text-[var(--brand-indigo)]">
                <BookOpen className="h-3.5 w-3.5" />
                <span>تصفح المحاضرات والاشتراكات</span>
              </div>
              <h2 className="text-2xl font-black text-[var(--on-surface)] @sm/preview:text-3xl">
                الكورسات المتاحة
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 @sm/preview:grid-cols-2">
            {model.courses.slice(0, 2).map((course, index) => {
              const isExpanded = expandedCourses[course.id]
              const thumbnail =
                course.coverUrl ||
                courseThumbnails[index % courseThumbnails.length]

              return (
                <article
                  key={course.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md"
                >
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                      <img
                        src={
                          typeof thumbnail === "string"
                            ? thumbnail
                            : thumbnail.src
                        }
                        alt={course.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute end-3 top-3 rounded-full bg-[var(--brand-indigo)]/90 px-3 py-1 text-xs font-black text-white shadow-sm backdrop-blur-md">
                        {model.subject}
                      </div>
                      {course.duration && (
                        <div className="absolute start-3 bottom-3 flex items-center gap-1 rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-slate-200 backdrop-blur-md">
                          <Clock className="h-3 w-3 text-sky-400" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-5">
                      <h3 className="line-clamp-2 min-h-13 text-lg leading-snug font-black text-[var(--on-surface)]">
                        {course.title || "عنوان الكورس"}
                      </h3>
                      <p className="line-clamp-2 text-xs leading-relaxed font-medium text-[var(--on-surface-muted)]">
                        {course.description || "وصف الكورس"}
                      </p>
                      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 text-xs font-bold text-[var(--on-surface-muted)]">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-[var(--brand-indigo)]" />
                          <span>{course.sessionsCount} محاضرة</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>اختبارات وملازم</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 p-5 pt-0">
                    <div className="flex items-center justify-between gap-3 border-t border-[#F1F5F9] pt-3">
                      <div>
                        <span className="text-2xl font-black text-[var(--on-surface)]">
                          {course.price}
                        </span>
                        <span className="ms-1 text-xs font-bold text-[var(--on-surface-muted)]">
                          ج.م / الشهر
                        </span>
                      </div>
                      {course.isSubscribed ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(course.id)}
                          aria-expanded={!!isExpanded}
                          className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition-all @sm/preview:text-sm"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                          <span>محتوى الكورس</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          aria-disabled="true"
                          className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-[var(--brand-indigo)] px-5 py-2.5 text-xs font-black text-white opacity-60 shadow-md @sm/preview:text-sm"
                        >
                          <BookOpen className="h-4 w-4" />
                          <span>اشترك الآن</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {course.isSubscribed && isExpanded && (
                    <div className="border-t border-[#F1F5F9] bg-[#F8FAFC] px-5 py-4">
                      {course.sections.length ? (
                        <div className="space-y-4">
                          {course.sections.map((section) => (
                            <div key={section.id}>
                              {section.title && (
                                <h4 className="mb-2 text-sm font-black text-[var(--on-surface)]">
                                  {section.title}
                                </h4>
                              )}
                              <div className="space-y-2">
                                {section.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="border-b border-[var(--border-subtle)] pb-2 last:border-0"
                                  >
                                    <p className="text-xs font-extrabold text-[var(--on-surface)]">
                                      {lesson.title}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {lesson.items.map((item) => (
                                        <span
                                          key={item.id}
                                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--on-surface-muted)]"
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
                        <p className="text-xs font-bold text-[var(--on-surface-muted)]">
                          لم يضف المدرس محتوى للكورس بعد.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
