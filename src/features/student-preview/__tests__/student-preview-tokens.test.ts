import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const tokensCssPath = join(
  __dirname,
  "..",
  "..",
  "..",
  "styles",
  "student-preview-tokens.css"
);

function parseTokens(css: string): Map<string, string> {
  const map = new Map<string, string>();
  const insideBlock = css.match(/\.student-preview\s*\{([^}]+)\}/);
  if (!insideBlock) return map;
  const decls = insideBlock[1];
  for (const line of decls.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^--([\w-]+)\s*:\s*([^;]+);/);
    if (match) {
      map.set(match[1], match[2].trim());
    }
  }
  return map;
}

describe("student-preview token scoping", () => {
  let css: string;

  try {
    css = readFileSync(tokensCssPath, "utf-8");
  } catch {
    css = "";
  }

  it("student-preview-tokens.css exists", () => {
    expect(css.length).toBeGreaterThan(0);
  });

  it("scopes all tokens under .student-preview root — no unscoped declarations", () => {
    const lines = css.split("\n");
    let braceDepth = 0;
    let insideScope = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith(".student-preview")) {
        insideScope = true;
      }
      if (insideScope) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;
        if (braceDepth <= 0) {
          insideScope = false;
          braceDepth = 0;
        }
        continue;
      }
      if (trimmed.match(/^--[\w-]+\s*:/)) {
        expect.fail(`Found unscoped token "${trimmed}" outside .student-preview`);
      }
    }
  });

  it("does not contain a :root or other top-level selector with declarations", () => {
    const topLevelSelectors = css.match(/^(?!\s)[.#:][\w-.,\s]*\{/gm);
    if (topLevelSelectors) {
      const nonStudent = topLevelSelectors.filter(
        (s) => !s.startsWith(".student-preview")
      );
      expect(nonStudent).toEqual([]);
    }
  });

  describe("exact token values", () => {
    let tokens: Map<string, string>;

    beforeAll(() => {
      tokens = parseTokens(css);
    });

    it("page background is #FCFCFE", () => {
      expect(tokens.get("page")).toBe("#FCFCFE");
    });

    it("surface is #FFFFFF", () => {
      expect(tokens.get("surface")).toBe("#FFFFFF");
    });

    it("surface-raised is #FFFFFF", () => {
      expect(tokens.get("surface-raised")).toBe("#FFFFFF");
    });

    it("surface-muted is #F0F9FF", () => {
      expect(tokens.get("surface-muted")).toBe("#F0F9FF");
    });

    it("surface-subtle is #E0F2FE", () => {
      expect(tokens.get("surface-subtle")).toBe("#E0F2FE");
    });

    it("surface-strong is #FAF9FD (portal panel background)", () => {
      expect(tokens.get("surface-strong")).toBe("#FAF9FD");
    });

    it("surface-sunken is #FAF9FD", () => {
      expect(tokens.get("surface-sunken")).toBe("#FAF9FD");
    });

    it("on-surface is #1B1B24", () => {
      expect(tokens.get("on-surface")).toBe("#1B1B24");
    });

    it("on-surface-strong is #292733 (card/lesson titles)", () => {
      expect(tokens.get("on-surface-strong")).toBe("#292733");
    });

    it("on-surface-body is #464555 (secondary text)", () => {
      expect(tokens.get("on-surface-body")).toBe("#464555");
    });

    it("on-surface-muted is #777587", () => {
      expect(tokens.get("on-surface-muted")).toBe("#777587");
    });

    it("on-surface-subtle is #A6A3B5", () => {
      expect(tokens.get("on-surface-subtle")).toBe("#A6A3B5");
    });

    it("on-primary is #FFFFFF", () => {
      expect(tokens.get("on-primary")).toBe("#FFFFFF");
    });

    it("on-primary-tint is #0369A1 (WCAG AA compliant on #E0F2FE)", () => {
      expect(tokens.get("on-primary-tint")).toBe("#0369A1");
    });

    it("brand-indigo is #0284C7", () => {
      expect(tokens.get("brand-indigo")).toBe("#0284C7");
    });

    it("brand-indigo-deep is #0369A1", () => {
      expect(tokens.get("brand-indigo-deep")).toBe("#0369A1");
    });

    it("brand-indigo-tint is #E0F2FE", () => {
      expect(tokens.get("brand-indigo-tint")).toBe("#E0F2FE");
    });

    it("brand-indigo-border is #BAE6FD", () => {
      expect(tokens.get("brand-indigo-border")).toBe("#BAE6FD");
    });

    it("brand-indigo-icon is #C7C4D8", () => {
      expect(tokens.get("brand-indigo-icon")).toBe("#C7C4D8");
    });

    it("brand-indigo-near-black is #11111A", () => {
      expect(tokens.get("brand-indigo-near-black")).toBe("#11111A");
    });

    it("brand-amber is #F97316", () => {
      expect(tokens.get("brand-amber")).toBe("#F97316");
    });

    it("brand-amber-tint is #FFF7ED", () => {
      expect(tokens.get("brand-amber-tint")).toBe("#FFF7ED");
    });

    it("brand-emerald is #22C55E", () => {
      expect(tokens.get("brand-emerald")).toBe("#22C55E");
    });

    it("brand-emerald-tint is #D1FAE5", () => {
      expect(tokens.get("brand-emerald-tint")).toBe("#D1FAE5");
    });

    it("brand-rose is #EF4444", () => {
      expect(tokens.get("brand-rose")).toBe("#EF4444");
    });

    it("brand-rose-tint is #FEE2E2", () => {
      expect(tokens.get("brand-rose-tint")).toBe("#FEE2E2");
    });

    it("border is #E2E0EF", () => {
      expect(tokens.get("border")).toBe("#E2E0EF");
    });

    it("border-strong is #DDD9E8", () => {
      expect(tokens.get("border-strong")).toBe("#DDD9E8");
    });

    it("border-subtle is #E8E5F0", () => {
      expect(tokens.get("border-subtle")).toBe("#E8E5F0");
    });

    it("has no --zinc-* tokens (student portal uses slate, not zinc)", () => {
      for (const key of tokens.keys()) {
        expect(key).not.toMatch(/^zinc-/);
      }
    });
  });
});
