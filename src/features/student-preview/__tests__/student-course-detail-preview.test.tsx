import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentCourseDetailPreview } from "../student-course-detail-preview";
import type { StudentCoursePreviewModel } from "../types";

const baseModel: StudentCoursePreviewModel = {
  id: 42,
  title: "كورس الفيزياء",
  description: "شرح شامل للفيزياء للمراحل الثانوية",
  coverUrl: "https://cdn.example.com/physics-cover.jpg",
  price: "200",
  subject: "فيزياء",
  grade: "الصف الثالث الثانوي",
  stream: "علمي",
  teacher: { name: "محمد علي", avatarUrl: "https://cdn.example.com/teacher.jpg" },
  sections: [
    {
      id: 1,
      title: "الوحدة الأولى: الميكانيكا",
      lessons: [
        {
          id: 10,
          title: "الحركة الخطية",
          description: "شرح الحركة الخطية والسرعة والتسارع",
          durationMinutes: 60,
          items: [
            { id: 20, title: "فيديو المحاضرة", hasVideo: true, hasDocument: false, hasExam: false },
            { id: 21, title: "ملف المحاضرة", hasVideo: false, hasDocument: true, hasExam: false },
            { id: 22, title: "اختبار قصير", hasVideo: false, hasDocument: false, hasExam: true },
          ],
        },
        {
          id: 11,
          title: "قانون نيوتن",
          description: null,
          durationMinutes: 45,
          items: [
            { id: 23, title: "فيديو نيوتن", hasVideo: true, hasDocument: false, hasExam: false },
          ],
        },
      ],
    },
    {
      id: 2,
      title: "الوحدة الثانية: الكهرباء",
      lessons: [
        {
          id: 12,
          title: "التيار الكهربائي",
          description: null,
          durationMinutes: 50,
          items: [
            { id: 24, title: "فيديو الكهرباء", hasVideo: true, hasDocument: false, hasExam: false },
          ],
        },
      ],
    },
  ],
};

const emptySectionsModel: StudentCoursePreviewModel = {
  ...baseModel,
  sections: [],
};

