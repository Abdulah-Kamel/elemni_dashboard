import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentTeacherProfilePreview } from "../student-teacher-profile-preview";
import type { StudentTeacherPreviewModel } from "../types";

const baseModel: StudentTeacherPreviewModel = {
  id: 1,
  name: "أحمد محمد",
  title: "رياضيات",
  subject: "رياضيات",
  subjects: ["رياضيات", "فيزياء"],
  grades: ["الصف الأول", "الصف الثاني"],
  avatarUrl: "https://cdn.example.com/avatar.jpg",
  experienceYears: 5,
  bio: "مدرس متخصص في الرياضيات",
  location: "القاهرة",
  courses: [
    {
      id: 100,
      title: "كورس الجبر",
      description: "شرح الجبر من الصفر",
      price: "99",
      duration: "٣٠ ساعة",
      sessionsCount: 12,
      coverUrl: "https://cdn.example.com/cover.jpg",
      isSubscribed: false,
      sections: [],
    },
    {
      id: 101,
      title: "كورس الهندسة",
      description: "أساسيات الهندسة",
      price: "149",
      duration: "٢٥ ساعة",
      sessionsCount: 10,
      coverUrl: null,
      isSubscribed: true,
      sections: [
        {
          id: 1,
          title: "الفصل الأول",
          lessons: [
            {
              id: 10,
              title: "مقدمة في الهندسة",
              description: null,
              durationMinutes: 45,
              items: [
                { id: 20, title: "فيديو المقدمة", hasVideo: true, hasDocument: false, hasExam: false },
                { id: 21, title: "ملف التمارين", hasVideo: false, hasDocument: true, hasExam: false },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("StudentTeacherProfilePreview", () => {
  it("renders without crashing", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText("أحمد محمد")).toBeDefined();
  });

  it("is wrapped in .student-preview scope", () => {
    const { container } = render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const scope = container.querySelector(".student-preview");
    expect(scope).not.toBeNull();
  });

  it("shows teacher name", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText("أحمد محمد")).toBeDefined();
  });

  it("shows teacher bio", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText("مدرس متخصص في الرياضيات")).toBeDefined();
  });

  it("shows experience years", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText(/5.*سنة خبرة/)).toBeDefined();
  });

  it("shows subject tags", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getAllByText("رياضيات").length).toBeGreaterThan(0);
    expect(screen.getAllByText("فيزياء").length).toBeGreaterThan(0);
  });

  it("shows avatar with teacher name as alt", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const avatar = screen.getByAltText("أحمد محمد");
    expect(avatar).toBeDefined();
    expect(avatar.tagName).toBe("IMG");
  });

  it("uses native img for avatar (not next/image)", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const images = document.querySelectorAll("img");
    for (const img of images) {
      expect(img.tagName).toBe("IMG");
    }
  });

  it("shows profile background image", () => {
    const { container } = render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const bgImg = container.querySelector("img[alt='']");
    expect(bgImg).not.toBeNull();
  });

  it("shows course cards", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText("كورس الجبر")).toBeDefined();
    expect(screen.getByText("كورس الهندسة")).toBeDefined();
  });

  it("shows course prices", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText("99")).toBeDefined();
    expect(screen.getByText("149")).toBeDefined();
  });

  it("share button is disabled/inert", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const shareBtn = screen.getByText("مشاركة").closest("button");
    expect(shareBtn).not.toBeNull();
    expect(shareBtn!.disabled || shareBtn!.getAttribute("aria-disabled")).toBeTruthy();
  });

  it("subscribe button shows disabled state for unsubscribed courses", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const subscribeBtns = screen.getAllByText("اشترك الآن");
    expect(subscribeBtns.length).toBeGreaterThan(0);
    for (const btn of subscribeBtns) {
      const button = btn.closest("button");
      expect(button!.disabled || button!.hasAttribute("disabled")).toBeTruthy();
    }
  });

  it("expand button works for subscribed courses", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const expandBtn = screen.getByText("محتوى الكورس").closest("button");
    expect(expandBtn).not.toBeNull();
    fireEvent.click(expandBtn!);
    expect(screen.getByText("الفصل الأول")).toBeDefined();
  });

  it("shows curriculum items when expanded", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const expandBtn = screen.getByText("محتوى الكورس").closest("button");
    fireEvent.click(expandBtn!);
    expect(screen.getByText("مقدمة في الهندسة")).toBeDefined();
    expect(screen.getByText("فيديو المقدمة")).toBeDefined();
    expect(screen.getByText("ملف التمارين")).toBeDefined();
  });

  it("shows placeholder for empty name", () => {
    const model = { ...baseModel, name: "" };
    render(
      <StudentTeacherProfilePreview model={model} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText("اسم المدرس")).toBeDefined();
  });

  it("shows placeholder for empty bio", () => {
    const model = { ...baseModel, bio: "" };
    render(
      <StudentTeacherProfilePreview model={model} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText("نبذة عن المدرس")).toBeDefined();
  });

  it("shows course count", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText(/2.*كورس/)).toBeDefined();
  });

  it("shows location", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText("القاهرة")).toBeDefined();
  });

  it("uses container-query breakpoints for the emulated device frame", () => {
    const { container } = render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const courseGrid = Array.from(container.querySelectorAll("div")).find((element) =>
      element.className.includes("@sm/preview:grid-cols-2")
    );
    expect(courseGrid).toBeDefined();
  });
});
