import { describe, it, expect } from "vitest";
import {
  loginResponseSchema,
  userLoginSchema,
  userRegisterSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from "@/features/shell/schema";

describe("auth schemas (contracts/openapi.json#/components/schemas)", () => {
  describe("UserLogin", () => {
    it("parses a valid login request", () => {
      expect(() =>
        userLoginSchema.parse({ email: "t@example.com", password: "secret123" }),
      ).not.toThrow();
    });
    it("rejects missing password", () => {
      expect(() =>
        userLoginSchema.parse({ email: "t@example.com" }),
      ).toThrow();
    });
    it("rejects invalid email", () => {
      expect(() =>
        userLoginSchema.parse({ email: "not-an-email", password: "x" }),
      ).toThrow();
    });
  });

  describe("LoginResponse", () => {
    const sample = {
      access_token: "eyJ.acc",
      refresh_token: "eyJ.ref",
      token_type: "bearer",
      email: "teacher@elemni.example",
      name: "Ahmed",
    };

    it("parses a valid response", () => {
      const r = loginResponseSchema.parse(sample);
      expect(r.access_token).toBe("eyJ.acc");
      expect(r.email).toBe("teacher@elemni.example");
    });

    it("defaults token_type to 'bearer' when missing", () => {
      const { token_type: _drop, ...rest } = sample;
      void _drop;
      const r = loginResponseSchema.parse(rest);
      expect(r.token_type).toBe("bearer");
    });

    it("rejects missing email", () => {
      const { email: _drop, ...rest } = sample;
      void _drop;
      expect(() => loginResponseSchema.parse(rest)).toThrow();
    });

    it("rejects missing name", () => {
      const { name: _drop, ...rest } = sample;
      void _drop;
      expect(() => loginResponseSchema.parse(rest)).toThrow();
    });
  });

  describe("UserRegister", () => {
    const sample = {
      email: "t@example.com",
      password: "longenough",
      name: "Ahmed",
      phone_number: "+201000000000",
    };

    it("parses a valid registration", () => {
      const r = userRegisterSchema.parse(sample);
      expect(r.role).toBeUndefined();
    });

    it("accepts an explicit role", () => {
      const r = userRegisterSchema.parse({ ...sample, role: "STUDENT" });
      expect(r.role).toBe("STUDENT");
    });

    it("rejects short password", () => {
      expect(() =>
        userRegisterSchema.parse({ ...sample, password: "short" }),
      ).toThrow();
    });
  });

  describe("ForgotPasswordRequest", () => {
    it("parses a valid request", () => {
      expect(() =>
        forgotPasswordRequestSchema.parse({ email: "t@example.com" }),
      ).not.toThrow();
    });
    it("rejects missing email", () => {
      expect(() => forgotPasswordRequestSchema.parse({})).toThrow();
    });
  });

  describe("ResetPasswordRequest", () => {
    it("parses a valid request", () => {
      expect(() =>
        resetPasswordRequestSchema.parse({
          token: "tok",
          new_password: "longenough",
        }),
      ).not.toThrow();
    });
    it("rejects short new password", () => {
      expect(() =>
        resetPasswordRequestSchema.parse({ token: "tok", new_password: "x" }),
      ).toThrow();
    });
    it("rejects missing token", () => {
      expect(() =>
        resetPasswordRequestSchema.parse({ new_password: "longenough" }),
      ).toThrow();
    });
  });
});