describe("StudentCourseDetailPreview", () => {
  it("renders without crashing", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("كورس الفيزياء")).toBeDefined();
  });

  it("is wrapped in .student-preview scope", () => {
    const { container } = render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const scope = container.querySelector(".student-preview");
    expect(scope).not.toBeNull();
  });

  it("shows course title", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("كورس الفيزياء")).toBeDefined();
  });

  it("shows course description", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("شرح شامل للفيزياء للمراحل الثانوية")).toBeDefined();
  });

  it("shows teacher name", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("محمد علي")).toBeDefined();
  });

  it("shows subject badge", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("فيزياء")).toBeDefined();
  });

  it("shows grade and stream badge", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("الصف الثالث الثانوي - علمي")).toBeDefined();
  });

  it("shows course stats (lessons, duration, exams)", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const lessons = screen.getAllByText(/درس/);
    expect(lessons.length).toBeGreaterThanOrEqual(1);
    const exams = screen.getAllByText(/اختبار/);
    expect(exams.length).toBeGreaterThanOrEqual(1);
  });

  it("formats price with Intl.NumberFormat", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const btn = screen.getByText(/اشترك الآن/);
    // ar-EG formats 200 as ٢٠٠ (Arabic-Indic numerals)
    expect(btn.textContent).toMatch(/[٢2][\u0660\u06F00]/);
  });

  it("subscribe button is disabled", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const btn = screen.getByText(/اشترك الآن/).closest("button");
    expect(btn!.disabled || btn!.hasAttribute("disabled")).toBeTruthy();
  });

  it("shows chapters", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("الوحدة الأولى: الميكانيكا")).toBeDefined();
    expect(screen.getByText("الوحدة الثانية: الكهرباء")).toBeDefined();
  });

  it("auto-expands first chapter and first lesson on mount", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    // First chapter is auto-expanded, first lesson items should be visible
    expect(screen.getByText("فيديو المحاضرة")).toBeDefined();
  });

  it("collapse works for chapters", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    // First chapter is expanded, click to collapse
    const chapterBtn = screen.getByText("الوحدة الأولى: الميكانيكا").closest("button");
    fireEvent.click(chapterBtn!);
    // First lesson items should no longer be visible
    expect(screen.queryByText("فيديو المحاضرة")).toBeNull();
  });

  it("expand works for second chapter", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const chapterBtn = screen.getByText("الوحدة الثانية: الكهرباء").closest("button");
    fireEvent.click(chapterBtn!);
    expect(screen.getByText("التيار الكهربائي")).toBeDefined();
  });

  it("collapse works for lessons", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    // First lesson is auto-expanded, click to collapse
    const lessonBtn = screen.getByText("الحركة الخطية").closest("button");
    fireEvent.click(lessonBtn!);
    // Items should be hidden
    expect(screen.queryByText("فيديو المحاضرة")).toBeNull();
  });

  it("video player section is not rendered (inert)", () => {
    const { container } = render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const iframes = container.querySelectorAll("iframe");
    expect(iframes.length).toBe(0);
  });

  it("tabs are rendered but disabled except content", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("المحتوى")).toBeDefined();
    const examsTab = screen.getByText("الاختبارات");
    expect(examsTab.closest("button")!.disabled).toBeTruthy();
  });

  it("uses native img for teacher avatar", () => {
    const { container } = render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
    expect(images[0].tagName).toBe("IMG");
  });

  it("shows empty state when no sections", () => {
    render(
      <StudentCourseDetailPreview model={emptySectionsModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("محتوى الكورس غير متاح حالياً")).toBeDefined();
    // Subscribe button should not render (price = "200" but no sections, still shows subscribe)
  });

  it("shows empty state when all sections have 0 lessons", () => {
    const zeroLessonsModel: StudentCoursePreviewModel = {
      ...baseModel,
      sections: [{ id: 99, title: "وحدة فارغة", lessons: [] }],
    };
    render(
      <StudentCourseDetailPreview model={zeroLessonsModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("محتوى الكورس غير متاح حالياً")).toBeDefined();
  });

  it("guest viewer shows lock icon on lesson items", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    // First lesson is auto-expanded — items should be visible without clicking
    expect(screen.getAllByText("يتطلب الاشتراك").length).toBeGreaterThan(0);
  });

  it("subscribed viewer shows 'غير متاح حالياً' instead of lock", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="subscribed" interactionMode="local-only" />
    );
    // First lesson is auto-expanded — items should be visible without clicking
    expect(screen.queryByText("يتطلب الاشتراك")).toBeNull();
    expect(screen.getAllByText("غير متاح حالياً").length).toBeGreaterThan(0);
  });

  it("guest viewer shows subscribe CTA", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText(/اشترك الآن/)).toBeDefined();
  });

  it("subscribed viewer shows 'عرض محتوى الكورس' CTA", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="subscribed" interactionMode="local-only" />
    );
    expect(screen.getByText("عرض محتوى الكورس")).toBeDefined();
    expect(screen.queryByText(/اشترك الآن/)).toBeNull();
  });

  it("subscribed viewer back link shows 'العودة إلى دوراتي'", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="subscribed" interactionMode="local-only" />
    );
    expect(screen.getByText("العودة إلى دوراتي")).toBeDefined();
  });

  it("does not call onCurriculumCommitted (preview is read-only)", () => {
    const onCommitted = vi.fn();
    render(
      <StudentCourseDetailPreview
        model={baseModel}
        locale="ar"
        viewer="guest"
        interactionMode="local-only"
        onCurriculumCommitted={onCommitted}
      />
    );
    // Preview is local-only, callback is never triggered by the renderer
    expect(onCommitted).not.toHaveBeenCalled();
  });

  it("guest viewer back link shows 'العودة'", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    // "العودة" alone - not "العودة إلى دوراتي"
    expect(screen.getByText("العودة")).toBeDefined();
  });

  it("content heading changes based on viewer", () => {
    const { rerender } = render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("خطة الكورس")).toBeDefined();
    rerender(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="subscribed" interactionMode="local-only" />
    );
    expect(screen.getByText("محتوى الكورس")).toBeDefined();
  });
});
