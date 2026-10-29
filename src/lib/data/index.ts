import type { Chapter, Comic } from "@/types/comic";
import * as mock from "./comics";
import * as md from "./mangadex";

export type DataSource = "mock" | "mangadex";

export function getDataSource(): DataSource {
  const v = (process.env.NEXT_PUBLIC_DATA_SOURCE || "mangadex").toLowerCase();
  return v === "mock" ? "mock" : "mangadex";
}

type ListComicsOptions = {
  query?: string;
  search?: string;
  q?: string;
  genre?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

function normalizeListComicsArgs(args: unknown[]): ListComicsOptions {
  const opts: ListComicsOptions = {};
  const [a, b, c] = args;
  if (typeof a === "string") {
    opts.query = a;
    if (typeof b === "string") opts.genre = b;
    else if (b && typeof b === "object") Object.assign(opts, b);
    if (typeof c === "string") opts.status = c;
    else if (c && typeof c === "object") Object.assign(opts, c);
  } else if (a && typeof a === "object") {
    Object.assign(opts, a as ListComicsOptions);
  }
  if (args.length > 1 && typeof args[1] === "object") Object.assign(opts, args[1] as ListComicsOptions);
  if (args.length > 2 && typeof args[2] === "object") Object.assign(opts, args[2] as ListComicsOptions);
  if (opts.genre === "all") opts.genre = undefined;
  if (opts.status === "all") opts.status = undefined;
  if (opts.status) {
    const s = String(opts.status).trim().toLowerCase();
    opts.status = new Set(["ongoing", "completed", "hiatus", "cancelled"]).has(s) ? s : undefined;
  }
  return opts;
}

function normalizeFilter(v?: string): string {
  if (!v || v === "all") return "";
  return v.trim();
}

export async function listComics(...args: unknown[]): Promise<Comic[]> {
  const opts = normalizeListComicsArgs(args);
  const query = (opts.query ?? opts.search ?? opts.q ?? "").trim();
  const genre = normalizeFilter(opts.genre);
  const status = normalizeFilter(opts.status);
  if (getDataSource() === "mock") {
    const q = query.toLowerCase();
    return mock.getAllComics().filter((c) => {
      if (q && !`${c.title} ${c.author} ${c.description}`.toLowerCase().includes(q)) return false;
      if (genre && !c.genres.some((g) => g.toLowerCase() === genre.toLowerCase())) return false;
      if (status && c.status !== status.toLowerCase()) return false;
      return true;
    });
  }
  try {
    return await md.listManga(opts.limit ?? 24, opts.offset ?? 0, query, { genre, status });
  } catch {
    const q = query.toLowerCase();
    return mock.getAllComics().filter((c) => {
      if (q && !`${c.title} ${c.author} ${c.description}`.toLowerCase().includes(q)) return false;
      if (genre && !c.genres.some((g) => g.toLowerCase() === genre.toLowerCase())) return false;
      if (status && c.status !== status.toLowerCase()) return false;
      return true;
    });
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