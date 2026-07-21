import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/setup";

const mockApiUrl = "http://localhost:8000";

vi.mock("@/env", () => ({
  env: {
    API_URL: mockApiUrl,
    SESSION_SECRET: "test-secret-at-least-32-chars-long-AAAA",
    NODE_ENV: "test",
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({ access_token: "test-token", refresh_token: "test-ref" }),
  saveSession: async () => {},
  destroySession: async () => {},
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}));

describe("API client (Article II / FR-005)", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it("zod-parses every response before return", async () => {
    server.use(
      http.get(`${mockApiUrl}/api/v1/auth/me`, () => {
        return HttpResponse.json({
          id: 1,
          email: "t@t.com",
          name: "T",
          phone_number: null,
          role: "TEACHER",
          is_active: true,
          created_at: "2026-01-01T00:00:00Z",
        });
      }),
    );

    const { apiFetch } = await import("@/lib/api/client");
    const result = await apiFetch("/api/v1/auth/me", (await import("@/features/shell/schema")).userOutSchema);
    expect(result.name).toBe("T");
  });

  it("maps 403 to Forbidden ApiError", async () => {
    server.use(
      http.get(`${mockApiUrl}/api/v1/courses`, () => {
        return new HttpResponse(null, { status: 403 });
      }),
    );

    const { apiFetch } = await import("@/lib/api/client");
    const { ApiErrorImpl } = await import("@/lib/api/errors");
    await expect(
      apiFetch("/api/v1/courses", (await import("@/features/shell/schema")).courseOutSchema.array()),
    ).rejects.toBeInstanceOf(ApiErrorImpl);
  });

  it("maps 500 to Upstream ApiError", async () => {
    server.use(
      http.get(`${mockApiUrl}/api/v1/courses`, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { apiFetch } = await import("@/lib/api/client");
    await expect(
      apiFetch("/api/v1/courses", (await import("@/features/shell/schema")).courseOutSchema.array()),
    ).rejects.toMatchObject({ type: "Upstream" });
  });

  it("retries GETs with backoff on 429", async () => {
    let calls = 0;
    server.use(
      http.get(`${mockApiUrl}/api/v1/courses`, () => {
        calls++;
        if (calls < 2) return new HttpResponse(null, { status: 429 });
        return HttpResponse.json([]);
      }),
    );

    const { apiFetch } = await import("@/lib/api/client");
    const result = await apiFetch(
      "/api/v1/courses",
      (await import("@/features/shell/schema")).courseOutSchema.array(),
    );
    expect(result).toEqual([]);
    expect(calls).toBe(2);
  });

  it("NEVER retries POSTs", async () => {
    let calls = 0;
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/logout`, () => {
        calls++;
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { apiFetch } = await import("@/lib/api/client");
    await expect(
      apiFetch("/api/v1/auth/logout", (await import("@/features/shell/schema")).logoutRequestSchema, {
        method: "POST",
        body: JSON.stringify({ refresh_token: "abc" }),
      }),
    ).rejects.toMatchObject({ type: "Upstream" });
    expect(calls).toBe(1);
  });

  it("enforces a timeout via AbortSignal.timeout()", async () => {
    server.use(
      http.get(`${mockApiUrl}/api/v1/courses`, () => {
        return new Promise((resolve) => setTimeout(() => resolve(HttpResponse.json([])), 10_000));
      }),
    );

    const { apiFetch } = await import("@/lib/api/client");
    await expect(
      apiFetch(
        "/api/v1/courses",
        (await import("@/features/shell/schema")).courseOutSchema.array(),
        { timeoutMs: 100 },
      ),
    ).rejects.toMatchObject({ type: "Upstream", causeTag: "timeout" });
  });
});