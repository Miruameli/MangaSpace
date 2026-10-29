"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getProgress, isBookmarked, toggleBookmark } from "@/lib/storage/progress";
import type { Comic, ReadingProgress } from "@/types/comic";

// The comic is resolved on the server (see app/comic/[id]/page.tsx); this
// client component only owns the interactive bookmark and progress state.
export function chapterLabel(number: number, title: string): string {
  const t = String(title ?? "").trim();
  // Strip a trailing colon (and any trailing spaces) only for redundancy
  // detection, so "Chapter 2:" is treated like "Chapter 2".
  const core = t.replace(/:+\s*$/, "").trim().replace(/\s+/g, " ");
  if (!core) return `Chapter ${number}`;
  if (
    core === String(number) ||
    core.toLowerCase() === `chapter ${number}`.toLowerCase()
  ) {
    return `Chapter ${number}`;
  }
  return `Chapter ${number}: ${t}`;
}
export function ComicDetail({ id, comic }: { id: string; comic: Comic | undefined }) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external storage on mount
    setProgress(getProgress(id));
    setBookmarked(isBookmarked(id));
  }, [id]);

  if (!comic) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Comic not found.</p>
        <Link href="/" className="text-blue-500 hover:underline mt-2 inline-block">
          Back to library
        </Link>
      </div>
    );
  }

  function onToggleBookmark() {
    setBookmarked(toggleBookmark(id));
  }

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-6">
      <div>
        <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <Image
            src={comic.cover}
            alt={comic.title}
            fill
            sizes="(max-width: 768px) 100vw, 240px"
            className="object-cover"
          />
        </div>
        <button
          type="button"
          onClick={onToggleBookmark}
          className="mt-3 w-full rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
        </button>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{comic.title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          by {comic.author} · {comic.status}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {comic.genres.map((g) => (
            <span
              key={g}
              className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800"
            >
              {g}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed">{comic.description}</p>

        {progress && (
          <div className="mt-4 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-3 text-sm">
            <p>
              Continue reading:{" "}
              <Link
                href={`/read/${comic.id}/${progress.chapterId}?page=${progress.page}`}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Chapter {comic.chapters.find((c) => c.id === progress.chapterId)?.number ?? "?"} · page{" "}
                {progress.page + 1}
              </Link>
            </p>
          </div>
        )}

        <h2 className="mt-6 text-lg font-semibold">Chapters</h2>
        {comic.chapters.length === 0 && (
          <p className="text-sm text-zinc-500 mt-2">No chapters available.</p>
        )}
        <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
          {comic.chapters.map((ch) => (
            <li key={ch.id}>
              <Link
                href={`/read/${comic.id}/${ch.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="text-sm font-medium">
                  {chapterLabel(ch.number, ch.title)}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {ch.pages.length > 0 ? `${ch.pages.length} pages` : "open to load"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}