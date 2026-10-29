import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getChapterPages, getManga, getMangaChapters, hydrateChapter } from "./mangadex";
import { safeExternalUrl } from "./mangadex-helpers";
import type { Chapter } from "@/types/comic";

const MANGA_ID = "11111111-2222-4333-8444-555555555555";
const CHAPTER_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function blankChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: CHAPTER_ID,
    comicId: MANGA_ID,
    number: 1,
    title: "Chapter 1",
    pages: [],
    publishedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getMangaChapters", () => {
  it("rejects a non-UUID manga id without hitting the API", async () => {
    expect(await getMangaChapters("../../etc/passwd")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks for English and Indonesian translations ordered by chapter", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));
    await getMangaChapters(MANGA_ID);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain(`/manga/${MANGA_ID}/feed`);
    expect(url).toContain("translatedLanguage%5B%5D=en");
    expect(url).toContain("translatedLanguage%5B%5D=id");
    expect(url).toContain("order%5Bchapter%5D=asc");
  });

  it("keeps one entry per chapter number and prefers the Indonesian one", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: "en-1",
            attributes: {
              chapter: "1",
              title: "One EN",
              translatedLanguage: "en",
              publishAt: "2024-01-01T00:00:00Z",
            },
          },
          {
            id: "id-1",
            attributes: {
              chapter: "1",
              title: "Satu ID",
              translatedLanguage: "id",
              publishAt: "2024-01-02T00:00:00Z",
            },
          },
          { id: "en-2", attributes: { chapter: "2", title: "Two EN", translatedLanguage: "en" } },
        ],
      }),
    );
    const chapters = await getMangaChapters(MANGA_ID);
    expect(chapters).toHaveLength(2);
    expect(chapters[0].id).toBe("id-1");
    expect(chapters[0].title).toBe("Satu ID");
    expect(chapters[0].number).toBe(1);
    expect(chapters[0].comicId).toBe(MANGA_ID);
    expect(chapters[0].pages).toEqual([]);
    expect(chapters[0].publishedAt).toBe("2024-01-02T00:00:00.000Z");
    expect(chapters[1].id).toBe("en-2");
    expect(chapters[1].number).toBe(2);
  });

  it("prefers a MangaDex-hosted chapter over an external one and sanitizes the URL", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: [
          { id: "id-1", attributes: { chapter: "1", translatedLanguage: "id", externalUrl: "https://external.example.com/1" } },
          { id: "en-1", attributes: { chapter: "1", translatedLanguage: "en", externalUrl: null } },
          { id: "en-2", attributes: { chapter: "2", translatedLanguage: "en", externalUrl: "javascript:alert(1)" } },
        ],
      }),
    );
    const chapters = await getMangaChapters(MANGA_ID);
    // chapter 1: the hosted (externalUrl null) one wins over the external id one
    expect(chapters[0].id).toBe("en-1");
    expect(chapters[0].externalUrl).toBeUndefined();
    // chapter 2: external source whose URL is unsafe -> stripped
    expect(chapters[1].id).toBe("en-2");
    expect(chapters[1].externalUrl).toBeUndefined();
  });

  it("returns no chapters when the API rejects the request", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));
    expect(await getMangaChapters(MANGA_ID)).toEqual([]);
  });
  it("paginates the feed and aggregates chapters past one page (#37)", async () => {
    // MangaDex caps limit at 500, so a series longer than 500 chapters must be
    // fetched across pages or the tail is silently dropped.
    const full = Array.from({ length: 500 }, (_, i) => ({
      id: `c-${i}`,
      attributes: { chapter: String(i + 1), translatedLanguage: "en" },
    }));
    const tail = Array.from({ length: 37 }, (_, i) => ({
      id: `c-${500 + i}`,
      attributes: { chapter: String(501 + i), translatedLanguage: "en" },
    }));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: full }))
      .mockResolvedValueOnce(jsonResponse({ data: tail }));

    const chapters = await getMangaChapters(MANGA_ID);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("offset=500");
    expect(chapters).toHaveLength(537);
    expect(chapters[0].number).toBe(1);
    expect(chapters[536].id).toBe("c-536");
    expect(chapters[536].number).toBe(537);
  });

  it("keeps chapters from good pages when a later page fails (#37)", async () => {
    const full = Array.from({ length: 500 }, (_, i) => ({
      id: `c-${i}`,
      attributes: { chapter: String(i + 1), translatedLanguage: "en" },
    }));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: full }))
      .mockResolvedValueOnce(new Response("boom", { status: 500 }));

    const chapters = await getMangaChapters(MANGA_ID);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(chapters).toHaveLength(500);
  });
});

