import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileWorkspace } from "../profile-workspace";
import type { TeacherProfile } from "@/features/profile/schema";
import type { CourseOut } from "@/features/shell/schema";

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/features/profile/actions", () => ({
  requestProfileImageUpload: vi.fn(),
  updateTeacherProfile: vi.fn(),
}));

vi.mock("@/lib/upload", () => ({
  uploadToPresignedUrl: vi.fn(),
}));

const mockProfile: TeacherProfile = {
  id: 1,
  name: "أحمد علي",
  email: "ahmed@example.com",
  slug: "ahmed-ali",
  phone_number: null,
  description: "مدرس فيزياء",
  location: "القاهرة",
  experience: 5,
  img: null,
  subjects: [{ id: 1, name: "فيزياء", slug: "physics", grades: [], streams: [] }],
  grades: [{ id: 1, name: "الصف الثالث", level: "secondary" }],
  streams: [],
};

const mockCourses: CourseOut[] = [];

describe("ProfileWorkspace", () => {
  it("renders editor and preview", () => {
    render(
      <ProfileWorkspace profile={mockProfile} courses={mockCourses} locale="ar" publicImageUrl={null} />
    );
    expect(screen.getByText("أحمد علي")).toBeDefined();
  });

  it("updates preview when name changes", () => {
    render(
      <ProfileWorkspace profile={mockProfile} courses={mockCourses} locale="ar" publicImageUrl={null} />
    );
    const nameInput = screen.getByDisplayValue("أحمد علي");
    fireEvent.change(nameInput, { target: { value: "محمد علي" } });
    expect(screen.getByText("محمد علي")).toBeDefined();
  });

  it("shows save button", () => {
    render(
      <ProfileWorkspace profile={mockProfile} courses={mockCourses} locale="ar" publicImageUrl={null} />
    );
    expect(screen.getByRole("button", { name: /حفظ|Save/ })).toBeDefined();
  });
});
