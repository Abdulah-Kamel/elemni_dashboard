import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  it("subscribe button remains inert without looking disabled", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const btn = screen.getByText(/اشترك الآن/).closest("button");
    expect(btn!.disabled).toBe(false);
    expect(btn!.getAttribute("aria-disabled")).toBe("true");
    expect(btn!.className).not.toContain("opacity-60");
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

  it("notifies the editor when a preview lesson is selected", () => {
    const onSelectNode = vi.fn();
    render(
      <StudentCourseDetailPreview
        model={baseModel}
        locale="ar"
        viewer="guest"
        interactionMode="local-only"
        onSelectNode={onSelectNode}
      />
    );

    fireEvent.click(screen.getByText("الحركة الخطية").closest("button")!);
    expect(onSelectNode).toHaveBeenCalledWith({
      type: "lesson",
      id: 10,
      chapterId: 1,
    });
  });

  it("opens the selected editor lesson in the preview", async () => {
    const { rerender } = render(
      <StudentCourseDetailPreview
        model={baseModel}
        locale="ar"
        viewer="guest"
        interactionMode="local-only"
        selectedNode={null}
      />
    );

    expect(screen.queryByText("فيديو نيوتن")).toBeNull();

    rerender(
      <StudentCourseDetailPreview
        model={baseModel}
        locale="ar"
        viewer="guest"
        interactionMode="local-only"
        selectedNode={{ type: "lesson", id: 11 }}
      />
    );

    await waitFor(() => expect(screen.getByText("فيديو نيوتن")).toBeDefined());
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

  it("renders the course cover image when coverUrl is provided", () => {
    const { container } = render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const coverImg = container.querySelector('img[alt="كورس الفيزياء"]');
    expect(coverImg).not.toBeNull();
    expect(coverImg!.getAttribute("src")).toBe("https://cdn.example.com/physics-cover.jpg");
  });

  it("does not render a cover image when coverUrl is null", () => {
    const noCoverModel: StudentCoursePreviewModel = {
      ...baseModel,
      coverUrl: null,
    };
    const { container } = render(
      <StudentCourseDetailPreview model={noCoverModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const coverImg = container.querySelector('img[alt="كورس الفيزياء"]');
    expect(coverImg).toBeNull();
  });

  it("shows empty state when no sections", () => {
    render(
      <StudentCourseDetailPreview model={emptySectionsModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("محتوى الكورس غير متاح حالياً")).toBeDefined();
    const emptyStateCopy = screen
      .getByText("عند نشر المدرس للدروس والمواد التعليمية ستظهر هنا تلقائياً.")
      .closest("p");
    expect(emptyStateCopy?.className).toContain("w-full");
    expect(emptyStateCopy?.className).not.toContain("max-w-");
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

  it("shows subscription requirements for public lesson items", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    // First lesson is auto-expanded — items should be visible without clicking
    expect(screen.getAllByText("يتطلب الاشتراك").length).toBeGreaterThan(0);
  });

  it("shows the public subscribe CTA regardless of the deprecated viewer prop", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getAllByText(/اشترك الآن/).length).toBeGreaterThan(0);
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="subscribed" interactionMode="local-only" />
    );
    expect(screen.getAllByText(/اشترك الآن/).length).toBeGreaterThan(0);
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

  it("uses container-query breakpoints for the emulated device frame", () => {
    const { container } = render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    const heroGrid = Array.from(container.querySelectorAll("div")).find((element) =>
      element.className.includes("@lg/preview:grid-cols-[1fr_auto]")
    );
    expect(heroGrid).toBeDefined();
  });

  it("uses the public student detail copy", () => {
    render(
      <StudentCourseDetailPreview model={baseModel} locale="ar" viewer="guest" interactionMode="local-only" />
    );
    expect(screen.getByText("العودة إلى الاستكشاف")).toBeDefined();
    expect(screen.getByText("خطة الكورس")).toBeDefined();
  });

  it("localizes the public preview in English", () => {
    const { container } = render(
      <StudentCourseDetailPreview model={baseModel} locale="en" interactionMode="local-only" />
    );
    expect(container.firstElementChild?.getAttribute("dir")).toBe("ltr");
    expect(screen.getByText("Back to discovery")).toBeDefined();
    expect(screen.getByText("Course plan")).toBeDefined();
    expect(screen.getByText(/Subscribe now/)).toBeDefined();
    expect(screen.getAllByText(/lesson/).length).toBeGreaterThan(0);
  });
});
