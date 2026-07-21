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

const sessionStore = new Map<string, { access_token: string; refresh_token: string }>();

vi.mock("@/lib/auth/session", () => ({
  getSession: async () =>
    sessionStore.get("s") as { access_token: string; refresh_token: string } | null,
  saveSession: async (payload: { access_token: string; refresh_token: string }) => {
    sessionStore.set("s", payload);
  },
  destroySession: async () => {
    sessionStore.delete("s");
  },
}));

function fd(pairs: Array<[string, string]>): FormData {
  const f = new FormData();
  for (const [k, v] of pairs) f.append(k, v);
  return f;
}

describe("signInAction (research.md Decision 3 — API decides)", () => {
  beforeEach(() => {
    server.resetHandlers();
    sessionStore.clear();
    vi.resetModules();
  });

  it("logs in on valid credentials and redirects (redirect throws)", async () => {
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/login`, async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        if (body.email === "t@example.com" && body.password === "secret123") {
          return HttpResponse.json({
            access_token: "acc-1",
            refresh_token: "ref-1",
            token_type: "bearer",
            email: "t@example.com",
            name: "Teacher",
          });
        }
        return new HttpResponse(null, { status: 401 });
      }),
    );

    const { signInAction } = await import("@/features/auth/actions");
    await expect(
      signInAction(
        { ok: false },
        fd([
          ["locale", "ar"],
          ["email", "t@example.com"],
          ["password", "secret123"],
        ]),
      ),
    ).rejects.toThrow();

    expect(sessionStore.get("s")).toEqual({
      access_token: "acc-1",
      refresh_token: "ref-1",
    });
  });

  it("returns InvalidCredentials-shaped state on 401", async () => {
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/login`, () => new HttpResponse(null, { status: 401 })),
    );

    const { signInAction } = await import("@/features/auth/actions");
    const state = await signInAction(
      { ok: false },
      fd([
        ["locale", "ar"],
        ["email", "t@example.com"],
        ["password", "wrong"],
      ]),
    );
    expect(state.ok).toBe(false);
    expect(state.error?.type).toBe("Unauthorized");
    expect(state.error?.messageKey).toBe("error_invalid_credentials");
  });

  it("returns Validation state on empty form", async () => {
    const { signInAction } = await import("@/features/auth/actions");
    const state = await signInAction(
      { ok: false },
      fd([
        ["locale", "ar"],
        ["email", ""],
        ["password", ""],
      ]),
    );
    expect(state.ok).toBe(false);
    expect(state.error?.type).toBe("Validation");
    expect(state.error?.fields).toEqual(expect.arrayContaining(["email", "password"]));
  });
});

describe("signUpAction", () => {
  beforeEach(() => {
    server.resetHandlers();
    sessionStore.clear();
    vi.resetModules();
  });

  it("registers and auto-logs in when the API accepts the user", async () => {
    let registerCalls = 0;
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/register`, () => {
        registerCalls++;
        return HttpResponse.json(
          {
            id: 1,
            email: "new@example.com",
            name: "New",
            phone_number: "+201000000000",
            role: "STUDENT",
            is_active: true,
            created_at: "2026-01-01T00:00:00Z",
          },
          { status: 201 },
        );
      }),
      http.post(`${mockApiUrl}/api/v1/auth/login`, () => {
        return HttpResponse.json({
          access_token: "acc-2",
          refresh_token: "ref-2",
          token_type: "bearer",
          email: "new@example.com",
          name: "New",
        });
      }),
    );

    const { signUpAction } = await import("@/features/auth/actions");
    await expect(
      signUpAction(
        { ok: false },
        fd([
          ["locale", "ar"],
          ["name", "New"],
          ["email", "new@example.com"],
          ["phone_number", "+201000000000"],
          ["password", "longenough"],
          ["confirm_password", "longenough"],
        ]),
      ),
    ).rejects.toThrow();

    expect(registerCalls).toBe(1);
    expect(sessionStore.get("s")).toEqual({
      access_token: "acc-2",
      refresh_token: "ref-2",
    });
  });

  it("rejects mismatched passwords client-side before hitting the API", async () => {
    let registerCalls = 0;
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/register`, () => {
        registerCalls++;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const { signUpAction } = await import("@/features/auth/actions");
    const state = await signUpAction(
      { ok: false },
      fd([
        ["locale", "ar"],
        ["name", "New"],
        ["email", "new@example.com"],
        ["phone_number", "+201000000000"],
        ["password", "longenough"],
        ["confirm_password", "different"],
      ]),
    );
    expect(state.error?.fields).toContain("confirm_password");
    expect(registerCalls).toBe(0);
  });
});

describe("forgotPasswordAction", () => {
  beforeEach(() => {
    server.resetHandlers();
    sessionStore.clear();
    vi.resetModules();
  });

  it("returns ok state on 202 (server suppresses the email-existence leak)", async () => {
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/forgot-password`, () => new HttpResponse(null, { status: 202 })),
    );

    const { forgotPasswordAction } = await import("@/features/auth/actions");
    const state = await forgotPasswordAction(
      { ok: false },
      fd([
        ["locale", "ar"],
        ["email", "t@example.com"],
      ]),
    );
    expect(state.ok).toBe(true);
  });

  it("returns Validation state on missing email", async () => {
    const { forgotPasswordAction } = await import("@/features/auth/actions");
    const state = await forgotPasswordAction(
      { ok: false },
      fd([
        ["locale", "ar"],
        ["email", ""],
      ]),
    );
    expect(state.error?.type).toBe("Validation");
  });
});

describe("resetPasswordAction", () => {
  beforeEach(() => {
    server.resetHandlers();
    sessionStore.clear();
    vi.resetModules();
  });

  it("submits token + new_password then redirects to sign-in", async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post(`${mockApiUrl}/api/v1/auth/reset-password`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ ok: true }, { status: 200 });
      }),
    );

    const { resetPasswordAction } = await import("@/features/auth/actions");
    await expect(
      resetPasswordAction(
        { ok: false },
        fd([
          ["locale", "ar"],
          ["token", "tok-123"],
          ["new_password", "longenough"],
          ["confirm_password", "longenough"],
        ]),
      ),
    ).rejects.toThrow();
    expect(receivedBody).toEqual({ token: "tok-123", new_password: "longenough" });
  });

  it("rejects mismatched passwords", async () => {
    const { resetPasswordAction } = await import("@/features/auth/actions");
    const state = await resetPasswordAction(
      { ok: false },
      fd([
        ["locale", "ar"],
        ["token", "tok-123"],
        ["new_password", "longenough"],
        ["confirm_password", "different"],
      ]),
    );
    expect(state.error?.fields).toContain("confirm_password");
  });
});
