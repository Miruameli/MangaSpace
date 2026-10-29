import type { Chapter, Comic } from "@/types/comic";
import * as mock from "./comics";
import * as md from "./mangadex";

export type DataSource = "mock" | "mangadex";

export function getDataSource(): DataSource {
  const v = (process.env.NEXT_PUBLIC_DATA_SOURCE || "mangadex").toLowerCase();
  return v === "mock" ? "mock" : "mangadex";
}

export async function listComics(query = ""): Promise<Comic[]> {
  if (getDataSource() === "mock") {
    const q = query.trim().toLowerCase();
    return mock.getAllComics().filter((c) =>
      q ? `${c.title} ${c.author} ${c.description}`.toLowerCase().includes(q) : true,
    );
  }
  try {
    return await md.listManga(24, 0, query);
  } catch {
    return mock.getAllComics();
  }
}

export async function getComic(id: string): Promise<Comic | undefined> {
  if (getDataSource() === "mock") return mock.getComic(id);
  try {
    return await md.getManga(id);
  } catch {
    return mock.getComic(id);
  }
}

// Resolve a single chapter from a comic the caller has ALREADY loaded.
// The reader route performs the heavy manga + chapter-feed fetch once via
// getComic, so getChapter must NOT re-fetch — it only hydrates page images
// for the chosen chapter from the at-home server. Re-fetching here would
// duplicate the feed request (issue #33). External (off-MangaDex) chapters
// come back with no pages and are surfaced via the reader's unavailable UI.
export async function getChapter(
  comic: Comic,
  chapterId: string,
): Promise<Chapter | undefined> {
  const ch = comic.chapters.find((c) => c.id === chapterId);
  if (!ch) return undefined;
  if (getDataSource() === "mock") return ch;
  try {
    return await md.hydrateChapter(ch);
  } catch {
    // Page-image fetch failed (network/5xx). Preserve prior semantics: surface
    // as "not found" rather than crashing the Server Component.
    return undefined;
  }
}

export { mock };
export const ALL_GENRES = mock.ALL_GENRES;