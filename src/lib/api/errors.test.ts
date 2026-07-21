import { describe, it, expect } from "vitest";
import { ApiError, toApiError } from "@/lib/api/errors";

describe("error taxonomy (Article II / FR-007)", () => {
  describe("all 7 variants exist with type discriminant", () => {
    it("Unauthorized has type 'Unauthorized'", () => {
      const err: ApiError = { type: "Unauthorized", status: 401, message: "Unauthorized" };
      expect(err.type).toBe("Unauthorized");
    });

    it("Forbidden has type 'Forbidden'", () => {
      const err: ApiError = { type: "Forbidden", status: 403, message: "Forbidden" };
      expect(err.type).toBe("Forbidden");
    });

    it("NotFound has type 'NotFound'", () => {
      const err: ApiError = { type: "NotFound", status: 404, message: "Not found" };
      expect(err.type).toBe("NotFound");
    });

    it("Validation has type 'Validation'", () => {
      const err: ApiError = { type: "Validation", status: 422, message: "Validation error" };
      expect(err.type).toBe("Validation");
    });

    it("RateLimited has type 'RateLimited'", () => {
      const err: ApiError = { type: "RateLimited", status: 429, message: "Rate limited", retryAfter: 30 };
      expect(err.type).toBe("RateLimited");
    });

    it("Conflict has type 'Conflict'", () => {
      const err: ApiError = { type: "Conflict", status: 409, message: "Conflict" };
      expect(err.type).toBe("Conflict");
    });

    it("Upstream has type 'Upstream'", () => {
      const err: ApiError = { type: "Upstream", status: 500, message: "Upstream error", cause: "5xx" };
      expect(err.type).toBe("Upstream");
    });
  });

  describe("status → type mapping via toApiError", () => {
    it("401 → Unauthorized", async () => {
      const res = new Response(null, { status: 401 });
      const err = await toApiError(res);
      expect(err.type).toBe("Unauthorized");
      expect(err.status).toBe(401);
    });

    it("403 → Forbidden", async () => {
      const res = new Response(null, { status: 403 });
      const err = await toApiError(res);
      expect(err.type).toBe("Forbidden");
    });

    it("404 → NotFound", async () => {
      const res = new Response(null, { status: 404 });
      const err = await toApiError(res);
      expect(err.type).toBe("NotFound");
    });

    it("422 → Validation", async () => {
      const res = new Response(JSON.stringify({ detail: [{ msg: "field required" }] }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
      const err = await toApiError(res);
      expect(err.type).toBe("Validation");
    });

    it("429 → RateLimited", async () => {
      const res = new Response(null, { status: 429, headers: { "Retry-After": "30" } });
      const err = await toApiError(res);
      expect(err.type).toBe("RateLimited");
      if (err.type === "RateLimited") {
        expect(err.retryAfter).toBe(30);
      }
    });

    it("409 → Conflict", async () => {
      const res = new Response(null, { status: 409 });
      const err = await toApiError(res);
      expect(err.type).toBe("Conflict");
    });

    it("500 → Upstream", async () => {
      const res = new Response(null, { status: 500 });
      const err = await toApiError(res);
      expect(err.type).toBe("Upstream");
    });

    it("503 → Upstream", async () => {
      const res = new Response(null, { status: 503 });
      const err = await toApiError(res);
      expect(err.type).toBe("Upstream");
    });
  });

  describe("message and status fields are present but for logs only", () => {
    it("every variant carries status and message", () => {
      const errors: ApiError[] = [
        { type: "Unauthorized", status: 401, message: "log-only" },
        { type: "Forbidden", status: 403, message: "log-only" },
        { type: "NotFound", status: 404, message: "log-only" },
        { type: "Validation", status: 422, message: "log-only" },
        { type: "RateLimited", status: 429, message: "log-only" },
        { type: "Conflict", status: 409, message: "log-only" },
        { type: "Upstream", status: 500, message: "log-only" },
      ];
      errors.forEach((err) => {
        expect(typeof err.status).toBe("number");
        expect(typeof err.message).toBe("string");
      });
    });
  });
});