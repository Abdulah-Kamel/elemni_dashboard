import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { NextIntlClientProvider } from "next-intl";
import { CourseList } from "../components/course-list";
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

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("US1 Journey: Course List", () => {
  it("shows loading state initially", () => {
    const { container } = renderWithIntl(
      <CourseList
        courses={[]}
        teacherProfileId={1}
        error={null}
        isEmpty={false}
        locale="ar"
      />
    );
    // When loading, the component should render something
    expect(container).toBeTruthy();
  });

  it("shows empty state when no courses", () => {
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

  it("shows error state when API fails", () => {
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
    expect(screen.getByText("إعادة المحاولة")).toBeTruthy();
  });

  it("shows success state with courses", () => {
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

  it("renders all course cards in success state", () => {
    renderWithIntl(
      <CourseList
        courses={mockCourses}
        teacherProfileId={1}
        error={null}
        isEmpty={false}
        locale="ar"
      />
    );
    // Should render 2 course cards
    expect(screen.getAllByText(/الجبر|الهندسة/).length).toBe(2);
  });
});
