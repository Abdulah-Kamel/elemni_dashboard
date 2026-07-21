import { describe, it, expect } from "vitest";
import {
  userRoleSchema,
  userOutSchema,
  courseOutSchema,
  sessionSchema,
  tokenResponseSchema,
  logoutRequestSchema,
  refreshRequestSchema,
} from "@/features/shell/schema";

describe("zod schemas (data-model.md §1 + contracts/openapi.json)", () => {
  describe("UserRole enum", () => {
    it("accepts ADMIN", () => {
      expect(userRoleSchema.parse("ADMIN")).toBe("ADMIN");
    });
    it("accepts TEACHER", () => {
      expect(userRoleSchema.parse("TEACHER")).toBe("TEACHER");
    });
    it("accepts ASSISTANT", () => {
      expect(userRoleSchema.parse("ASSISTANT")).toBe("ASSISTANT");
    });
    it("accepts STUDENT", () => {
      expect(userRoleSchema.parse("STUDENT")).toBe("STUDENT");
    });
    it("rejects unknown role", () => {
      expect(() => userRoleSchema.parse("SUPERADMIN")).toThrow();
    });
  });

  describe("UserOut", () => {
    const validUser = {
      id: 1,
      email: "teacher@example.com",
      name: "Test Teacher",
      phone_number: null,
      role: "TEACHER",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
    };

    it("parses a valid UserOut", () => {
      const result = userOutSchema.parse(validUser);
      expect(result.id).toBe(1);
      expect(result.role).toBe("TEACHER");
    });

    it("accepts phone_number as string", () => {
      expect(userOutSchema.parse({ ...validUser, phone_number: "+201000000000" }).phone_number).toBe("+201000000000");
    });

    it("accepts phone_number as null", () => {
      expect(userOutSchema.parse({ ...validUser, phone_number: null }).phone_number).toBeNull();
    });

    it("rejects missing role", () => {
      const { role: _, ...noRole } = validUser;
      expect(() => userOutSchema.parse(noRole)).toThrow();
    });

    it("rejects invalid email", () => {
      expect(() => userOutSchema.parse({ ...validUser, email: "not-an-email" })).toThrow();
    });

    it("rejects non-integer id", () => {
      expect(() => userOutSchema.parse({ ...validUser, id: 1.5 })).toThrow();
    });
  });

  describe("CourseOut", () => {
    const validCourse = {
      id: 1,
      title: "Introduction to Algebra",
      description: null,
      price: "0.00",
      is_published: false,
      use_chapters: true,
      subject_id: null,
      subject_name: null,
      teacher_profile_id: 1,
      grade_id: 1,
      stream_id: 1,
      created_by_id: null,
      created_at: "2026-01-01T00:00:00Z",
    };

    it("parses a valid CourseOut", () => {
      const result = courseOutSchema.parse(validCourse);
      expect(result.id).toBe(1);
      expect(result.title).toBe("Introduction to Algebra");
    });

    it("accepts subject_name as optional/missing", () => {
      const { subject_name: _, ...noSubjectName } = validCourse;
      expect(courseOutSchema.parse(noSubjectName)).toBeDefined();
    });

    it("rejects missing title", () => {
      const { title: _, ...noTitle } = validCourse;
      expect(() => courseOutSchema.parse(noTitle)).toThrow();
    });
  });

  describe("SessionPayload", () => {
    it("parses with access_token present", () => {
      expect(sessionSchema.parse({ access_token: "abc", refresh_token: "def" }).access_token).toBe("abc");
    });

    it("parses with access_token absent (fallback shape)", () => {
      expect(sessionSchema.parse({ refresh_token: "def" }).access_token).toBeUndefined();
    });

    it("rejects missing refresh_token", () => {
      expect(() => sessionSchema.parse({ access_token: "abc" })).toThrow();
    });
  });

  describe("TokenResponse", () => {
    it("parses valid response", () => {
      const result = tokenResponseSchema.parse({ access_token: "new-acc", refresh_token: "new-ref" });
      expect(result.access_token).toBe("new-acc");
      expect(result.refresh_token).toBe("new-ref");
    });

    it("rejects missing refresh_token", () => {
      expect(() => tokenResponseSchema.parse({ access_token: "abc" })).toThrow();
    });
  });

  describe("LogoutRequest", () => {
    it("parses valid request", () => {
      expect(logoutRequestSchema.parse({ refresh_token: "abc" }).refresh_token).toBe("abc");
    });

    it("rejects missing refresh_token", () => {
      expect(() => logoutRequestSchema.parse({})).toThrow();
    });
  });

  describe("RefreshRequest", () => {
    it("parses valid request", () => {
      expect(refreshRequestSchema.parse({ refresh_token: "abc" }).refresh_token).toBe("abc");
    });

    it("rejects missing refresh_token", () => {
      expect(() => refreshRequestSchema.parse({})).toThrow();
    });
  });
});