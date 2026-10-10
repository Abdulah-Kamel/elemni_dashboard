import { describe, it, expect } from "vitest";
import { ApiError, ApiErrorImpl, toApiError, serializeActionError } from "@/lib/api/errors";

describe("serializeActionError", () => {
  it("returns API messages and metadata as plain data", () => {
    const error = new ApiErrorImpl({
      type: "Validation", status: 422, message: "Title is required",
      requestId: "req_1", fields: ["title"],
    });
    const result = serializeActionError(error);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result).not.toBeInstanceOf(Error);
    expect(result).toEqual({
      type: "Validation", status: 422, message: "Title is required",
      requestId: "req_1", fields: ["title"],
    });
    expect(result.fields).not.toBe(error.fields);
  });

  it("preserves retry and upstream metadata without returning an Error cause", () => {
    expect(serializeActionError(new ApiErrorImpl({
      type: "RateLimited", status: 429, message: "Try later", retryAfter: 30,
    }))).toEqual({ type: "RateLimited", status: 429, message: "Try later", retryAfter: 30 });
    const error = new ApiErrorImpl({
      type: "Upstream", status: 500, message: "Failed to create video library", cause: "5xx",
    });
    error.cause = new Error("private cause");
    expect(serializeActionError(error)).toEqual({
      type: "Upstream", status: 500, message: "Failed to create video library", causeTag: "5xx",
    });
  });

  it.each([undefined, null, "failure", 42, new Error("private error")])(
    "uses the existing fallback for unknown thrown values (%s)", (error) => {
      expect(serializeActionError(error)).toEqual({ type: "Upstream", message: "Network error" });
    },
  );

  it("supports action-specific fallback messages", () => {
    expect(serializeActionError(null, "Profile request failed")).toEqual({
      type: "Upstream", message: "Profile request failed",
    });
  });
});

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