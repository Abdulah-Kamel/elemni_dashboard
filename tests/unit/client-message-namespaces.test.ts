import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

// Client components only get the namespaces their route group's
// ClientMessageProvider passes down. A namespace missing from a group's list
// shows raw keys at runtime (tests that wrap components with all messages
// won't notice), so this scans each feature folder's client components.
const root = join(__dirname, "..", "..")

function groupNamespaces(layout: string): string[] {
  const source = readFileSync(join(root, layout), "utf-8")
  const match = source.match(/namespaces=\{\[([^\]]+)\]\}/)
  if (!match) throw new Error(`${layout}: no inline namespaces list`)
  return [...match[1].matchAll(/"([\w]+)"/g)].map((m) => m[1])
}

function clientNamespaces(dir: string): Map<string, string> {
  const found = new Map<string, string>()
  const walk = (path: string) => {
    for (const entry of readdirSync(path)) {
      const full = join(path, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
        const source = readFileSync(full, "utf-8")
        if (!/^["']use client["']/m.test(source)) continue
        for (const m of source.matchAll(/useTranslations\(\s*["'](\w+)/g)) found.set(m[1], full.replace(root, ""))
      }
    }
  }
  walk(join(root, dir))
  return found
}

const teacher = groupNamespaces("app/[locale]/(teacher)/layout.tsx")
const admin = groupNamespaces("app/[locale]/(admin)/layout.tsx")

const featureGroups: Record<string, string[][]> = {
  "src/features/admin": [admin],
  "src/features/coupons": [admin],
  "src/features/shell": [teacher, admin],
  "src/features/course-management": [teacher],
  "src/features/students": [teacher],
  "src/features/earnings": [teacher],
  "src/features/billing": [teacher],
  "src/features/profile": [teacher],
  "src/features/settings": [teacher],
  "src/features/storage": [teacher],
  "src/features/analytics": [teacher],
  "src/features/dashboard": [teacher],
  "src/features/student-preview": [teacher],
}

describe("route-group client message providers", () => {
  for (const [dir, groups] of Object.entries(featureGroups)) {
    it(`${dir} only uses namespaces its route group provides`, () => {
      for (const [namespace, file] of clientNamespaces(dir)) {
        for (const group of groups) {
          expect(group, `${file} uses "${namespace}"`).toContain(namespace)
        }
      }
    })
  }
})
