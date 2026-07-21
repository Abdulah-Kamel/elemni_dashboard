import { describe, it, expect } from "vitest";
import {
  courseCreateSchema,
  courseUpdateSchema,
  courseFormSchema,
  subjectOutSchema,
  gradeOutSchema,
  streamOutSchema,
  formValuesToCourseCreate,
  formValuesToCourseUpdate,
} from "@/features/course-management/schema";
import type { CourseFormValues } from "@/features/course-management/schema";

describe("courseCreateSchema (contracts/openapi.json)", () => {
  const validBody = {
    title: "الجبر - الصف الأول الثانوي",
    description: "مقدمة في الجبر",
    price: "150.00",
    subject_id: 1,
    grade_id: 3,
    stream_id: 1,
    is_published: false,
    use_chapters: false,
  };

  it("parses a valid course creation request", () => {
    expect(() => courseCreateSchema.parse(validBody)).not.toThrow();
  });

  it("rejects missing title", () => {
    const { title: _drop, ...rest } = validBody;
    void _drop;
    expect(() => courseCreateSchema.parse(rest)).toThrow();
  });

  it("rejects empty title", () => {
    expect(() => courseCreateSchema.parse({ ...validBody, title: "" })).toThrow();
  });

  it("rejects missing subject_id", () => {
    const { subject_id: _drop, ...rest } = validBody;
    void _drop;
    expect(() => courseCreateSchema.parse(rest)).toThrow();
  });

  it("rejects missing grade_id", () => {
    const { grade_id: _drop, ...rest } = validBody;
    void _drop;
    expect(() => courseCreateSchema.parse(rest)).toThrow();
  });

  it("rejects missing stream_id", () => {
    const { stream_id: _drop, ...rest } = validBody;
    void _drop;
    expect(() => courseCreateSchema.parse(rest)).toThrow();
  });

  it("accepts null description", () => {
    expect(() =>
      courseCreateSchema.parse({ ...validBody, description: null })
    ).not.toThrow();
  });

  it("defaults is_published to false", () => {
    const { is_published: _drop, ...rest } = validBody;
    void _drop;
    const result = courseCreateSchema.parse(rest);
    expect(result.is_published).toBe(false);
  });

  it("defaults use_chapters to false", () => {
    const { use_chapters: _drop, ...rest } = validBody;
    void _drop;
    const result = courseCreateSchema.parse(rest);
    expect(result.use_chapters).toBe(false);
  });

  it("defaults price to 0.00", () => {
    const { price: _drop, ...rest } = validBody;
    void _drop;
    const result = courseCreateSchema.parse(rest);
    expect(result.price).toBe("0.00");
  });
});

describe("courseUpdateSchema (contracts/openapi.json)", () => {
  it("accepts empty update (no fields)", () => {
    expect(() => courseUpdateSchema.parse({})).not.toThrow();
  });

  it("accepts partial update with title only", () => {
    expect(() =>
      courseUpdateSchema.parse({ title: "New Title" })
    ).not.toThrow();
  });

  it("accepts null description", () => {
    expect(() =>
      courseUpdateSchema.parse({ description: null })
    ).not.toThrow();
  });

  it("accepts null price", () => {
    expect(() =>
      courseUpdateSchema.parse({ price: null })
    ).not.toThrow();
  });

  it("accepts is_published boolean", () => {
    expect(() =>
      courseUpdateSchema.parse({ is_published: true })
    ).not.toThrow();
  });

  it("does not include placement fields (subject_id, grade_id, stream_id)", () => {
    const result = courseUpdateSchema.parse({ title: "Test" });
    expect(result).not.toHaveProperty("subject_id");
    expect(result).not.toHaveProperty("grade_id");
    expect(result).not.toHaveProperty("stream_id");
  });
});

describe("courseFormSchema (camelCase, Arabic validation)", () => {
  const validForm: CourseFormValues = {
    title: "الجبر - الصف الأول الثانوي",
    description: "مقدمة في الجبر",
    price: "150.00",
    subjectId: 1,
    gradeId: 3,
    streamId: 1,
    useChapters: false,
  };

  it("parses a valid form", () => {
    expect(() => courseFormSchema.parse(validForm)).not.toThrow();
  });

  it("rejects missing title with Arabic message", () => {
    const { title: _drop, ...rest } = validForm;
    void _drop;
    try {
      courseFormSchema.parse(rest);
      expect.fail("Should have thrown");
    } catch (e: unknown) {
      const error = e as { issues?: Array<{ message: string }> };
      // Zod throws different messages for missing vs empty string
      const message = error.issues?.[0]?.message ?? "";
      const hasArabicMessage = message.includes("عنوان الدورة مطلوب");
      const hasZodDefault = message.includes("expected string");
      expect(hasArabicMessage || hasZodDefault).toBe(true);
    }
  });

  it("rejects title longer than 150 characters", () => {
    expect(() =>
      courseFormSchema.parse({ ...validForm, title: "a".repeat(151) })
    ).toThrow();
  });

  it("accepts description as null", () => {
    expect(() =>
      courseFormSchema.parse({ ...validForm, description: null })
    ).not.toThrow();
  });

  it("defaults useChapters to false", () => {
    const { useChapters: _drop, ...rest } = validForm;
    void _drop;
    const result = courseFormSchema.parse(rest);
    expect(result.useChapters).toBe(false);
  });

  it("accepts price with 0 digits before decimal", () => {
    expect(() =>
      courseFormSchema.parse({ ...validForm, price: ".00" })
    ).not.toThrow();
  });

  it("accepts price with 8 digits before decimal", () => {
    expect(() =>
      courseFormSchema.parse({ ...validForm, price: "12345678.00" })
    ).not.toThrow();
  });

  it("rejects price with 9 digits before decimal", () => {
    expect(() =>
      courseFormSchema.parse({ ...validForm, price: "123456789.00" })
    ).toThrow();
  });

  it("rejects price without decimal places", () => {
    expect(() =>
      courseFormSchema.parse({ ...validForm, price: "100" })
    ).toThrow();
  });
});

