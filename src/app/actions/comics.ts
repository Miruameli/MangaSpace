"use server";

import { getComic, listComics } from "@/lib/data";
import type { Comic } from "@/types/comic";

// Server-side search for the library. Fetching MangaDex on the server avoids a
// cross-origin browser request (which fails in the client today) and lets the
// existing `next: { revalidate }` ISR cache apply.
export async function searchComics(query: string): Promise<Comic[]> {
  return listComics(query);
}

// Upper bounds so one request cannot fan out without limit.
const MAX_BOOKMARK_IDS = 50;
const FETCH_CONCURRENCY = 4;

// Resolves bookmark IDs to comics on the server. Bookmark IDs live in
// localStorage, so the bookmarks page has to stay a client component — but the
// MangaDex lookup itself must run server-side, because the browser is blocked
// by CORS. Bounded concurrency keeps us inside MangaDex's rate limits.
export async function getComicsByIds(ids: string[]): Promise<Comic[]> {
  const unique = Array.from(new Set(ids)).slice(0, MAX_BOOKMARK_IDS);
  const comics: Comic[] = [];
  for (let i = 0; i < unique.length; i += FETCH_CONCURRENCY) {
    const batch = unique.slice(i, i + FETCH_CONCURRENCY);
    const resolved = await Promise.all(batch.map((id) => getComic(id)));
    for (const comic of resolved) {
      if (comic) comics.push(comic);
    }
  }
  return comics;
}
