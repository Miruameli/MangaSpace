"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getComicsByIds } from "@/app/actions/comics";
import { getAllBookmarks, getAllProgress } from "@/lib/storage/progress";
import type { Comic } from "@/types/comic";

export default function BookmarksPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, { chapterId: string; page: number }>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ids = getAllBookmarks();
    const p = getAllProgress();
    const m: Record<string, { chapterId: string; page: number }> = {};
    for (const id of Object.keys(p)) m[id] = { chapterId: p[id].chapterId, page: p[id].page };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external storage on mount
    setProgressMap(m);

    getComicsByIds(ids)
      .then((results) => {
        if (cancelled) return;
        setComics(results);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-zinc-500">Loading…</p>;

  if (failed) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Could not load your bookmarks.{" "}
        <Link href="/" className="text-blue-500 hover:underline">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bookmarks & Progress</h1>
      {comics.length === 0 ? (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          No bookmarks yet.{" "}
          <Link href="/" className="text-blue-500 hover:underline">
            Browse library
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
          {comics.map((c) => {
            const prog = progressMap[c.id];
            const ch = prog ? c.chapters.find((x) => x.id === prog.chapterId) : null;
            return (
              <li key={c.id} className="flex items-center gap-4 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.cover} alt={c.title} className="w-12 h-16 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <Link href={`/comic/${c.id}`} className="font-medium text-sm hover:underline">
                    {c.title}
                  </Link>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {prog && ch
                      ? `Ch.${ch.number} · page ${prog.page + 1}/${ch.pages.length}`
                      : "Not started"}
                  </p>
                </div>
                {prog && ch && (
                  <Link
                    href={`/read/${c.id}/${prog.chapterId}?page=${prog.page}`}
                    className="text-xs rounded-md bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
                  >
                    Continue
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}