import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CourseWorkspace } from "../course-workspace";
import type { StudentCoursePreviewModel, StudentPreviewSection } from "../types";

const mockModel: StudentCoursePreviewModel = {
  id: 42,
  title: "كورس الفيزياء",
  description: "شرح شامل",
  coverUrl: null,
  price: "200",
  subject: "فيزياء",
  grade: null,
  stream: null,
  teacher: { name: "محمد علي", avatarUrl: null },
  sections: [],
};

describe("CourseWorkspace", () => {
  it("renders editor and preview", () => {
    render(
      <CourseWorkspace model={mockModel} locale="ar" viewer="guest" />
    );
    expect(screen.getByText("كورس الفيزياء")).toBeDefined();
  });

  it("updates preview when title changes", () => {
    render(
      <CourseWorkspace model={mockModel} locale="ar" viewer="guest" />
    );
    const titleInput = screen.getByDisplayValue("كورس الفيزياء");
    fireEvent.change(titleInput, { target: { value: "كورس رياضيات" } });
    expect(screen.getByText("كورس رياضيات")).toBeDefined();
  });

  it("toggles viewer mode", () => {
    render(
      <CourseWorkspace model={mockModel} locale="ar" viewer="guest" />
    );
    const viewerToggle = screen.getByRole("radio", { name: /مشترك|Subscribed/ });
    fireEvent.click(viewerToggle);
    expect(viewerToggle.getAttribute("aria-checked")).toBe("true");
  });
});
