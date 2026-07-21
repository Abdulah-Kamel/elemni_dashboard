import { describe, it, expect } from "vitest";
import { userOutSchema, courseOutSchema, tokenResponseSchema, logoutRequestSchema } from "@/features/shell/schema";

describe("contract tests against openapi.json fixtures (Article VIII)", () => {
  const sampleUserOut = {
    id: 1,
    email: "teacher@elemni.example",
    name: "أحمد محمد",
    phone_number: "+201000000000",
    role: "TEACHER",
    is_active: true,
    created_at: "2026-07-01T10:00:00Z",
  };

  const sampleCourseOut = {
    id: 42,
    title: "الجبر - الصف الأول الثانوي",
    description: "مقدمة في الجبر",
    price: "150.00",
    is_published: true,
    use_chapters: true,
    subject_id: 1,
    subject_name: "الرياضيات",
    teacher_profile_id: 7,
    grade_id: 3,
    stream_id: 1,
    created_by_id: 1,
    created_at: "2026-06-15T08:00:00Z",
  };

  const sampleTokenResponse = {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ref",
  };

  const sampleLogoutRequest = {
    refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ref",
  };

  it("UserOut fixture matches our zod schema", () => {
    expect(() => userOutSchema.parse(sampleUserOut)).not.toThrow();
  });

  it("UserOut accepts null phone_number", () => {
    expect(() =>
      userOutSchema.parse({ ...sampleUserOut, phone_number: null }),
    ).not.toThrow();
  });

  it("CourseOut fixture matches our zod schema", () => {
    expect(() => courseOutSchema.parse(sampleCourseOut)).not.toThrow();
  });

  it("CourseOut[] fixture matches our zod array schema", () => {
    expect(() => courseOutSchema.array().parse([sampleCourseOut])).not.toThrow();
  });

  it("CourseOut[] empty array is valid (200 [] = success per Q5)", () => {
    expect(() => courseOutSchema.array().parse([])).not.toThrow();
  });

  it("TokenResponse fixture matches our zod schema", () => {
    expect(() => tokenResponseSchema.parse(sampleTokenResponse)).not.toThrow();
  });

  it("LogoutRequest fixture matches our zod schema", () => {
    expect(() => logoutRequestSchema.parse(sampleLogoutRequest)).not.toThrow();
  });
});