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

export async function getChapter(comicId: string, chapterId: string): Promise<Chapter | undefined> {
  if (getDataSource() === "mock") {
    const ch = mock.getChapter(comicId, chapterId);
    return ch;
  }
  try {
    // find chapter in manga feed
    const comic = await md.getManga(comicId);
    const ch = comic?.chapters.find((c) => c.id === chapterId);
    if (!ch) return undefined;
    return await md.hydrateChapter(ch);
  } catch {
    return mock.getChapter(comicId, chapterId);
  }
}

export { mock };
export const ALL_GENRES = mock.ALL_GENRES;