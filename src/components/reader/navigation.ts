import type { Chapter, Comic } from "@/types/comic";

export type NextTarget =
  | { kind: "page"; pageIndex: number }
  | { kind: "chapter"; chapterId: string; page: number }
  | null;

export function getNextTarget(
  comic: Comic | undefined,
  chapter: Chapter | undefined,
  pageIndex: number,
  totalPages: number,
): NextTarget {
  if (pageIndex + 1 < totalPages) {
    return { kind: "page", pageIndex: pageIndex + 1 };
  }
  if (!comic || !chapter) return null;
  const idx = comic.chapters.findIndex((c) => c.id === chapter.id);
  const next = idx >= 0 ? comic.chapters[idx + 1] : undefined;
  if (!next) return null;
  return { kind: "chapter", chapterId: next.id, page: pageIndex };
}
