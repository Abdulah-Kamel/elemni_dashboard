import { afterEach, describe, expect, it, vi } from "vitest"

const actionsModule = vi.hoisted(() => ({ marker: "real-actions", listCoupons: async () => ({ ok: true }) }))
vi.mock("../actions", () => actionsModule)

async function loadClient() {
  vi.resetModules()
  const { getCouponsClient, isCouponsDemo } = await import("../client")
  const { demoCouponsClient } = await import("../demo-client")
  return { client: await getCouponsClient(), isCouponsDemo, demoCouponsClient }
}

describe("getCouponsClient", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("uses the API server actions when no demo flag is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_COUPONS_DEMO", "")
    vi.stubEnv("NEXT_PUBLIC_COURSE_TESTS_DEMO", "")
    const { client, isCouponsDemo, demoCouponsClient } = await loadClient()
    expect(isCouponsDemo).toBe(false)
    expect(client).not.toBe(demoCouponsClient)
    expect((client as unknown as { marker: string }).marker).toBe("real-actions")
  })

  it.each([
    ["NEXT_PUBLIC_COUPONS_DEMO"],
    ["NEXT_PUBLIC_COURSE_TESTS_DEMO"],
  ])("uses the local demo client in development when %s=1", async (flag) => {
    vi.stubEnv("NEXT_PUBLIC_COUPONS_DEMO", "")
    vi.stubEnv("NEXT_PUBLIC_COURSE_TESTS_DEMO", "")
    vi.stubEnv(flag, "1")
    const { client, isCouponsDemo, demoCouponsClient } = await loadClient()
    expect(isCouponsDemo).toBe(true)
    expect(client).toBe(demoCouponsClient)
  })

  it("never uses the demo client in a production build, even with the flag", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_COUPONS_DEMO", "1")
    vi.stubEnv("NEXT_PUBLIC_COURSE_TESTS_DEMO", "1")
    const { client, isCouponsDemo } = await loadClient()
    expect(isCouponsDemo).toBe(false)
    expect((client as unknown as { marker: string }).marker).toBe("real-actions")
  })

  it("only accepts the exact value 1", async () => {
    vi.stubEnv("NEXT_PUBLIC_COUPONS_DEMO", "true")
    vi.stubEnv("NEXT_PUBLIC_COURSE_TESTS_DEMO", "")
    const { isCouponsDemo } = await loadClient()
    expect(isCouponsDemo).toBe(false)
  })
})
