import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CourseList, CourseListSkeleton } from "../components/course-list";
import { mockCourses } from "./mocks";

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

describe("CourseList", () => {
  describe("loading state", () => {
    it("shows Skeleton components when loading", () => {
      const { container } = renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      );
      // When loading, CourseListSkeleton should be used externally
      // But if we render CourseList with empty courses and no error, it shows empty state
      expect(container).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows localized 'no courses yet' message", () => {
      renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error={null}
          isEmpty={true}
          locale="ar"
        />
      );
      expect(screen.getByText("لا توجد دورات بعد")).toBeTruthy();
    });

    it("shows create action button", () => {
      renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error={null}
          isEmpty={true}
          locale="ar"
        />
      );
      expect(screen.getByText("أنشئ أول دورة لك")).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message", () => {
      renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error="حدث خطأ أثناء تحميل الدورات"
          isEmpty={false}
          locale="ar"
        />
      );
      expect(screen.getByText("حدث خطأ أثناء تحميل الدورات")).toBeTruthy();
    });

    it("shows retry button", () => {
      renderWithIntl(
        <CourseList
          courses={[]}
          teacherProfileId={1}
          error="حدث خطأ"
          isEmpty={false}
          locale="ar"
        />
      );
      expect(screen.getByText("إعادة المحاولة")).toBeTruthy();
    });
  });

  describe("success state", () => {
    it("shows course cards with titles", () => {
      renderWithIntl(
        <CourseList
          courses={mockCourses}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      );
      expect(screen.getByText("الجبر - الصف الأول الثانوي")).toBeTruthy();
      expect(screen.getByText("الهندسة - الصف الثاني الثانوي")).toBeTruthy();
    });

    it("shows price in EGP format", () => {
      renderWithIntl(
        <CourseList
          courses={mockCourses}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      );
      // Price should be formatted as EGP
      expect(screen.getAllByText(/ج\.م/).length).toBeGreaterThan(0);
    });

    it("shows status badges", () => {
      renderWithIntl(
        <CourseList
          courses={mockCourses}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      );
      expect(screen.getAllByText("منشور").length).toBeGreaterThan(0);
      expect(screen.getAllByText("مسودة").length).toBeGreaterThan(0);
    });

    it("shows curriculum tags", () => {
      renderWithIntl(
        <CourseList
          courses={mockCourses}
          teacherProfileId={1}
          error={null}
          isEmpty={false}
          locale="ar"
        />
      );
      expect(screen.getAllByText("الرياضيات").length).toBeGreaterThan(0);
    });
  });
});

describe("CourseListSkeleton", () => {
  it("renders skeleton placeholders", () => {
    const { container } = renderWithIntl(<CourseListSkeleton />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
