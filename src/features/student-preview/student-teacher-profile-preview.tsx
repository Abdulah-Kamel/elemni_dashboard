"use client";
/* eslint-disable @next/next/no-img-element -- preview renderers use native <img> for object URLs per spec */

import { useState } from "react";
import type { StudentTeacherPreviewModel, PreviewInteractionMode } from "./types";
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
} from "lucide-react";
import profileBackground from "@/assets/student-preview/profile-background.webp";
import lessonCalculus from "@/assets/student-preview/lesson-calculus.webp";
import lessonMechanics from "@/assets/student-preview/lesson-mechanics.webp";
import lessonStudySkills from "@/assets/student-preview/lesson-study-skills.webp";
import lessonArabic from "@/assets/student-preview/lesson-arabic.webp";

const courseThumbnails = [
  lessonCalculus,
  lessonMechanics,
  lessonStudySkills,
  lessonArabic,
];

interface StudentTeacherProfilePreviewProps {
  model: StudentTeacherPreviewModel;
  locale: string;
  interactionMode: PreviewInteractionMode;
}

export function StudentTeacherProfilePreview({
  model,
  locale,
  interactionMode,
}: StudentTeacherProfilePreviewProps) {
  const [expandedCourses, setExpandedCourses] = useState<Record<string | number, boolean>>({});

  const displayName = model.name || "اسم المدرس";
  const displayBio = model.bio || "نبذة عن المدرس";
  const displayTitle = model.title || "مدرس";

  const toggleExpand = (courseId: string | number) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  return (
    <div dir="rtl" className="student-preview bg-[var(--page)] text-[var(--on-surface)] pb-16">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-slate-950 pt-24 text-white shadow-xl">
        <img
          src={profileBackground.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-25 mix-blend-overlay pointer-events-none"
        />
        <div className="absolute inset-0 bg-slate-950/80 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-extrabold text-xs sm:text-sm backdrop-blur-md">
            <ArrowRight className="w-4 h-4" />
            <span>كل المدرسين</span>
          </span>

          <button
            disabled
            aria-disabled="true"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-200 font-extrabold text-xs sm:text-sm backdrop-blur-md cursor-not-allowed opacity-60"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 text-center md:text-start">
            <div className="relative shrink-0">
              <div className="w-44 h-52 sm:w-56 sm:h-64 md:w-64 md:h-72 rounded-3xl p-1.5 bg-gradient-to-tr from-amber-400/80 via-sky-400/80 to-[var(--brand-indigo)]/80 shadow-2xl">
                <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900 border border-white/10 relative">
                  {model.avatarUrl ? (
                    <img
                      src={model.avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--brand-indigo-tint)] text-2xl font-black text-[var(--brand-indigo-deep)]">
                      {displayName.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 end-3 bg-emerald-500 border-2 border-slate-900 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
                    <span className="text-[11px] font-black text-white">معلم موثوق</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معلم معتمد</span>
                </span>
                {model.subjects.map((sub, idx) => (
                  <span key={idx} className="bg-sky-500/20 border border-sky-400/40 text-sky-200 font-extrabold text-xs px-3 py-1 rounded-full backdrop-blur-md">{sub}</span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">{displayName}</h1>
              <p className="text-slate-300 text-sm sm:text-base font-semibold max-w-2xl">{displayTitle}</p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs sm:text-sm font-bold text-slate-200">
                <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  <span>{model.experienceYears} سنة خبرة</span>
                </div>
                <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>{model.courses.length} كورسات متاحة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About section */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)] py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
          <div>
            <p className="mb-2 text-xs font-extrabold text-[var(--brand-indigo)]">عن المدرس</p>
            <h2 className="text-2xl font-black text-[var(--on-surface)]">خبرة تساعدك تفهم، مش تحفظ</h2>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-[var(--on-surface-muted)]">{displayBio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {model.subjects.map((sub) => (
                <span key={sub} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800">
                  {sub}
                </span>
              ))}
            </div>
          </div>
          <div className="grid h-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]">
            <div className="bg-[var(--page)] p-4">
              <BookOpen className="mb-3 size-5 text-[var(--brand-indigo)]" />
              <strong className="block text-xl font-black">{model.courses.length}</strong>
              <span className="text-xs text-[var(--on-surface-muted)]">كورسات منشورة</span>
            </div>
            <div className="bg-[var(--page)] p-4">
              <MapPin className="mb-3 size-5 text-[var(--brand-amber)]" />
              <strong className="block text-sm font-black leading-6">{model.location ?? "أونلاين"}</strong>
              <span className="text-xs text-[var(--on-surface-muted)]">مكان التدريس</span>
            </div>
          </div>
        </div>
      </section>

      {/* Courses section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--brand-indigo-tint)] text-[var(--brand-indigo)] font-extrabold text-xs mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>تصفح المحاضرات والاشتراكات</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--on-surface)]">الكورسات المتاحة</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
            {model.courses.slice(0, 2).map((course, index) => {
              const isExpanded = expandedCourses[course.id];
              const thumbnail = course.coverUrl || courseThumbnails[index % courseThumbnails.length];

              return (
                <article
                  key={course.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md"
                >
                  <div>
                    <div className="relative w-full aspect-video overflow-hidden bg-slate-900">
                      <img
                        src={typeof thumbnail === "string" ? thumbnail : thumbnail.src}
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute end-3 top-3 bg-[var(--brand-indigo)]/90 text-white text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-md shadow-sm">{model.subject}</div>
                      {course.duration && (
                        <div className="absolute bottom-3 start-3 bg-slate-900/80 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="text-lg font-black text-[var(--on-surface)] leading-snug line-clamp-2 min-h-[52px]">{course.title || "عنوان الكورس"}</h3>
                      <p className="text-xs text-[var(--on-surface-muted)] leading-relaxed font-medium line-clamp-2">{course.description || "وصف الكورس"}</p>
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--on-surface-muted)] pt-2 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[var(--brand-indigo)]" />
                          <span>{course.sessionsCount} محاضرة</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>اختبارات وملازم</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0 mt-2">
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
                      <div>
                        <span className="text-2xl font-black text-[var(--on-surface)]">{course.price}</span>
                        <span className="ms-1 text-xs font-bold text-[var(--on-surface-muted)]">ج.م / الشهر</span>
                      </div>
                      {course.isSubscribed ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(course.id)}
                          aria-expanded={!!isExpanded}
                          className="py-2.5 px-5 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 bg-emerald-600 text-white"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          <span>محتوى الكورس</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          aria-disabled="true"
                          className="py-2.5 px-5 font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 bg-[var(--brand-indigo)] text-white cursor-not-allowed opacity-60"
                        >
                          <BookOpen className="w-4 h-4" />
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
                              {section.title && <h4 className="mb-2 text-sm font-black text-[var(--on-surface)]">{section.title}</h4>}
                              <div className="space-y-2">
                                {section.lessons.map((lesson) => (
                                  <div key={lesson.id} className="border-b border-[var(--border-subtle)] pb-2 last:border-0">
                                    <p className="text-xs font-extrabold text-[var(--on-surface)]">{lesson.title}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {lesson.items.map((item) => (
                                        <span key={item.id} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--on-surface-muted)]">
                                          {item.hasVideo ? <PlayCircle className="size-3.5 text-[var(--brand-indigo)]" /> : item.hasDocument ? <FileText className="size-3.5 text-emerald-600" /> : <ClipboardList className="size-3.5 text-amber-600" />}
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
                        <p className="text-xs font-bold text-[var(--on-surface-muted)]">لم يضف المدرس محتوى للكورس بعد.</p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
