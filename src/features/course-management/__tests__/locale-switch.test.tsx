import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CourseForm } from "../components/course-form";

const arMessages = {
  courses: {
    title_label: "عنوان الدورة",
    description_label: "الوصف",
    price_label: "السعر (ج.م)",
    subject_label: "المادة",
    grade_label: "الصف",
    stream_label: "الشعبة",
    chapters_organized: "دورة بالفصول",
    flat_lessons: "دورة بقائمة دروس",
    curriculum_placement: "التصنيف",
    loading_curriculum: "جارٍ التحميل...",
    curriculum_unavailable: "لا يمكن تحميل بيانات المناهج حالياً",
  },
};

const enMessages = {
  courses: {
    title_label: "Course Title",
    description_label: "Description",
    price_label: "Price (EGP)",
    subject_label: "Subject",
    grade_label: "Grade",
    stream_label: "Stream",
    chapters_organized: "Organized into chapters",
    flat_lessons: "Flat list of lessons",
    curriculum_placement: "Curriculum",
    loading_curriculum: "Loading...",
    curriculum_unavailable: "Curriculum data is currently unavailable",
  },
};

const mockSubjects = [
  { id: 1, name: "الرياضيات", slug: "math" },
];

const mockGrades = [
  { id: 3, name: "الصف الأول الثانوي", level: "secondary" },
];

const mockStreams = [
  { id: 1, name: "شعبة علوم تجريبية", slug: "experimental-sciences" },
];

describe("Locale switch preserves form input", () => {
  it("renders form in Arabic", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <CourseForm
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="create"
          onChange={() => {}}
          disabled={false}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByLabelText("عنوان الدورة")).toBeTruthy();
  });

  it("renders form in English", () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <CourseForm
          subjects={mockSubjects}
          grades={mockGrades}
          streams={mockStreams}
          mode="create"
          onChange={() => {}}
          disabled={false}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByLabelText("Course Title")).toBeTruthy();
  });

  it("preserves form values across locale switch", () => {
    const { rerender } = render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
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
      </NextIntlClientProvider>
    );

    // Check Arabic label
    expect(screen.getByLabelText("عنوان الدورة")).toBeTruthy();

    // Re-render with English
    rerender(
      <NextIntlClientProvider locale="en" messages={enMessages}>
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
      </NextIntlClientProvider>
    );

    // Check English label
    expect(screen.getByLabelText("Course Title")).toBeTruthy();
    // Value should be preserved
    expect(screen.getByDisplayValue("دورة الجبر")).toBeTruthy();
  });
});