describe("getChapterPages", () => {
  it("builds page image URLs from the at-home payload", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        baseUrl: "https://uploads.mangadex.org",
        chapter: { hash: "HASH", data: ["1.png", "2.png"] },
      }),
    );
    expect(await getChapterPages(CHAPTER_ID)).toEqual([
      "https://uploads.mangadex.org/data/HASH/1.png",
      "https://uploads.mangadex.org/data/HASH/2.png",
    ]);
  });

  it("returns no pages when the payload is incomplete", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ baseUrl: "https://uploads.mangadex.org", chapter: { hash: "H", data: [] } }),
    );
    expect(await getChapterPages(CHAPTER_ID)).toEqual([]);
  });

  it("rejects a non-UUID chapter id without hitting the API", async () => {
    expect(await getChapterPages("not-a-uuid")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("safeExternalUrl", () => {
  it("accepts http and https links", () => {
    expect(safeExternalUrl("https://reader.example.com/ch/1")).toBe(
      "https://reader.example.com/ch/1",
    );
    expect(safeExternalUrl("http://reader.example.com/ch/1")).toBe(
      "http://reader.example.com/ch/1",
    );
  });

  it("rejects script schemes and malformed values", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeExternalUrl("data:text/html,<script>")).toBeUndefined();
    expect(safeExternalUrl("not a url")).toBeUndefined();
    expect(safeExternalUrl(undefined)).toBeUndefined();
    expect(safeExternalUrl("")).toBeUndefined();
  });
});

describe("hydrateChapter", () => {
  it("loads page images for chapters hosted on MangaDex", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        baseUrl: "https://uploads.mangadex.org",
        chapter: { hash: "H", data: ["1.png", "2.png"] },
      }),
    );
    const hydrated = await hydrateChapter(blankChapter());
    expect(hydrated.pages).toEqual([
      "https://uploads.mangadex.org/data/H/1.png",
      "https://uploads.mangadex.org/data/H/2.png",
    ]);
    expect(hydrated.externalUrl).toBeUndefined();
  });

  it("keeps the external source from the feed without fetching page images", async () => {
    const hydrated = await hydrateChapter(
      blankChapter({ externalUrl: "https://reader.example.com/ch/1" }),
    );
    expect(hydrated.externalUrl).toBe("https://reader.example.com/ch/1");
    expect(hydrated.pages).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getManga", () => {
  it("returns undefined for an invalid manga id", async () => {
    expect(await getManga("not-a-uuid")).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps manga metadata and attaches the chapter list", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).includes("/feed")) {
        return Promise.resolve(jsonResponse({ data: [] }));
      }
      return Promise.resolve(
        jsonResponse({
          data: {
            id: MANGA_ID,
            attributes: {
              title: { en: "Real Title" },
              description: { en: "A description" },
              status: "completed",
            },
            relationships: [
              { type: "cover_art", attributes: { fileName: "cover-file" } },
              { type: "author", attributes: { name: "Author Name" } },
            ],
          },
        }),
      );
    });
    const comic = await getManga(MANGA_ID);
    expect(comic?.title).toBe("Real Title");
    expect(comic?.description).toBe("A description");
    expect(comic?.author).toBe("Author Name");
    expect(comic?.status).toBe("completed");
    expect(comic?.cover).toContain(MANGA_ID);
    expect(comic?.chapters).toEqual([]);
  });
});
