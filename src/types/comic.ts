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
};

export type ReadingProgress = {
  comicId: string;
  chapterId: string;
  page: number;
  updatedAt: number;
};

export type Bookmark = ReadingProgress;