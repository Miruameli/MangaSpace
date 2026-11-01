import type { Chapter, Comic } from "@/types/comic";
import {
  API,
  validUuid,
  MdManga,
  MdChapter,
  pickText,
  coverUrl,
  statusFromManga,
  tagNames,
  authorName,
  safeJson,
  safeExternalUrl,
} from "./mangadex-helpers";

export { API, validUuid } from "./mangadex-helpers";
// Retry with exponential backoff for rate-limit resilience.
// MangaDex allows 5 req/s burst, 100 req/min sustained; on 429 we back off
// and respect the Retry-After header when present.
async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429 && attempt < maxRetries) {
        const retryAfter = res.headers.get("retry-after");
        const delay = retryAfter ? Number(retryAfter) * 1000 : 2 ** attempt * 1000;
        const { promise, resolve } = Promise.withResolvers<void>();
        setTimeout(resolve, delay);
        await promise;
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxRetries) {
        const { promise, resolve } = Promise.withResolvers<void>();
        setTimeout(resolve, 2 ** attempt * 1000);
        await promise;
      }
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

type ListMangaOptions = {
  limit?: number;
  offset?: number;
  query?: string;
  search?: string;
  q?: string;
  genre?: string;
  status?: string;
  language?: string;
};
function normalizeListMangaArgs(args: unknown[]): {
  limit: number;
  offset: number;
  query: string;
  genre: string;
  status: string;
  language: string;
} {
  let limit = 24;
  let offset = 0;
  let query = "";
  let genre = "";
  let status = "";
  let language = "";
  const [a, b, c, d, e] = args;
  if (a && typeof a === "object") {
    const o = a as ListMangaOptions;
    limit = o.limit ?? 24;
    offset = o.offset ?? 0;
    query = o.query ?? o.search ?? o.q ?? "";
    genre = o.genre ?? "";
    status = o.status ?? "";
    language = o.language ?? "";
  } else {
    limit = typeof a === "number" ? a : 24;
    offset = typeof b === "number" ? b : 0;
    if (typeof c === "string") query = c;
    else if (c && typeof c === "object") {
      const o = c as ListMangaOptions;
      query = o.query ?? o.search ?? o.q ?? query;
      genre = o.genre ?? genre;
      status = o.status ?? status;
      language = o.language ?? language;
    }
    if (typeof d === "string") genre = d;
    else if (d && typeof d === "object") {
      const o = d as ListMangaOptions;
      genre = o.genre ?? genre;
      status = o.status ?? status;
      language = o.language ?? language;
      if (o.query || o.search || o.q) query = o.query ?? o.search ?? o.q ?? query;
    }
    if (typeof e === "string") status = e;
  }
  if (genre === "all") genre = "";
  if (status === "all") status = "";
  if (language === "all") language = "";
  const normalizedStatus = status.trim().toLowerCase();
  const allowedStatus: Record<string, true> = {
    ongoing: true,
    completed: true,
    hiatus: true,
    cancelled: true,
  };
  return {
    limit,
    offset,
    query: query.trim(),
    genre: genre.trim(),
    status: allowedStatus[normalizedStatus] ? normalizedStatus : "",
    language: language.trim(),
  };
}

