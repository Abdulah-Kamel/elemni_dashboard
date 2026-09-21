import { describe, expect, it, vi } from "vitest"
import SettingsPage from "../../app/[locale]/(teacher)/settings/page"

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404")
  },
}))

vi.mock("@/lib/auth/dal", () => ({
  verifySession: vi.fn().mockResolvedValue({ id: 1 }),
}))

vi.mock("@/lib/auth/redirect", () => ({
  redirectToAuth: vi.fn(),
}))

vi.mock("@/features/settings/components/settings-dashboard", () => ({
  SettingsDashboard: () => null,
}))

describe("Settings route", () => {
  it("returns not found while the feature is unavailable", () => {
    expect(() => SettingsPage()).toThrow("NEXT_HTTP_ERROR_FALLBACK;404")
  })
})
