"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_GENRES } from "@/lib/data";
import { ComicCard } from "@/components/comic-card";
import { useLibrarySearch } from "./use-search";
import type { Comic } from "@/types/comic";

// Interactive library UI. The search state and its async lifecycle live in
// `useLibrarySearch`; this component renders the results plus genre/status
// filters on top of the current comic list.
type LibraryViewProps = {
  initialComics: Comic[];
  initialQuery?: string;
  initialSearch?: string;
  initialGenre?: string;
  initialStatus?: string;
  query?: string;
  search?: string;
  genre?: string;
  status?: string;
};

export function LibraryView(props: LibraryViewProps) {
  const initialComics = props.initialComics;
  const initialQuery =
    props.initialQuery ?? props.initialSearch ?? props.query ?? props.search ?? "";
  const initialGenre = props.initialGenre ?? props.genre ?? "all";
  const initialStatus = props.initialStatus ?? props.status ?? "all";

  const { query, setQuery, loading, error, comics, progressMap } =
    useLibrarySearch(initialComics, initialQuery);
  const [genre, setGenre] = useState(initialGenre);
  const [status, setStatus] = useState(initialStatus);

  const genres = useMemo(
    () => Array.from(new Set([...ALL_GENRES, ...initialComics.flatMap((c) => c.genres)])).sort(),
    [initialComics],
  );

  const filtered = useMemo(() => {
    return comics.filter((c) => {
      if (genre !== "all" && !c.genres.includes(genre)) return false;
      if (status !== "all" && c.status !== status) return false;
      return true;
    });
  }, [comics, genre, status]);

  // Keep the active filters reflected in the URL so views are shareable and
  // survive reloads. Also react to browser back/forward navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    // Normalize legacy aliases to the canonical `search` param.
    params.delete("q");
    params.delete("query");
    if (query) params.set("search", query);
    else params.delete("search");
    if (genre && genre !== "all") params.set("genre", genre);
    else params.delete("genre");
    if (status && status !== "all") params.set("status", status);
    else params.delete("status");
    const searchStr = params.toString();
    const newUrl = `${window.location.pathname}${searchStr ? `?${searchStr}` : ""}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (newUrl !== currentUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [query, genre, status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const nextSearch =
        params.get("search") ?? params.get("q") ?? params.get("query") ?? "";
      const nextGenre = params.get("genre") ?? "all";
      const nextStatusRaw = (params.get("status") ?? "all").toLowerCase();
      const nextStatus = nextStatusRaw === "" ? "all" : nextStatusRaw;
      setQuery(nextSearch);
      setGenre(nextGenre);
      setStatus(nextStatus);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {genres.map((g) => (
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
