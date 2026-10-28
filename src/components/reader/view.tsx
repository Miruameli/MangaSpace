import Link from "next/link";
import type { Chapter, Comic } from "@/types/comic";

export interface ReaderViewProps {
  comic: Comic;
  chapter: Chapter;
  safeIndex: number;
  totalPages: number;
  fitWidth: boolean;
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
  goPrev: () => void;
  goNext: () => void;
  toggleFit: () => void;
}

export function ReaderView({
  comic,
  chapter,
  safeIndex,
  totalPages,
  fitWidth,
  prevChapter,
  nextChapter,
  goPrev,
  goNext,
  toggleFit,
}: ReaderViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link
          href={`/comic/${comic.id}`}
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
        >
          ← {comic.title}
        </Link>
        <div className="text-sm font-medium">
          Ch.{chapter.number} · Page {safeIndex + 1} / {totalPages}
        </div>
        <button
          type="button"
          onClick={toggleFit}
          className="text-xs rounded border border-zinc-300 dark:border-zinc-700 px-2 py-1"
        >
          {fitWidth ? "Fit width" : "Fit height"}
        </button>
      </div>

      <div className="relative flex justify-center bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden min-h-[60vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={chapter.pages[safeIndex]}
          alt={`Page ${safeIndex + 1}`}
          className={fitWidth ? "w-full max-w-3xl" : "h-[80vh]"}
        />
        <button
          type="button"
          aria-label="Previous page"
          onClick={goPrev}
          className="absolute left-0 top-0 h-full w-1/3 cursor-w-resize opacity-0 hover:opacity-100 transition bg-gradient-to-r from-black/20 to-transparent text-white flex items-center justify-start pl-4"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next page"
          onClick={goNext}
          className="absolute right-0 top-0 h-full w-1/3 cursor-e-resize opacity-0 hover:opacity-100 transition bg-gradient-to-l from-black/20 to-transparent text-white flex items-center justify-end pr-4"
        >
          ›
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={safeIndex === 0 && !prevChapter}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm disabled:opacity-40"
        >
          ‹ Prev
        </button>
        <div className="flex gap-2 text-xs">
          {prevChapter && (
            <Link
              href={`/read/${comic.id}/${prevChapter.id}`}
              className="text-zinc-500 dark:text-zinc-400 hover:underline"
            >
              ← Prev chapter
            </Link>
          )}
          {nextChapter && (
            <Link
              href={`/read/${comic.id}/${nextChapter.id}`}
              className="text-zinc-500 dark:text-zinc-400 hover:underline"
            >
              Next chapter →
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={safeIndex === totalPages - 1 && !nextChapter}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm disabled:opacity-40"
        >
          Next ›
        </button>
      </div>

      <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
        Use ← → arrow keys or click sides to navigate. Press F to toggle fit.
      </p>
    </div>
  );
}