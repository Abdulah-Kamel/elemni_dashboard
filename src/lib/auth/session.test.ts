import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("server-only", () => ({}))

vi.mock("@/env", () => ({
  env: {
    API_URL: "http://localhost:8000",
    SESSION_SECRET: "test-secret-at-least-32-chars-long-AAAA",
    NODE_ENV: "test",
  },
}))

describe("session module (contracts/session.md)", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("getSession returns null when no cookie is set", async () => {
    vi.doMock("next/headers", () => ({
      cookies: () => ({
        get: () => undefined,
        set: () => {},
        delete: () => {},
      }),
    }))

    const { getSession } = await import("@/lib/auth/session")
    const result = await getSession()
    expect(result).toBeNull()
  })

  it("saveSession writes an encrypted cookie via iron-session", async () => {
    const setCookieCalls: {
      name: string
      value: string
      options: Record<string, unknown>
    }[] = []
    vi.doMock("next/headers", () => ({
      cookies: () => ({
        get: () => undefined,
        set: (
          name: string,
          value: string,
          options: Record<string, unknown>
        ) => {
          setCookieCalls.push({ name, value, options })
        },
        delete: () => {},
      }),
    }))

    const { saveSession } = await import("@/lib/auth/session")
    await saveSession({ access_token: "acc", refresh_token: "ref" })
    expect(setCookieCalls.length).toBe(1)
    expect(setCookieCalls[0].name).toBe("elemni_session")
    expect(setCookieCalls[0].options).toHaveProperty("httpOnly", true)
    expect(setCookieCalls[0].options).toHaveProperty("secure")
    expect(setCookieCalls[0].options).toHaveProperty("sameSite", "lax")
    expect(setCookieCalls[0].options).toHaveProperty("path", "/")
  })

  it("destroySession sets Max-Age=0", async () => {
    const deleteCalls: string[] = []
    vi.doMock("next/headers", () => ({
      cookies: () => ({
        get: () => undefined,
        set: () => {},
        delete: (name: string) => {
          deleteCalls.push(name)
        },
      }),
    }))

    const { destroySession } = await import("@/lib/auth/session")
    await destroySession()
    expect(deleteCalls).toContain("elemni_session")
  })

  it("fails closed on corrupt/tampered cookie → returns null", async () => {
    vi.doMock("next/headers", () => ({
      cookies: () => ({
        get: () => ({
          name: "elemni_session",
          value: "tampered-garbage-not-valid",
        }),
        set: () => {},
        delete: () => {},
      }),
    }))

    const { getSession } = await import("@/lib/auth/session")
    const result = await getSession()
    expect(result).toBeNull()
  })
})
