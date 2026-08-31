import { describe, it, expect, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/tests/setup"

const mockApiUrl = "http://localhost:8000"

vi.mock("@/env", () => ({
  env: {
    API_URL: mockApiUrl,
    SESSION_SECRET: "test-secret-at-least-32-chars-long-AAAA",
    NODE_ENV: "test",
  },
}))

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({
    access_token: "test-token",
    refresh_token: "test-ref",
  }),
  saveSession: async () => {},
  destroySession: async () => {},
}))

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}))

describe("API client (Article II / FR-005)", () => {
  beforeEach(() => {
    server.resetHandlers()
  })

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
        })
      })
    )

    const { apiFetch } = await import("@/lib/api/client")
    const result = await apiFetch(
      "/api/v1/auth/me",
      (await import("@/features/shell/schema")).userOutSchema
    )
    expect(result.name).toBe("T")
  })

  it("maps 403 to Forbidden ApiError", async () => {
    server.use(
      http.get(`${mockApiUrl}/api/v1/courses`, () => {
        return new HttpResponse(null, { status: 403 })
      })
    )

    const { apiFetch } = await import("@/lib/api/client")
    const { ApiErrorImpl } = await import("@/lib/api/errors")
    await expect(
      apiFetch(
        "/api/v1/courses",
        (await import("@/features/shell/schema")).courseOutSchema.array()
      )
    ).rejects.toBeInstanceOf(ApiErrorImpl)
  })

  it("maps 500 to Upstream ApiError", async () => {
    server.use(
      http.get(`${mockApiUrl}/api/v1/courses`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { apiFetch } = await import("@/lib/api/client")
    await expect(
      apiFetch(
        "/api/v1/courses",
        (await import("@/features/shell/schema")).courseOutSchema.array()
      )
    ).rejects.toMatchObject({ type: "Upstream" })
  })

  it("retries GETs with backoff on 429", async () => {
    let calls = 0
    server.use(
      http.get(`${mockApiUrl}/api/v1/courses`, () => {
        calls++
        if (calls < 2) return new HttpResponse(null, { status: 429 })
        return HttpResponse.json([])
      })
    )

    const { apiFetch } = await import("@/lib/api/client")
    const result = await apiFetch(
      "/api/v1/courses",
      (await import("@/features/shell/schema")).courseOutSchema.array()
    )
    expect(result).toEqual([])
    expect(calls).toBe(2)
  })

  it("NEVER retries POSTs", async () => {
    let calls = 0
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/logout`, () => {
        calls++
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { apiFetch } = await import("@/lib/api/client")
    await expect(
      apiFetch(
        "/api/v1/auth/logout",
        (await import("@/features/shell/schema")).logoutRequestSchema,
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: "abc" }),
        }
      )
    ).rejects.toMatchObject({ type: "Upstream" })
    expect(calls).toBe(1)
  })

  it("refreshes an expired access token once before retrying a mutation", async () => {
    let mutationCalls = 0
    const authorizationHeaders: string[] = []

    server.use(
      http.patch(`${mockApiUrl}/api/v1/courses/1`, ({ request }) => {
        mutationCalls++
        authorizationHeaders.push(request.headers.get("Authorization") ?? "")
        if (mutationCalls === 1) return new HttpResponse(null, { status: 401 })
        return HttpResponse.json({
          id: 1,
          title: "Course",
          description: null,
          price: "0.00",
          is_published: false,
          use_chapters: true,
          subject_id: null,
          teacher_profile_id: 1,
          grade_id: 1,
          stream_id: 1,
          created_by_id: null,
          created_at: "2026-01-01T00:00:00Z",
        })
      }),
      http.post(`${mockApiUrl}/api/v1/auth/refresh`, () => {
        return HttpResponse.json({
          access_token: "refreshed-token",
          refresh_token: "new-ref",
        })
      })
    )

    const { apiFetch } = await import("@/lib/api/client")
    const { courseOutSchema } = await import("@/features/shell/schema")
    const result = await apiFetch("/api/v1/courses/1", courseOutSchema, {
      method: "PATCH",
      body: JSON.stringify({ title: "Course" }),
    })

    expect(result.id).toBe(1)
    expect(mutationCalls).toBe(2)
    expect(authorizationHeaders).toEqual([
      "Bearer test-token",
      "Bearer refreshed-token",
    ])
  })

  it("does not refresh GET requests in Server Component rendering", async () => {
    let refreshCalls = 0
    server.use(
      http.get(`${mockApiUrl}/api/v1/courses`, () => {
        return new HttpResponse(null, { status: 401 })
      }),
      http.post(`${mockApiUrl}/api/v1/auth/refresh`, () => {
        refreshCalls++
        return HttpResponse.json({
          access_token: "refreshed-token",
          refresh_token: "new-ref",
        })
      })
    )

    const { apiFetch } = await import("@/lib/api/client")
    const { courseOutSchema } = await import("@/features/shell/schema")
    await expect(
      apiFetch("/api/v1/courses", courseOutSchema.array())
    ).rejects.toMatchObject({
      type: "Unauthorized",
    })
    expect(refreshCalls).toBe(0)
  })

  it("enforces a timeout via AbortSignal.timeout()", async () => {
    server.use(
      http.get(`${mockApiUrl}/api/v1/courses`, () => {
        return new Promise((resolve) =>
          setTimeout(() => resolve(HttpResponse.json([])), 10_000)
        )
      })
    )

    const { apiFetch } = await import("@/lib/api/client")
    await expect(
      apiFetch(
        "/api/v1/courses",
        (await import("@/features/shell/schema")).courseOutSchema.array(),
        { timeoutMs: 100 }
      )
    ).rejects.toMatchObject({ type: "Upstream", causeTag: "timeout" })
  })
})
