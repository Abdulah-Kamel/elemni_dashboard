import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const globalsCssPath = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "app",
  "globals.css"
)

function readRootTokens() {
  const css = readFileSync(globalsCssPath, "utf8")
  const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ""
  const tokens = new Map<string, string>()

  for (const line of root.split("\n")) {
    const match = line.trim().match(/^--([\w-]+):\s*([^;]+);/)
    if (match) tokens.set(match[1], match[2].trim())
  }

  return tokens
}

describe("dashboard brand tokens", () => {
  it("uses the student portal palette for shared identity", () => {
    const tokens = readRootTokens()

    expect(tokens.get("brand-indigo")).toBe("#0284C7")
    expect(tokens.get("brand-indigo-deep")).toBe("#0369A1")
    expect(tokens.get("brand-indigo-tint")).toBe("#E0F2FE")
    expect(tokens.get("brand-amber")).toBe("#F97316")
    expect(tokens.get("brand-emerald")).toBe("#22C55E")
    expect(tokens.get("page")).toBe("#FCFCFE")
    expect(tokens.get("surface-muted")).toBe("#F0F9FF")
    expect(tokens.get("surface-subtle")).toBe("#E0F2FE")
    expect(tokens.get("on-surface")).toBe("#1B1B24")
    expect(tokens.get("on-surface-muted")).toBe("#777587")
    expect(tokens.get("border")).toBe("#E2E0EF")
  })
})
