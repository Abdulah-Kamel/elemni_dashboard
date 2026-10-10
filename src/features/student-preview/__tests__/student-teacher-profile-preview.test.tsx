import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentTeacherProfilePreview } from "../student-teacher-profile-preview";
import { ProfilePreviewBridgeProvider } from "../profile-preview-bridge";
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
  it.each(["avatar", "name", "experience", "bio", "location"] as const)("keeps empty %s hover and selection wired", (field) => {
    const { container } = render(
      <ProfilePreviewBridgeProvider>
        <StudentTeacherProfilePreview model={{ ...baseModel, avatarUrl: null, name: "", bio: "", experienceYears: 0, location: "" }} locale="en" interactionMode="local-only" />
      </ProfilePreviewBridgeProvider>
    );
    const target = container.querySelector(`[data-profile-preview-field="${field}"]`)!;
    expect(target).not.toBeNull();
    fireEvent.mouseEnter(target);
    expect(target.getAttribute("data-profile-preview-state")).toBe("hovered");
    fireEvent.mouseLeave(target);
    expect(target.getAttribute("data-profile-preview-state")).toBe("idle");
    fireEvent.click(target.querySelector("button")!);
    expect(target.getAttribute("data-profile-preview-state")).toBe("selected");
    expect(target.className).toContain("ring-2");
    if (field === "location") expect(target.textContent).toContain("Online");
  });

  it("shows the published-course empty state", () => {
    render(<StudentTeacherProfilePreview model={{ ...baseModel, courses: [] }} locale="ar" interactionMode="local-only" />);
    expect(screen.getByText("لم ينشر المدرس كورسات بعد.")).toBeDefined();
  });

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
    expect(screen.getByText(/5.*سنوات خبرة/)).toBeDefined();
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

  it("shows the blue grid profile banner", () => {
    const { container } = render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const bgImg = container.querySelector(".preview-profile-banner");
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
    expect(screen.getByText("كورسان")).toBeDefined();
  });

  it("shows location", () => {
    render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    expect(screen.getByText("القاهرة")).toBeDefined();
  });

  it("localizes the profile preview in English", () => {
    const { container } = render(
      <StudentTeacherProfilePreview model={baseModel} locale="en" interactionMode="local-only" />
    );
    expect(container.firstElementChild?.getAttribute("dir")).toBe("ltr");
    expect(screen.getByText("All teachers")).toBeDefined();
    expect(screen.getByText("Courses")).toBeDefined();
    expect(screen.getByText("5 years of experience")).toBeDefined();
    expect(screen.getByText("Subscribe")).toBeDefined();
    expect(screen.getByText("Course content")).toBeDefined();
  });

  it("uses container-query breakpoints for the emulated device frame", () => {
    const { container } = render(
      <StudentTeacherProfilePreview model={baseModel} locale="ar" interactionMode="local-only" />
    );
    const courseGrid = Array.from(container.querySelectorAll("div")).find((element) =>
      element.className.includes("@xl/preview:grid-cols-2")
    );
    expect(courseGrid).toBeDefined();
  });
});
