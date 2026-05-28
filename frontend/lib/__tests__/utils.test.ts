import { describe, it, expect } from "vitest";
import { stableId, decodeEntities } from "../utils";

describe("stableId", () => {
  it("is deterministic — same input always produces same output", () => {
    const id = stableId("https://arxiv.org/abs/2401.12345");
    expect(stableId("https://arxiv.org/abs/2401.12345")).toBe(id);
  });

  it("produces different IDs for different inputs", () => {
    expect(stableId("https://example.com/a")).not.toBe(stableId("https://example.com/b"));
  });

  it("produces a non-empty string", () => {
    expect(stableId("any input").length).toBeGreaterThan(0);
  });

  it("handles empty string without crashing", () => {
    expect(() => stableId("")).not.toThrow();
  });

  it("produces longer unique space than old 32-bit hash", () => {
    // Two-word hash should produce IDs longer than old single-word base36 (~7 chars)
    expect(stableId("https://example.com/article").length).toBeGreaterThan(7);
  });
});

describe("decodeEntities", () => {
  it("decodes &amp;", () => {
    expect(decodeEntities("Tom &amp; Jerry")).toBe("Tom & Jerry");
  });

  it("decodes &lt; and &gt;", () => {
    expect(decodeEntities("&lt;div&gt;")).toBe("<div>");
  });

  it("decodes &quot;", () => {
    expect(decodeEntities("She said &quot;hello&quot;")).toBe('She said "hello"');
  });

  it("decodes smart quotes", () => {
    expect(decodeEntities("&#8220;AI&#8221;")).toBe('"AI"');
  });

  it("decodes em dash", () => {
    expect(decodeEntities("2024&#8212;2025")).toBe("2024—2025");
  });

  it("leaves unrecognised entities untouched", () => {
    expect(decodeEntities("&unknown;")).toBe("&unknown;");
  });

  it("handles strings with no entities unchanged", () => {
    const plain = "Hello world, no entities here.";
    expect(decodeEntities(plain)).toBe(plain);
  });
});
