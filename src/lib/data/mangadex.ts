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
} from "./mangadex-helpers";

export { API, validUuid } from "./mangadex-helpers";

export async function listManga(limit = 24, offset = 0, query = ""): Promise<Comic[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.append("includes[]", "cover_art");
  params.set("order[followedCount]", "desc");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  if (query.trim()) params.set("title", query.trim());

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
  const params = new URLSearchParams();
  params.set("limit", "500");
  params.append("translatedLanguage[]", "en");
  params.append("translatedLanguage[]", "id");
  params.set("order[chapter]", "asc");
  const res = await fetch(`${API}/manga/${mangaId}/feed?${params.toString()}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = (await safeJson(res)) as { data?: MdChapter[] } | null;
  const data = json?.data ?? [];
  const byNumber = new Map<number, MdChapter>();
  for (const c of data) {
    const num = Number(c.attributes?.chapter) || 0;
    const prev = byNumber.get(num);
    if (!prev || c.attributes?.translatedLanguage === "id") {
      byNumber.set(num, c);
    }
  }
  return [...byNumber.values()].map((c) => ({
    id: c.id,
    comicId: mangaId,
    number: Number(c.attributes?.chapter) || 0,
    title: c.attributes?.title ?? `Chapter ${c.attributes?.chapter ?? ""}`,
    pages: [],
    publishedAt: c.attributes?.publishAt ? new Date(c.attributes.publishAt).toISOString() : new Date().toISOString(),
  }));
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
  const pages = await getChapterPages(chapter.id);
  return { ...chapter, pages };
}