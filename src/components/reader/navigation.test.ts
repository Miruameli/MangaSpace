import { describe, expect, it } from "vitest";
import { getNextTarget } from "./navigation";
import type { Chapter, Comic } from "@/types/comic";

const mkChapter = (n: number, pages = 3): Chapter => ({
  id: `c-ch${n}`,
  comicId: "c",
  number: n,
  title: `Ch ${n}`,
  pages: Array.from({ length: pages }, (_, i) => `p${n}-${i}`),
  publishedAt: "2026-01-01",
});

const comic: Comic = {
  id: "c",
  title: "T",
  author: "A",
  description: "D",
  cover: "cover",
  genres: [],
  status: "ongoing",
  updatedAt: "2026-01-01",
  chapters: [mkChapter(1), mkChapter(2)],
};

describe("reader navigation", () => {
  it("advances to next page when not on last page", () => {
    const t = getNextTarget(comic, comic.chapters[0], 0, 3);
    expect(t).toEqual({ kind: "page", pageIndex: 1 });
  });

  it("advances to next chapter preserving page index at chapter boundary", () => {
    const t = getNextTarget(comic, comic.chapters[0], 2, 3);
    expect(t).toEqual({ kind: "chapter", chapterId: "c-ch2", page: 2 });
  });

  it("returns null on last page of last chapter", () => {
    const t = getNextTarget(comic, comic.chapters[1], 2, 3);
    expect(t).toBeNull();
  });

  it("returns null when comic or chapter missing", () => {
    expect(getNextTarget(undefined, comic.chapters[0], 2, 3)).toBeNull();
    expect(getNextTarget(comic, undefined, 2, 3)).toBeNull();
  });
});
