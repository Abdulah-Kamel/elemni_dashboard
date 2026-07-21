import { describe, it, expect } from "vitest";
import {
  formValuesToCourseCreate,
  formValuesToCourseUpdate,
} from "@/features/course-management/schema";
import type { CourseFormValues } from "@/features/course-management/schema";

describe("formValuesToCourseCreate", () => {
  const validForm: CourseFormValues = {
    title: "الجبر - الصف الأول الثانوي",
    description: "مقدمة في الجبر",
    price: "150.00",
    subjectId: 1,
    gradeId: 3,
    streamId: 1,
    useChapters: true,
  };

  it("maps camelCase to snake_case", () => {
    const result = formValuesToCourseCreate(validForm);

    expect(result.title).toBe(validForm.title);
    expect(result.description).toBe(validForm.description);
    expect(result.price).toBe(validForm.price);
    expect(result.subject_id).toBe(validForm.subjectId);
    expect(result.grade_id).toBe(validForm.gradeId);
    expect(result.stream_id).toBe(validForm.streamId);
    expect(result.use_chapters).toBe(validForm.useChapters);
  });

  it("sets is_published to false by default", () => {
    const result = formValuesToCourseCreate(validForm);
    expect(result.is_published).toBe(false);
  });

  it("includes placement fields", () => {
    const result = formValuesToCourseCreate(validForm);
    expect(result).toHaveProperty("subject_id");
    expect(result).toHaveProperty("grade_id");
    expect(result).toHaveProperty("stream_id");
  });

  it("converts null description to null", () => {
    const form = { ...validForm, description: null };
    const result = formValuesToCourseCreate(form);
    expect(result.description).toBeNull();
  });

  it("defaults price to 0.00 when empty string", () => {
    const form = { ...validForm, price: "" };
    const result = formValuesToCourseCreate(form);
    expect(result.price).toBe("0.00");
  });
});

describe("formValuesToCourseUpdate", () => {
  const validForm: CourseFormValues = {
    title: "الجبر - الصف الأول الثانوي",
    description: "مقدمة في الجبر",
    price: "150.00",
    subjectId: 1,
    gradeId: 3,
    streamId: 1,
    useChapters: true,
  };

  it("includes title, description, and price", () => {
    const result = formValuesToCourseUpdate(validForm);
    expect(result.title).toBe(validForm.title);
    expect(result.description).toBe(validForm.description);
    expect(result.price).toBe(validForm.price);
  });

  it("does not include placement fields", () => {
    const result = formValuesToCourseUpdate(validForm);
    expect(result).not.toHaveProperty("subject_id");
    expect(result).not.toHaveProperty("grade_id");
    expect(result).not.toHaveProperty("stream_id");
  });

  it("includes use_chapters", () => {
    const result = formValuesToCourseUpdate(validForm);
    expect(result.use_chapters).toBe(true);
  });

  it("does not include is_published when not set", () => {
    const result = formValuesToCourseUpdate(validForm);
    expect(result).not.toHaveProperty("is_published");
  });

  it("includes is_published when set", () => {
    const form = { ...validForm, isPublished: true };
    const result = formValuesToCourseUpdate(form);
    expect(result.is_published).toBe(true);
  });
});
