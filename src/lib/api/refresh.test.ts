import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
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

describe("refresh helper (contracts/session.md §Concurrency)", () => {
  beforeEach(() => {
    server.resetHandlers();
    vi.resetModules();
  });

  it("calls POST /auth/refresh with stored refresh_token", async () => {
    let callCount = 0;
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/refresh`, () => {
        callCount++;
        return HttpResponse.json({ access_token: "new-acc", refresh_token: "new-ref" });
      }),
    );

    vi.doMock("@/lib/auth/session", () => ({
      getSession: async () => ({ access_token: "old-acc", refresh_token: "old-ref" }),
      saveSession: async () => {},
      destroySession: async () => {},
    }));

    const { refreshTokens } = await import("@/lib/api/refresh");
    const result = await refreshTokens();
    expect(result).not.toBeNull();
    expect(callCount).toBe(1);
  });

  it("on 4xx returns null (no retry — FR-005)", async () => {
    let callCount = 0;
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/refresh`, () => {
        callCount++;
        return new HttpResponse(null, { status: 401 });
      }),
    );

    vi.doMock("@/lib/auth/session", () => ({
      getSession: async () => ({ access_token: "old-acc", refresh_token: "old-ref" }),
      saveSession: async () => {},
      destroySession: async () => {},
    }));

    const { refreshTokens } = await import("@/lib/api/refresh");
    const result = await refreshTokens();
    expect(result).toBeNull();
    expect(callCount).toBe(1);
  });

  it("concurrent callers dedupe — only one refresh fires", async () => {
    let callCount = 0;
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/refresh`, () => {
        callCount++;
        return new Promise((resolve) =>
          setTimeout(
            () => resolve(HttpResponse.json({ access_token: "new-acc", refresh_token: "new-ref" })),
            50,
          ),
        );
      }),
    );

    vi.doMock("@/lib/auth/session", () => ({
      getSession: async () => ({ access_token: "old-acc", refresh_token: "old-ref" }),
      saveSession: async () => {},
      destroySession: async () => {},
    }));

    const { refreshTokens } = await import("@/lib/api/refresh");
    const [r1, r2, r3] = await Promise.all([refreshTokens(), refreshTokens(), refreshTokens()]);
    expect(callCount).toBe(1);
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r3).not.toBeNull();
  });
});