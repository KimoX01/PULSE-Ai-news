import { describe, it, expect } from "vitest";
import { timeAgo } from "../timeAgo";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const ahead = (ms: number) => new Date(Date.now() + ms).toISOString();

describe("timeAgo", () => {
  it("returns seconds for sub-minute timestamps", () => {
    expect(timeAgo(ago(30_000))).toBe("30s ago");
  });

  it("returns minutes for sub-hour timestamps", () => {
    expect(timeAgo(ago(5 * 60_000))).toBe("5m ago");
  });

  it("returns hours for sub-day timestamps", () => {
    expect(timeAgo(ago(3 * 3_600_000))).toBe("3h ago");
  });

  it("returns days for older timestamps", () => {
    expect(timeAgo(ago(2 * 24 * 3_600_000))).toBe("2d ago");
  });

  it("handles future dates without crashing or returning negative", () => {
    const result = timeAgo(ahead(60_000));
    expect(result).toBe("just now");
  });

  it("handles empty string without crashing", () => {
    expect(timeAgo("")).toBe("just now");
  });

  it("handles completely invalid strings without crashing", () => {
    expect(timeAgo("not-a-date")).toBe("just now");
  });
});
