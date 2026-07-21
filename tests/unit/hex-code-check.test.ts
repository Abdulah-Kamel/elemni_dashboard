import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

describe("No hex codes in feature components", () => {
  const featureDir = join(process.cwd(), "src/features/course-management");
  const hexPattern = /#[0-9a-fA-F]{3,8}/;

  function getAllTsxFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllTsxFiles(fullPath));
      } else if (extname(entry.name) === ".tsx" || extname(entry.name) === ".ts") {
        files.push(fullPath);
      }
    }

    return files;
  }

  const tsxFiles = getAllTsxFiles(featureDir);

  it(`checks ${tsxFiles.length} files for hex codes`, () => {
    for (const file of tsxFiles) {
      const content = readFileSync(file, "utf-8");
      const matches = content.match(hexPattern);
      if (matches) {
        throw new Error(`Found hex code ${matches[0]} in ${file}`);
      }
    }
    expect(true).toBe(true);
  });
});