let tagCache: Map<string, string> | null = null;
async function resolveTagId(name: string): Promise<string | undefined> {
  if (!tagCache) {
    try {
      const res = await fetchWithRetry(`${API}/manga/tag`, { next: { revalidate: 3600 } });
      if (!res.ok) return undefined;
      const json = (await safeJson(res)) as { data?: Array<{ id: string; attributes?: { name?: Record<string, string> } }> } | null;
      tagCache = new Map();
      for (const t of json?.data ?? []) {
        const n = pickText(t.attributes?.name);
        if (n && t.id) tagCache.set(n.toLowerCase(), t.id);
      }
    } catch {
      return undefined;
    }
  }
  return tagCache.get(name.toLowerCase());
}
// Genre cache: fetches the MangaDex /manga/tag endpoint once, filters to
// group === "genre", and caches the sorted list. Revalidates every hour.
let genreCache: string[] | null = null;
export async function getAllGenres(): Promise<string[]> {
  if (genreCache) return genreCache;
  try {
    const res = await fetchWithRetry(`${API}/manga/tag`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = (await safeJson(res)) as { data?: Array<{ attributes?: { group?: string; name?: Record<string, string> } }> } | null;
    const genres = (json?.data ?? [])
      .filter((t) => t.attributes?.group === "genre")
      .map((t) => pickText(t.attributes?.name))
      .filter(Boolean)
      .sort() as string[];
    genreCache = genres;
    return genres;
  } catch {
    return [];
  }
}

export async function listManga(...args: unknown[]): Promise<Comic[]> {
  const { limit, offset, query, genre, status, language } = normalizeListMangaArgs(args);
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");
  params.set("order[followedCount]", "desc");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  if (query) params.set("title", query);
  if (status) params.append("status[]", status);
  if (genre) {
    const tagId = await resolveTagId(genre);
    if (tagId) params.append("includedTags[]", tagId);
  }
  if (language) params.append("translatedLanguage[]", language);

  const res = await fetchWithRetry(`${API}/manga?${params.toString()}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = (await safeJson(res)) as { data?: MdManga[] } | null;
  const data = json?.data ?? [];
  return data.map((m) => ({
    id: m.id,
    title: pickText(m.attributes?.title) || "Untitled",
    author: authorName(m) || "Unknown",
    description: pickText(m.attributes?.description),
    cover: coverUrl(m),
    genres: tagNames(m),
    status: statusFromManga(m.attributes?.status),
    updatedAt: new Date().toISOString(),
    chapters: [],
  }));
}

export async function getManga(id: string): Promise<Comic | undefined> {
  if (!validUuid(id)) return undefined;
  const res = await fetchWithRetry(`${API}/manga/${id}?includes[]=cover_art&includes[]=author`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return undefined;
  const json = (await safeJson(res)) as { data?: MdManga } | null;
  const m = json?.data;
  if (!m) return undefined;

  const chapters = await getMangaChapters(id);
  return {
    id: m.id,
    title: pickText(m.attributes?.title) || "Untitled",
    author: authorName(m) || "Unknown",
    description: pickText(m.attributes?.description),
    cover: coverUrl(m),
    genres: tagNames(m),
    status: statusFromManga(m.attributes?.status),
    language: undefined,
    updatedAt: new Date().toISOString(),
    chapters,
  };
}

export async function getMangaChapters(mangaId: string): Promise<Chapter[]> {
  if (!validUuid(mangaId)) return [];
  // MangaDex caps `limit` at 500, so a long series' feed must be paginated or
  // every chapter past the first page is silently dropped. Walk offsets until a
  // short page proves we've reached the end; keep whatever we gathered if a
  // later page fails rather than discarding the chapters already fetched.
  const PAGE = 500;
  const data: MdChapter[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE));
    params.set("offset", String(offset));
    params.append("translatedLanguage[]", "en");
    params.append("translatedLanguage[]", "id");
    params.set("order[chapter]", "asc");
    const res = await fetchWithRetry(`${API}/manga/${mangaId}/feed?${params.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) break;
    const page = ((await safeJson(res)) as { data?: MdChapter[] } | null)?.data;
    const items = page ?? [];
    data.push(...items);
    if (items.length < PAGE) break;
  }
  const byNumber = new Map<number, MdChapter>();
  for (const c of data) {
    const num = Number(c.attributes?.chapter) || 0;
    const prev = byNumber.get(num);
    if (!prev || prefersChapter(c, prev)) {
      byNumber.set(num, c);
    }
  }
  return [...byNumber.values()].map((c) => {
    const num = Number(c.attributes?.chapter) || 0;
    const rawTitle = (c.attributes?.title ?? "").trim();
    const numStr = (c.attributes?.chapter ?? "").trim();
    const core = rawTitle.replace(/:+\s*$/, "").trim().replace(/\s+/g, " ");
    const redundant =
      core === "" ||
      core === numStr ||
      core === String(num) ||
      core.toLowerCase() === `chapter ${numStr}`.toLowerCase() ||
      core.toLowerCase() === `chapter ${num}`.toLowerCase();
    return {
      id: c.id,
      comicId: mangaId,
      number: num,
      title: redundant ? "" : rawTitle,
      pages: [],
      publishedAt: c.attributes?.publishAt
        ? new Date(c.attributes.publishAt).toISOString()
        : new Date().toISOString(),
      externalUrl: safeExternalUrl(c.attributes?.externalUrl),
    };
  });
}

// A chapter is preferred over another when it is hosted on MangaDex (readable
// in-app) and the other lives on an external source, or — when that is equal —
// it is the Indonesian translation.
function prefersChapter(a: MdChapter, b: MdChapter): boolean {
  const aHosted = a.attributes?.externalUrl == null;
  const bHosted = b.attributes?.externalUrl == null;
  if (aHosted !== bHosted) return aHosted;
  return a.attributes?.translatedLanguage === "id";
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  if (!validUuid(chapterId)) return [];
  const res = await fetchWithRetry(`${API}/at-home/server/${chapterId}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = (await safeJson(res)) as
    | { baseUrl?: string; chapter?: { hash?: string; data?: string[] } }
    | null;
  const base = json?.baseUrl;
  const hash = json?.chapter?.hash;
  const files = json?.chapter?.data ?? [];
  if (!base || !hash || files.length === 0) return [];
  return files.map((f) => `${base}/data/${hash}/${f}`);
}

export async function hydrateChapter(chapter: Chapter): Promise<Chapter> {
  if (chapter.pages.length > 0) return chapter;
  // The feed already tells us whether the chapter is hosted on MangaDex or on
  // an external source. External chapters expose no page images here, so point
  // the reader at the original source instead of an empty gallery.
  if (chapter.externalUrl) return { ...chapter, pages: [] };
  try {
    const pages = await getChapterPages(chapter.id);
    if (pages.length === 0) {
      return { ...chapter, pages: [], loadFailed: true };
    }
    return { ...chapter, pages };
  } catch {
    return { ...chapter, pages: [], loadFailed: true };
  }
}