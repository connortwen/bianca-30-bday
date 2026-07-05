import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { memories } from "./memories";

describe("memories data", () => {
  it("has at least 3 seed memories", () => {
    expect(memories.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique ids", () => {
    const ids = memories.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has valid coordinates", () => {
    for (const m of memories) {
      expect(m.lat).toBeGreaterThanOrEqual(-90);
      expect(m.lat).toBeLessThanOrEqual(90);
      expect(m.lng).toBeGreaterThanOrEqual(-180);
      expect(m.lng).toBeLessThanOrEqual(180);
    }
  });

  it("gives every normal memory a photo that exists under public/", () => {
    for (const m of memories) {
      if ((m.status ?? "normal") === "normal") {
        expect(m.photo, `${m.id} is normal and needs a photo`).toBeDefined();
      }
      if (m.photo) {
        expect(m.photo.startsWith("/memories/")).toBe(true);
        expect(existsSync(join(process.cwd(), "public", m.photo))).toBe(true);
      }
    }
  });

  it("only uses known statuses", () => {
    for (const m of memories) {
      expect(["normal", "locked", "coming-soon", undefined]).toContain(m.status);
    }
  });

  it("gives every locked memory a code hash and reveal photo", () => {
    for (const m of memories) {
      if (m.status === "locked") {
        expect(m.codeHash).toMatch(/^[0-9a-f]{64}$/);
        expect(m.photo).toBeDefined();
      } else {
        expect(m.codeHash).toBeUndefined();
      }
    }
  });
});
