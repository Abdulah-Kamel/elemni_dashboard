import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CourseForm } from "../components/course-form";

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
    loading_curriculum: "جارٍ التحميل...",
    curriculum_unavailable: "لا يمكن تحميل بيانات المناهج حالياً",
  },
};

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const mockSubjects = [
  { id: 1, name: "الرياضيات", slug: "math" },
  { id: 2, name: "الفيزياء", slug: "physics" },
];

const mockGrades = [
  { id: 3, name: "الصف الأول الثانوي", level: "secondary" },
  { id: 4, name: "الصف الثاني الثانوي", level: "secondary" },
];

const mockStreams = [
  { id: 1, name: "شعبة علوم تجريبية", slug: "experimental-sciences" },
  { id: 2, name: "شعبة رياضيات", slug: "mathematics" },
];

describe("CourseForm", () => {
  describe("create mode", () => {
    it("renders title field", () => {
      renderWithIntl(
        <CourseForm
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="create"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.getByLabelText("عنوان الدورة")).toBeTruthy();
    });

    it("renders description field", () => {
      renderWithIntl(
        <CourseForm
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="create"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.getByLabelText("الوصف")).toBeTruthy();
    });

    it("renders price field", () => {
      renderWithIntl(
        <CourseForm
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="create"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.getByLabelText("السعر (ج.م)")).toBeTruthy();
    });

    it("renders subject select", () => {
      renderWithIntl(
        <CourseForm
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="create"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.getByText("المادة")).toBeTruthy();
    });

    it("renders grade select", () => {
      renderWithIntl(
        <CourseForm
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="create"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.getByText("الصف")).toBeTruthy();
    });

    it("renders stream select", () => {
      renderWithIntl(
        <CourseForm
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="create"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.getByText("الشعبة")).toBeTruthy();
    });

    it("renders chapters vs flat toggle", () => {
      renderWithIntl(
        <CourseForm
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="create"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.getByText("دورة بالفصول")).toBeTruthy();
      expect(screen.getByText("دورة بقائمة دروس")).toBeTruthy();
    });
  });

  describe("edit mode", () => {
    it("renders title field with initial value", () => {
      renderWithIntl(
        <CourseForm
          initialValues={{
            title: "دورة الجبر",
            description: "مقدمة",
            price: "100.00",
            subjectId: 1,
            gradeId: 3,
            streamId: 1,
            useChapters: false,
          }}
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="edit"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.getByDisplayValue("دورة الجبر")).toBeTruthy();
    });

    it("renders read-only curriculum placement", () => {
      renderWithIntl(
        <CourseForm
          initialValues={{
            title: "دورة الجبر",
            description: "مقدمة",
            price: "100.00",
            subjectId: 1,
            gradeId: 3,
            streamId: 1,
            useChapters: false,
          }}
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="edit"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.getByText("التصنيف")).toBeTruthy();
    });

    it("does not render chapters toggle in edit mode", () => {
      renderWithIntl(
        <CourseForm
          initialValues={{
            title: "دورة الجبر",
            description: "مقدمة",
            price: "100.00",
            subjectId: 1,
            gradeId: 3,
            streamId: 1,
            useChapters: false,
          }}
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="edit"
          onChange={() => {}}
          disabled={false}
        />
      );
      expect(screen.queryByText("دورة بالفصول")).toBeNull();
      expect(screen.queryByText("دورة بقائمة دروس")).toBeNull();
    });
  });
});
