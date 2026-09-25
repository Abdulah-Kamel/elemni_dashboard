import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const source = readFileSync(join(__dirname, "sidebar.tsx"), "utf8")

describe("Sidebar collapse layout", () => {
  it("uses the expanded width token declared by the dashboard theme", () => {
    expect(source).toContain('collapsed ? "w-17" : "w-sidebar-width"')
    expect(source).not.toContain('"w-sidebar"')
  })

  it("preserves the full teacher name and lets CSS truncate it", () => {
    expect(source).toContain("{teacherName}")
    expect(source).not.toContain("teacherName.slice")
  })

  it("keeps collapse behavior on an accessible button", () => {
    expect(source).toContain(
      'aria-label={collapsed ? tCommon("expand") : tCommon("collapse")}'
    )
    expect(source).not.toMatch(/<div\s+aria-hidden="true"[^>]*onClick[^>]*>/)
  })
})

describe("Sidebar grading badge", () => {
  it("reads the real pending count through the course-tests client, never demo data", () => {
    expect(source).not.toContain("demo-store")
    expect(source).toContain("getCourseTestsClient")
    expect(source).toContain("client.getPendingGradingCount()")
  })

  it("only renders the badge for a known, positive count", () => {
    expect(source).toContain('id === "grading" && pendingCount > 0')
    expect(source).toContain("usePendingGradingCount(pendingGradingCount")
  })
})
