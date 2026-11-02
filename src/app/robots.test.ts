import { beforeEach, describe, expect, it, vi } from "vitest";

// robots.ts reads the canonical origin from @/lib/site; stub getBaseUrl so the
// test asserts the rules and sitemap URL without depending on env vars.
const { getBaseUrl } = vi.hoisted(() => ({
  getBaseUrl: vi.fn(() => "https://mangaspace-eight.vercel.app"),
}));

vi.mock("@/lib/site", () => ({ getBaseUrl }));

import robots from "@/app/robots";

beforeEach(() => {
  getBaseUrl.mockClear();
});

describe("robots", () => {
  it("points the sitemap at the canonical origin", () => {
    const result = robots();
    expect(result.sitemap).toBe(
      "https://mangaspace-eight.vercel.app/sitemap.xml",
    );
  });

  it("allows everything but opts out of internal-only routes", () => {
    const result = robots();
    // `rules` is a union (single object | array); normalize to an array so we
    // can index it without a TS error.
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const rule = rules[0];
    expect(rule?.userAgent).toBe("*");
    expect(rule?.allow).toBe("/");
    // /api/ and /auth/callback must never be crawled
    expect(rule?.disallow).toEqual(["/api/", "/auth/callback"]);
  });
});