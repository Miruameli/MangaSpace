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

type ListMangaOptions = {
  limit?: number;
  offset?: number;
  query?: string;
  search?: string;
  q?: string;
  genre?: string;
  status?: string;
};

function normalizeListMangaArgs(args: unknown[]): {
  limit: number;
  offset: number;
  query: string;
  genre: string;
  status: string;
} {
  let limit = 24;
  let offset = 0;
  let query = "";
  let genre = "";
  let status = "";
  const [a, b, c, d, e] = args;
  if (a && typeof a === "object") {
    const o = a as ListMangaOptions;
    limit = o.limit ?? 24;
    offset = o.offset ?? 0;
    query = o.query ?? o.search ?? o.q ?? "";
    genre = o.genre ?? "";
    status = o.status ?? "";
  } else {
    limit = typeof a === "number" ? a : 24;
    offset = typeof b === "number" ? b : 0;
    if (typeof c === "string") query = c;
    else if (c && typeof c === "object") {
      const o = c as ListMangaOptions;
      query = o.query ?? o.search ?? o.q ?? query;
      genre = o.genre ?? genre;
      status = o.status ?? status;
    }
    if (typeof d === "string") genre = d;
    else if (d && typeof d === "object") {
      const o = d as ListMangaOptions;
      genre = o.genre ?? genre;
      status = o.status ?? status;
      if (o.query || o.search || o.q) query = o.query ?? o.search ?? o.q ?? query;
    }
    if (typeof e === "string") status = e;
  }
  if (genre === "all") genre = "";
  if (status === "all") status = "";
  const normalizedStatus = status.trim().toLowerCase();
  const allowedStatus = new Set(["ongoing", "completed", "hiatus", "cancelled"]);
  return {
    limit,
    offset,
    query: query.trim(),
    genre: genre.trim(),
    status: allowedStatus.has(normalizedStatus) ? normalizedStatus : "",
  };
}

let tagCache: Map<string, string> | null = null;
async function resolveTagId(name: string): Promise<string | undefined> {
  if (!tagCache) {
    try {
      const res = await fetch(`${API}/manga/tag`, { next: { revalidate: 3600 } });
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

export async function listManga(...args: unknown[]): Promise<Comic[]> {
  const { limit, offset, query, genre, status } = normalizeListMangaArgs(args);
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.append("includes[]", "cover_art");
  params.set("order[followedCount]", "desc");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  if (query) params.set("title", query);
  if (status) params.append("status[]", status);
  if (genre) {
    const tagId = await resolveTagId(genre);
    if (tagId) params.append("includedTags[]", tagId);
  }

  const res = await fetch(`${API}/manga?${params.toString()}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = (await safeJson(res)) as { data?: MdManga[] } | null;
  const data = json?.data ?? [];
  return data.map((m) => ({
    id: m.id,
    title: pickText(m.attributes?.title) || "Untitled",
    author: "Unknown",
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
  const res = await fetch(`${API}/manga/${id}?includes[]=cover_art&includes[]=author`, {
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
    const res = await fetch(`${API}/manga/${mangaId}/feed?${params.toString()}`, {
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
  return [...byNumber.values()].map((c) => ({
    id: c.id,
    comicId: mangaId,
    number: Number(c.attributes?.chapter) || 0,
    title: c.attributes?.title ?? `Chapter ${c.attributes?.chapter ?? ""}`,
    pages: [],
    publishedAt: c.attributes?.publishAt
      ? new Date(c.attributes.publishAt).toISOString()
      : new Date().toISOString(),
    externalUrl: safeExternalUrl(c.attributes?.externalUrl),
  }));
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
  const res = await fetch(`${API}/at-home/server/${chapterId}`, {
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
  const pages = await getChapterPages(chapter.id);
  return { ...chapter, pages };
}