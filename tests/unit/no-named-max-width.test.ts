import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// globals.css defines --spacing-xs…--spacing-3xl (4–48px). In Tailwind v4 those
// tokens win over the container scale, so `max-w-2xl` becomes 32px instead of
// 42rem and dialogs/text collapse. Use explicit sizes such as `max-w-[42rem]`.
const root = join(__dirname, "..", "..");
const banned = /(?<![\w-])(max|min)-(w|h)-(xs|sm|md|lg|xl|2xl|3xl)(?![\w-])/;

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(path));
    else if (/\.(tsx|ts)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) files.push(path);
  }
  return files;
}

describe("no named max/min width or height classes", () => {
  it("uses explicit sizes because spacing tokens shadow the container scale", () => {
    const offenders = [...sourceFiles(join(root, "src")), ...sourceFiles(join(root, "app"))]
      .flatMap((file) => {
        const match = readFileSync(file, "utf-8").match(banned);
        return match ? [`${file.replace(root, "")}: ${match[0]}`] : [];
      });
    expect(offenders).toEqual([]);
  });
});