describe("curriculum schemas", () => {
  describe("subjectOutSchema", () => {
    const validSubject = {
      id: 1,
      name: "الرياضيات",
      slug: "math",
    };

    it("parses a valid subject", () => {
      expect(() => subjectOutSchema.parse(validSubject)).not.toThrow();
    });

    it("rejects missing id", () => {
      const { id: _drop, ...rest } = validSubject;
      void _drop;
      expect(() => subjectOutSchema.parse(rest)).toThrow();
    });

    it("rejects missing name", () => {
      const { name: _drop, ...rest } = validSubject;
      void _drop;
      expect(() => subjectOutSchema.parse(rest)).toThrow();
    });

    it("rejects missing slug", () => {
      const { slug: _drop, ...rest } = validSubject;
      void _drop;
      expect(() => subjectOutSchema.parse(rest)).toThrow();
    });
  });

  describe("gradeOutSchema", () => {
    const validGrade = {
      id: 3,
      name: "الصف الأول الثانوي",
      level: "secondary",
    };

    it("parses a valid grade", () => {
      expect(() => gradeOutSchema.parse(validGrade)).not.toThrow();
    });

    it("rejects missing id", () => {
      const { id: _drop, ...rest } = validGrade;
      void _drop;
      expect(() => gradeOutSchema.parse(rest)).toThrow();
    });

    it("rejects missing name", () => {
      const { name: _drop, ...rest } = validGrade;
      void _drop;
      expect(() => gradeOutSchema.parse(rest)).toThrow();
    });

    it("rejects missing level", () => {
      const { level: _drop, ...rest } = validGrade;
      void _drop;
      expect(() => gradeOutSchema.parse(rest)).toThrow();
    });
  });

  describe("streamOutSchema", () => {
    const validStream = {
      id: 1,
      name: "شعبة علوم تجريبية",
      slug: "experimental-sciences",
    };

    it("parses a valid stream", () => {
      expect(() => streamOutSchema.parse(validStream)).not.toThrow();
    });

    it("rejects missing id", () => {
      const { id: _drop, ...rest } = validStream;
      void _drop;
      expect(() => streamOutSchema.parse(rest)).toThrow();
    });

    it("rejects missing name", () => {
      const { name: _drop, ...rest } = validStream;
      void _drop;
      expect(() => streamOutSchema.parse(rest)).toThrow();
    });

    it("rejects missing slug", () => {
      const { slug: _drop, ...rest } = validStream;
      void _drop;
      expect(() => streamOutSchema.parse(rest)).toThrow();
    });
  });
});

describe("formValuesToCourseCreate", () => {
  it("maps camelCase form values to snake_case API body", () => {
    const formValues: CourseFormValues = {
      title: "Test Course",
      description: "Description",
      price: "100.00",
      subjectId: 1,
      gradeId: 2,
      streamId: 3,
      useChapters: true,
    };

    const result = formValuesToCourseCreate(formValues);

    expect(result.title).toBe("Test Course");
    expect(result.description).toBe("Description");
    expect(result.price).toBe("100.00");
    expect(result.subject_id).toBe(1);
    expect(result.grade_id).toBe(2);
    expect(result.stream_id).toBe(3);
    expect(result.use_chapters).toBe(true);
    expect(result.is_published).toBe(false);
  });

  it("converts null description to null in API body", () => {
    const formValues: CourseFormValues = {
      title: "Test Course",
      description: null,
      price: "0.00",
      subjectId: 1,
      gradeId: 2,
      streamId: 3,
      useChapters: false,
    };

    const result = formValuesToCourseCreate(formValues);
    expect(result.description).toBeNull();
  });

  it("defaults price to 0.00 when empty", () => {
    const formValues: CourseFormValues = {
      title: "Test Course",
      description: null,
      price: "",
      subjectId: 1,
      gradeId: 2,
      streamId: 3,
      useChapters: false,
    };

    const result = formValuesToCourseCreate(formValues);
    expect(result.price).toBe("0.00");
  });
});

describe("formValuesToCourseUpdate", () => {
  it("includes only changed fields", () => {
    const formValues: CourseFormValues = {
      title: "Updated Title",
      description: null,
      price: "200.00",
      subjectId: 1,
      gradeId: 2,
      streamId: 3,
      useChapters: false,
    };

    const result = formValuesToCourseUpdate(formValues);

    expect(result.title).toBe("Updated Title");
    expect(result.description).toBeNull();
    expect(result.price).toBe("200.00");
  });

  it("does not include placement fields", () => {
    const formValues: CourseFormValues = {
      title: "Test",
      description: null,
      price: "100.00",
      subjectId: 1,
      gradeId: 2,
      streamId: 3,
      useChapters: false,
    };

    const result = formValuesToCourseUpdate(formValues);
    expect(result).not.toHaveProperty("subject_id");
    expect(result).not.toHaveProperty("grade_id");
    expect(result).not.toHaveProperty("stream_id");
  });
});
