import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("defaults to / for missing values", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext("")).toBe("/");
  });
  it("accepts a safe relative path", () => {
    expect(safeNext("/bookmarks")).toBe("/bookmarks");
    expect(safeNext("/read/x/1")).toBe("/read/x/1");
  });
  it("rejects open-redirect vectors", () => {
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("http://evil.com/x")).toBe("/");
    expect(safeNext("///evil.com")).toBe("/");
    // backslash tricks that the naive "//" check misses
    expect(safeNext("/\\evil.com")).toBe("/");
    expect(safeNext("/\\@evil.com")).toBe("/");
    expect(safeNext("/\\t.evil.com")).toBe("/");
  });
});
