"use client";

import { useEffect, useMemo, useState } from "react";
import { ComicCard } from "@/components/comic-card";
import { listComics, ALL_GENRES } from "@/lib/data";
import { getAllProgress } from "@/lib/storage/progress";
import type { Comic } from "@/types/comic";
import type { ReadingProgress } from "@/types/comic";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressMap] = useState<Record<string, ReadingProgress>>(() => getAllProgress());

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async fetch
    setLoading(true);
    listComics(debouncedQuery)
      .then((data) => {
        if (cancelled) return;
        setComics(data);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load comics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    return comics.filter((c) => {
      if (genre !== "all" && !c.genres.includes(genre)) return false;
      if (status !== "all" && c.status !== status) return false;
      return true;
    });
  }, [comics, genre, status]);

  const continueReading = useMemo(() => {
    return Object.values(progressMap)
      .map((p) => {
        const comic = comics.find((c) => c.id === p.comicId);
        if (!comic) return null;
        const chapter = comic.chapters.find((c) => c.id === p.chapterId);
        if (!chapter) return null;
        return { comic, chapter, page: p.page, progress: p };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt)
      .slice(0, 6);
  }, [comics, progressMap]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Browse and read free comics.
        </p>
      </div>

      {continueReading.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Continue reading</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {continueReading.map(({ comic, chapter, page }) => (
              <a
                key={comic.id}
                href={`/read/${comic.id}/${chapter.id}?page=${page}`}
                className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:border-zinc-400 dark:hover:border-zinc-600"
              >
                <div className="font-medium text-sm line-clamp-1">{comic.title}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ch.{chapter.number} · Page {page + 1}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search comics…"
          className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All genres</option>
          {ALL_GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && filtered.length === 0 && !error && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No comics found.</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((c) => (
          <ComicCard key={c.id} comic={c} />
        ))}
      </div>
    </div>
  );
}
