import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const assetsDir = join(
  __dirname,
  "..",
  "..",
  "..",
  "assets",
  "student-preview"
);

const EXPECTED_ASSETS = [
  "profile-background.webp",
  "lesson-calculus.webp",
  "lesson-mechanics.webp",
  "lesson-study-skills.webp",
  "lesson-arabic.webp",
  "teacher-ahmad.webp",
];

function hasWebpMagicBytes(filePath: string): boolean {
  const buf = readFileSync(filePath);
  if (buf.length < 12) return false;
  return (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

describe("student-preview assets", () => {
  it("assets directory exists", () => {
    expect(existsSync(assetsDir)).toBe(true);
  });

  for (const name of EXPECTED_ASSETS) {
    it(`${name} exists`, () => {
      expect(existsSync(join(assetsDir, name))).toBe(true);
    });

    it(`${name} is non-empty`, () => {
      const stat = statSync(join(assetsDir, name));
      expect(stat.size).toBeGreaterThan(0);
    });

    it(`${name} has valid WEBP magic bytes`, () => {
      expect(hasWebpMagicBytes(join(assetsDir, name))).toBe(true);
    });
  }

  it("contains exactly the expected image files — no extras", () => {
    const files = readdirSync(assetsDir).filter(
      (f: string) =>
        f.endsWith(".webp") || f.endsWith(".png") || f.endsWith(".jpg")
    );
    expect(files.sort()).toEqual(EXPECTED_ASSETS.sort());
  });
});
