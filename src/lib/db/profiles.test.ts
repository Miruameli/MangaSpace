import { describe, expect, it } from "vitest";
import {
  MAX_DISPLAY_NAME,
  isValidAvatarUrl,
  validateDisplayName,
} from "./profiles";

describe("validateDisplayName", () => {
  it("rejects empty / whitespace-only names", () => {
    expect(validateDisplayName("")).toMatch(/empty/i);
    expect(validateDisplayName("   ")).toMatch(/empty/i);
  });
  it("accepts a normal name and trims it", () => {
    expect(validateDisplayName("  Ada  ")).toBeNull();
  });
  it("rejects names longer than the cap", () => {
    expect(validateDisplayName("a".repeat(MAX_DISPLAY_NAME + 1))).toMatch(/characters/i);
    expect(validateDisplayName("a".repeat(MAX_DISPLAY_NAME))).toBeNull();
  });
});

describe("isValidAvatarUrl", () => {
  it("accepts empty and https URLs", () => {
    expect(isValidAvatarUrl("")).toBe(true);
    expect(isValidAvatarUrl("https://cdn.example.com/a.png")).toBe(true);
  });
  it("rejects non-http(s) schemes and malformed values", () => {
    expect(isValidAvatarUrl("data:text/plain;base64,AAAA")).toBe(false);
    expect(isValidAvatarUrl("javascript:alert(1)")).toBe(false);
    expect(isValidAvatarUrl("not a url")).toBe(false);
  });
});
