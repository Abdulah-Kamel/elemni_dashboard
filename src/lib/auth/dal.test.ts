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

describe("DAL (research.md Decision 2)", () => {
  beforeEach(() => {
    server.resetHandlers()
    vi.resetModules()
  })

  it("verifySession returns UserOut on valid session", async () => {
    server.use(
      http.get(`${mockApiUrl}/api/v1/auth/me`, () => {
        return HttpResponse.json({
          id: 1,
          email: "teacher@example.com",
          name: "Test Teacher",
          phone_number: null,
          role: "TEACHER",
          is_active: true,
          created_at: "2026-01-01T00:00:00Z",
        })
      })
    )

    vi.doMock("@/lib/auth/session", () => ({
      getSession: async () => ({
        access_token: "valid-acc",
        refresh_token: "valid-ref",
      }),
      saveSession: async () => {},
      destroySession: async () => {},
    }))

    const { verifySession } = await import("@/lib/auth/dal")
    const result = await verifySession()
    expect(result).not.toBeNull()
    expect(result?.name).toBe("Test Teacher")
    expect(result?.role).toBe("TEACHER")
  })

  it("verifySession returns null on missing session", async () => {
    vi.doMock("@/lib/auth/session", () => ({
      getSession: async () => null,
      saveSession: async () => {},
      destroySession: async () => {},
    }))

    const { verifySession } = await import("@/lib/auth/dal")
    const result = await verifySession()
    expect(result).toBeNull()
  })

  it("verifySession returns null on 401 after an allowed refresh fails", async () => {
    server.use(
      http.get(`${mockApiUrl}/api/v1/auth/me`, () => {
        return new HttpResponse(null, { status: 401 })
      }),
      http.post(`${mockApiUrl}/api/v1/auth/refresh`, () => {
        return new HttpResponse(null, { status: 401 })
      })
    )

    vi.doMock("@/lib/auth/session", () => ({
      getSession: async () => ({
        access_token: "expired-acc",
        refresh_token: "expired-ref",
      }),
      saveSession: async () => {},
      destroySession: async () => {},
    }))

    const { verifySession } = await import("@/lib/auth/dal")
    const result = await verifySession({ allowRefresh: true })
    expect(result).toBeNull()
  })

  it("verifySession retries /auth/me once after an allowed refresh succeeds", async () => {
    let meCallCount = 0
    server.use(
      http.get(`${mockApiUrl}/api/v1/auth/me`, () => {
        meCallCount++
        if (meCallCount === 1) return new HttpResponse(null, { status: 401 })
        return HttpResponse.json({
          id: 1,
          email: "teacher@example.com",
          name: "Refreshed Teacher",
          phone_number: null,
          role: "TEACHER",
          is_active: true,
          created_at: "2026-01-01T00:00:00Z",
        })
      }),
      http.post(`${mockApiUrl}/api/v1/auth/refresh`, () => {
        return HttpResponse.json({
          access_token: "new-acc",
          refresh_token: "new-ref",
        })
      })
    )

    vi.doMock("@/lib/auth/session", () => ({
      getSession: async () => ({
        access_token: "old-acc",
        refresh_token: "old-ref",
      }),
      saveSession: async () => {},
      destroySession: async () => {},
    }))

    const { verifySession } = await import("@/lib/auth/dal")
    const result = await verifySession({ allowRefresh: true })
    expect(meCallCount).toBe(2)
    expect(result?.name).toBe("Refreshed Teacher")
  })

  it("does not refresh while rendering a Server Component", async () => {
    let refreshCalls = 0
    server.use(
      http.get(`${mockApiUrl}/api/v1/auth/me`, () => {
        return new HttpResponse(null, { status: 401 })
      }),
      http.post(`${mockApiUrl}/api/v1/auth/refresh`, () => {
        refreshCalls++
        return HttpResponse.json({
          access_token: "new-acc",
          refresh_token: "new-ref",
        })
      })
    )

    vi.doMock("@/lib/auth/session", () => ({
      getSession: async () => ({
        access_token: "expired-acc",
        refresh_token: "valid-ref",
      }),
      saveSession: async () => {},
      destroySession: async () => {},
    }))

    const { verifySession } = await import("@/lib/auth/dal")
    const result = await verifySession()
    expect(result).toBeNull()
    expect(refreshCalls).toBe(0)
  })
})
