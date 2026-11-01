import { beforeEach, describe, expect, it, vi } from "vitest";

// sitemap.ts calls listComics + getAllGenres from the data layer; stub them
// so the test exercises URL assembly and pagination without network access.
const { listComics, getAllGenres } = vi.hoisted(() => ({
  listComics: vi.fn(),
  getAllGenres: vi.fn(async () => ["Action", "Drama"]),
}));

vi.mock("@/lib/data", () => ({ listComics, getAllGenres }));

import sitemap from "@/app/sitemap";

beforeEach(() => {
  listComics.mockReset();
  getAllGenres.mockReset();
  getAllGenres.mockResolvedValue(["Action", "Drama"]);
});

describe("sitemap", () => {
  it("includes static routes", async () => {
    listComics.mockResolvedValue([]);
    const urls = await sitemap();
    const paths = urls.map((u) => new URL(u.url).pathname);
    expect(paths).toContain("/");
    expect(paths).toContain("/bookmarks");
    expect(paths).toContain("/login");
    expect(paths).toContain("/account");
  });

  it("paginates MangaDex in pages of 100 (never sends limit > 100)", async () => {
    // First page: exactly 100 items → loop continues. Second page: 1 item
    // (< 100) → loop stops. Total comic routes = 101.
    listComics
      .mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, i) => ({
          id: `m${i}`,
          updatedAt: undefined,
        })),
      )
      .mockResolvedValueOnce([{ id: "last", updatedAt: undefined }]);

    const urls = await sitemap();
    const comicPaths = urls
      .map((u) => new URL(u.url).pathname)
      .filter((p) => p.startsWith("/comic/"));
    expect(comicPaths).toHaveLength(101);

    // Every call must respect MangaDex's 100-limit cap
    for (const call of listComics.mock.calls) {
      const opts = call[0] as { limit?: number; offset?: number };
      expect(opts.limit).toBeLessThanOrEqual(100);
    }
  });

  it("stops fetching once a page returns fewer than 100 results", async () => {
    listComics.mockResolvedValueOnce([
      { id: "a", updatedAt: undefined },
      { id: "b", updatedAt: undefined },
    ]); // 2 < 100 → last page

    const urls = await sitemap();
    const paths = urls.map((u) => new URL(u.url).pathname);
    expect(listComics.mock.calls.length).toBe(1);
    expect(paths).toContain("/comic/a");
    expect(paths).toContain("/comic/b");
  });

  it("includes genre routes", async () => {
    listComics.mockResolvedValue([]);
    const urls = await sitemap();
    const genrePaths = urls
      .map((u) => new URL(u.url).pathname + new URL(u.url).search)
      .filter((p) => p.includes("genre="));
    expect(genrePaths.length).toBeGreaterThan(0);
  });
});