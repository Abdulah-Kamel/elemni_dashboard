import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("i18n glossary compliance", () => {
  const arPath = join(process.cwd(), "src/i18n/messages/ar.json");
  const arContent = readFileSync(arPath, "utf-8");

  const bannedTerms = [
    { term: "كورس", reason: "Should use 'دورة' instead" },
    { term: "وحدة", reason: "Should use 'فصل' instead" },
    { term: "المسار", reason: "Should use 'الشعبة' instead" },
  ];

  it("does not contain banned Arabic terms", () => {
    for (const { term, reason } of bannedTerms) {
      expect(arContent).not.toContain(term);
      // Verify the reason for documentation
      expect(reason).toBeTruthy();
    }
  });
});
