import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CourseCard } from "../components/course-card";
import type { CourseOut } from "@/features/shell/schema";

const messages = {
  courses: {
    title: "دورةي",
    create: "إنشاء دورة",
    edit: "تعديل",
    published: "منشور",
    draft: "مسودة",
    publish: "نشر",
    unpublish: "إلغاء النشر",
    price: "السعر",
    title_label: "عنوان الدورة",
    description_label: "الوصف",
    price_label: "السعر (ج.م)",
    subject_label: "المادة",
    grade_label: "الصف",
    stream_label: "الشعبة",
    chapters_organized: "دورة بالفصول",
    flat_lessons: "دورة بقائمة دروس",
    curriculum_placement: "التصنيف",
    empty: "لا توجد دورات بعد",
    empty_action: "أنشئ أول دورة لك",
    loading: "جارٍ تحميل الدورات...",
    error_loading: "حدث خطأ أثناء تحميل الدورات",
    retry: "إعادة المحاولة",
    save: "حفظ",
    cancel: "إلغاء",
    course_created: "تم إنشاء الدورة بنجاح",
    course_updated: "تم تحديث الدورة بنجاح",
    course_published: "تم نشر الدورة بنجاح",
    course_unpublished: "تم إلغاء نشر الدورة",
    free: "مجانية",
    egp: "ج.م",
    saving: "جارٍ الحفظ...",
  },
};

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const mockCourse: CourseOut = {
  id: 1,
  title: "الجبر - الصف الأول الثانوي",
  description: "مقدمة في الجبر",
  price: "150.00",
  is_published: true,
  use_chapters: true,
  subject_id: 1,
  subject_name: "الرياضيات",
  teacher_profile_id: 7,
  grade_id: 3,
  stream_id: 1,
  created_by_id: 7,
  created_at: "2026-06-15T08:00:00Z",
};

describe("CourseCard", () => {
  it("renders course title", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    );
    expect(screen.getByText("الجبر - الصف الأول الثانوي")).toBeTruthy();
  });

  it("renders price in EGP format", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    );
    // Price should be formatted with EGP currency
    expect(screen.getByText(/ج\.م/)).toBeTruthy();
  });

  it("shows published badge for published courses", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    );
    expect(screen.getByText("منشور")).toBeTruthy();
  });

  it("shows draft badge for unpublished courses", () => {
    const draftCourse = { ...mockCourse, is_published: false };
    renderWithIntl(
      <CourseCard course={draftCourse} teacherProfileId={7} locale="ar" />
    );
    expect(screen.getByText("مسودة")).toBeTruthy();
  });

  it("renders subject name badge", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    );
    expect(screen.getByText("الرياضيات")).toBeTruthy();
  });

  it("renders curriculum placement label", () => {
    renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    );
    expect(screen.getByText("التصنيف")).toBeTruthy();
  });

  it("shows 'Free' for zero price", () => {
    const freeCourse = { ...mockCourse, price: "0.00" };
    renderWithIntl(
      <CourseCard course={freeCourse} teacherProfileId={7} locale="ar" />
    );
    expect(screen.getByText("مجانية")).toBeTruthy();
  });

  it("applies opacity for draft courses", () => {
    const draftCourse = { ...mockCourse, is_published: false };
    const { container } = renderWithIntl(
      <CourseCard course={draftCourse} teacherProfileId={7} locale="ar" />
    );
    const card = container.querySelector('[data-slot="card"]');
    expect(card?.className).toContain("opacity-75");
  });

  it("does not apply opacity for published courses", () => {
    const { container } = renderWithIntl(
      <CourseCard course={mockCourse} teacherProfileId={7} locale="ar" />
    );
    const card = container.querySelector('[data-slot="card"]');
    expect(card?.className).not.toContain("opacity-75");
  });
});
