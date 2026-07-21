import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const messagesDir = join(__dirname, "..", "..", "src", "i18n", "messages");

function loadMessages(locale: string): Record<string, unknown> {
  const raw = readFileSync(join(messagesDir, `${locale}.json`), "utf-8");
  return JSON.parse(raw);
}

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("i18n key parity (Article IV — no missing localized keys)", () => {
  it("every key in ar.json exists in en.json", () => {
    const arKeys = flattenKeys(loadMessages("ar")).sort();
    const enKeys = flattenKeys(loadMessages("en")).sort();
    const missing = arKeys.filter((k) => !enKeys.includes(k));
    expect(missing, `Missing in en.json: ${missing.join(", ")}`).toEqual([]);
  });

  it("every key in en.json exists in ar.json", () => {
    const arKeys = flattenKeys(loadMessages("ar")).sort();
    const enKeys = flattenKeys(loadMessages("en")).sort();
    const missing = enKeys.filter((k) => !arKeys.includes(k));
    expect(missing, `Missing in ar.json: ${missing.join(", ")}`).toEqual([]);
  });
});