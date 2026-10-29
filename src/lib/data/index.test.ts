import { describe, expect, it, vi } from "vitest";
import type { Chapter, Comic } from "@/types/comic";

// Stub the mangadex data layer so getChapter is exercised with no network and
// so we can assert it does NOT re-fetch the manga (#33): a loaded comic is the
// only source of truth for resolving a chapter.
const { getManga, hydrateChapter } = vi.hoisted(() => ({
  getManga: vi.fn(),
  hydrateChapter: vi.fn(async (c: Chapter) => c),
}));

vi.mock("./mangadex", () => ({ getManga, hydrateChapter }));

import { getChapter } from "./index";

function chapter(id: string): Chapter {
  return {
    id,
    comicId: "c1",
    number: Number(id.replace("ch", "")),
    title: `Chapter ${id}`,
    pages: [],
    publishedAt: "2024-01-01T00:00:00Z",
  };
}

const comic: Comic = {
  id: "c1",
  title: "Test Manga",
  author: "Author",
  description: "Desc",
  cover: "https://example.com/cover.jpg",
  genres: [],
  status: "ongoing",
  updatedAt: "2024-01-01T00:00:00Z",
  chapters: [chapter("ch1"), chapter("ch2")],
};

describe("getChapter (index.ts)", () => {
  it("resolves the requested chapter from the loaded comic and does not re-fetch the manga", async () => {
    const ch = await getChapter(comic, "ch1");
    expect(ch?.id).toBe("ch1");
    expect(getManga).not.toHaveBeenCalled(); // #33: no duplicate /manga/<id>/feed fetch
    expect(hydrateChapter).toHaveBeenCalledWith(comic.chapters[0]);
  });

  it("returns undefined for an unknown chapter id", async () => {
    expect(getManga).not.toHaveBeenCalled();
    expect(await getChapter(comic, "nope")).toBeUndefined();
  });
});
