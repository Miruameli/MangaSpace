export type ComicStatus = "ongoing" | "completed";

export type Comic = {
  id: string;
  title: string;
  author: string;
  description: string;
  cover: string;
  genres: string[];
  status: ComicStatus;
  updatedAt: string;
  chapters: Chapter[];
};

export type Chapter = {
  id: string;
  comicId: string;
  number: number;
  title: string;
  pages: string[];
  publishedAt: string;
  // Chapters hosted outside MangaDex have no page images; this points at the
  // original source so the reader can still reach the content.
  externalUrl?: string;
  // Set when the upstream request failed (rate limit, network, 5xx), so the
  // reader can report a transport problem instead of blaming the content.
  loadFailed?: boolean;
};

export type ReadingProgress = {
  comicId: string;
  chapterId: string;
  page: number;
  updatedAt: number;
};

export type Bookmark = ReadingProgress;