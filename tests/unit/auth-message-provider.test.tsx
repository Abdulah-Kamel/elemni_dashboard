import { describe, expect, it } from "vitest"
import { AUTH_CLIENT_NAMESPACES, pickMessages } from "@/i18n/pick-messages"

describe("auth client message provider configuration", () => {
  it("includes all namespaces used by the auth client components", () => {
    const selected = pickMessages(
      {
        auth: { error: "Auth error" },
        sign_in: { title: "Sign in" },
        sign_up: { title: "Sign up" },
        forgot_password: { title: "Forgot" },
        reset_password: { title: "Reset" },
        admin: { title: "Admin" },
      },
      AUTH_CLIENT_NAMESPACES
    )
    expect(Object.keys(selected)).toEqual(AUTH_CLIENT_NAMESPACES)
    expect(selected).not.toHaveProperty("admin")
  })
})
