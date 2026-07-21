import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const componentsDir = join(__dirname, "..", "..", "src", "features", "shell", "components");

function getAllTsxFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      files.push(...getAllTsxFiles(join(dir, entry.name)));
    } else if (entry.name.endsWith(".tsx")) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

describe("no hex codes in components (Article X — tokens are the only source of color)", () => {
  const hexRegex = /#[0-9a-fA-F]{3,8}\b/;

  it("no component file contains a hex color code", () => {
    const files = getAllTsxFiles(componentsDir);
    if (files.length === 0) {
      expect(files.length).toBeGreaterThan(0);
      return;
    }
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const matches = content.match(hexRegex);
      expect(matches, `${file} contains hex codes: ${matches?.join(", ")}`).toBeNull();
    }
  });
});