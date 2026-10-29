import { describe, expect, it } from "vitest";
import { OAUTH_PROVIDERS } from "./providers";

describe("OAUTH_PROVIDERS", () => {
  it("offers google, github, and apple", () => {
    expect(OAUTH_PROVIDERS.map((p) => p.id).sort()).toEqual([
      "apple",
      "github",
      "google",
    ]);
  });
  it("gives each provider a non-empty label", () => {
    for (const p of OAUTH_PROVIDERS) expect(p.label.trim().length).toBeGreaterThan(0);
  });
  it("has no duplicate providers", () => {
    const ids = OAUTH_PROVIDERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
